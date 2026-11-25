-- 피드백 테이블 (docs/specs/feedback-migration)
-- 실행: Supabase 대시보드 SQL Editor에 붙여 넣어 실행한다 (CLI는 쓰지 않음, Dec-12)
--
-- 실행 전에 한 번만:
--   1. Database → Extensions에서 pg_net 활성화 (아래 create extension이 대신 해도 됨)
--   2. 디스코드 웹훅 URL을 Vault에 저장. URL은 이 파일과 저장소에 남기지 않는다 (Dec-11)
--        select vault.create_secret('<디스코드 웹훅 URL>', 'feedback_discord_webhook_url');
--      URL을 바꿀 때:
--        select vault.update_secret(id, '<새 URL>') from vault.secrets where name = 'feedback_discord_webhook_url';

create extension if not exists pg_net with schema extensions;

-- ---- 테이블 (Dec-5, Dec-21) ----
-- theme·entry는 Amplitude에서 추적하므로 두지 않는다

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- 클라이언트 시각을 믿지 않는다
  created_at timestamptz not null default now(),
  feedback text not null
    check (char_length(btrim(feedback)) > 0 and char_length(feedback) <= 500),
  -- 보낸 시점의 KST 퀴즈 날짜. 오늘·어제인지는 검증하지 않는다 (분석용)
  quiz_date date not null,
  game_status text not null check (game_status in ('playing', 'solved', 'given_up')),
  -- 백엔드와 같은 유저 구분 (Dec-6, Dec-7)
  user_type text not null check (user_type in ('user', 'guest')),
  -- user: Supabase user id / guest: localStorage newmantle_guest_id. 게스트 ID가 없으면 클라이언트가 만들어 보낸다 (Dec-22)
  subject_id uuid not null,
  -- 처리 표시 (사람·LLM). 대시보드나 service role로만 바꾼다 (Dec-2, Dec-19)
  status text not null default 'new' check (status in ('new', 'done'))
);

create index feedback_created_at_idx on public.feedback (created_at desc);

-- ---- 권한 (Dec-4) ----
-- RLS는 행만 검사하고 컬럼은 막지 않는다. 클라이언트가 채우는 컬럼에만 insert를 허용한다.
-- select·update·delete 권한과 정책은 두지 않는다 → anon·로그인 사용자 모두 읽기·수정 불가.
-- 그래서 클라이언트는 insert 뒤에 .select()를 붙이지 않는다 (Dec-3)

alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;
grant insert (feedback, quiz_date, game_status, user_type, subject_id)
  on table public.feedback to anon, authenticated;

-- 비로그인: 게스트로만
create policy "feedback_insert_guest" on public.feedback
  for insert to anon
  with check (user_type = 'guest');

-- 로그인: 자기 user id로만 (게스트나 다른 사람으로 위장 불가)
create policy "feedback_insert_user" on public.feedback
  for insert to authenticated
  with check (user_type = 'user' and subject_id = (select auth.uid()));

-- ---- 디스코드 알림 (Dec-11) ----
-- pg_net은 비동기라 디스코드가 느리거나 실패해도 insert와 사용자 응답에 영향이 없다.
-- 알림 준비 중 오류(Vault 미설정, pg_net 없음 등)가 나도 insert는 성공시킨다.

create or replace function public.notify_feedback_discord()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_url text;
begin
  select decrypted_secret into webhook_url
  from vault.decrypted_secrets
  where name = 'feedback_discord_webhook_url'
  limit 1;

  if webhook_url is null then
    raise warning 'feedback_discord_webhook_url이 Vault에 없어 알림을 보내지 않음';
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      -- 본문 최대 500자 + 머리줄 → 디스코드 2000자 제한 안
      'content', format(
        E'[%s · %s · %s]\n%s',
        new.quiz_date, new.game_status, new.user_type, new.feedback
      ),
      -- 본문의 @everyone, @here, 역할·유저 멘션이 알림으로 나가지 않게
      'allowed_mentions', jsonb_build_object('parse', jsonb_build_array())
    )
  );
  return new;
exception when others then
  raise warning 'feedback 디스코드 알림 실패: %', sqlerrm;
  return new;
end;
$$;

revoke execute on function public.notify_feedback_discord() from public, anon, authenticated;

create trigger feedback_notify_discord
  after insert on public.feedback
  for each row execute function public.notify_feedback_discord();
