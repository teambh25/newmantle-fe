# 피드백 Supabase 이전 (보류)

피드백을 Supabase `feedback` 테이블에 저장하고 디스코드로 알리는 작업을 구현까지 했다가 보류했다 (2026-11-27). 지금은 Google 시트를 유지하고 Make.com만 Apps Script로 바꾼다.

## 보류한 이유

- Supabase가 메모리 부족으로 최적화 중이다 (`docs/specs/db-perf/plan.md`). 피드백은 하루 10건 미만이라 insert 부하는 작지만, 알림용 `pg_net`은 Postgres 안에 상주 워커를 하나 더 띄운다. 이후 분석 작업이 생기면 주기적인 쿼리도 생긴다
- 피드백을 어떻게 쓸지(유사도 평가 데이터 만들기)가 아직 구체적이지 않다. 용도가 정해진 뒤 그에 맞는 스키마로 만드는 편이 낫다
- 스팸·주소 공개 문제는 Supabase로 옮겨도 풀리지 않는다 (anon key도 공개 값)

## 다시 꺼낼 때

- Supabase 메모리 문제가 정리됐는지 먼저 본다
- 시트에 쌓인 데이터는 CSV로 새 테이블에 옮길 수 있다. 시트 컬럼을 그때 테이블 스키마에 맞춰 둔다

## 중요하게 고려할 것

### 보안 (anon key로 브라우저에서 직접 insert할 때)
- SQL로 만든 테이블은 RLS가 자동으로 켜지지 않는다. `enable row level security`를 반드시 넣는다
- RLS는 행만 검사하고 컬럼은 막지 않는다. anon·authenticated 권한을 전부 회수한 뒤, 클라이언트가 채우는 컬럼에만 `grant insert (...)`를 준다. 그러지 않으면 `status`, `created_at` 같은 관리용 컬럼을 클라이언트가 넣을 수 있다
- insert 정책으로 위장을 막는다: 회원은 `subject_id = auth.uid()`, 게스트는 `auth.uid() is null`
- select 권한이 없으므로 insert 뒤에 `.select()`를 붙이면 실패한다

### 데이터 검증
- DB가 마지막 방어선이다. check로 본문 길이와 허용 값을 제한하고, `created_at`은 DB `now()`로 정한다 (클라이언트 시각을 믿지 않는다)
- 회원 `subject_id`는 JWT와 RLS로 엄밀하다. 게스트 ID와 `game_status`(localStorage 값)는 사용자가 바꿀 수 있다. 이 점을 컬럼 설명(`comment on column`)에 남긴다

### 디스코드 알림
- Supabase Database Webhooks는 payload 형식이 고정이라 디스코드가 받지 않는다. 트리거 함수 + `pg_net`으로 직접 보낸다
- 웹훅 URL은 Vault에 둔다. 프론트에서 직접 보내면 URL(토큰 포함)이 노출돼 누구나 메시지를 보내거나 웹훅을 지울 수 있다
- 본문에 `@everyone` 등이 있어도 울리지 않게 `allowed_mentions: { parse: [] }`를 넣는다. 인용(`>`)으로 감싸도 멘션은 울린다
- 알림 준비 중 오류(Vault 미설정 등)가 insert를 실패시키지 않게 경고만 남긴다
- `pg_net`은 백그라운드 워커 1개, 응답 기록은 기본 6시간 보관. 메모리가 문제면 Route Handler에서 insert와 알림을 함께 하는 방식으로 바꾼다

### 전환
- 배포 뒤에도 이전 번들을 띄운 탭은 한동안 이전 경로로 보낸다. 이전 경로는 1~2주 뒤에 끈다
- 회원 탈퇴 시 피드백 처리: `subject_id`가 회원·게스트 공용 컬럼이라 `auth.users` FK cascade를 걸 수 없다. 탈퇴 로직에서 직접 다룬다 (`docs/tasks/withdrawal/plan.md`)
- 팀원이 대시보드로 보려면 프로젝트에 초대해야 하고, 다른 테이블도 보인다

### 테스트
- `src/test/setup.ts`의 Supabase mock에는 `from`이 없어 insert stub을 따로 둬야 한다
- RLS·권한은 프론트 테스트로 확인할 수 없다. anon key로 직접 확인한다 (select·update·delete 거부, 관리용 컬럼 insert 거부, 위장 insert 거부)

## 구현 참고

`feedback-migration` 브랜치 커밋 ee0da94(Supabase 방식 마지막 상태)에 구현이 있다. main에는 squash merge로 들어가 남지 않으니 브랜치에서 본다.
- SQL: `supabase/migrations/20261125000000_feedback.sql` (테이블, check, RLS, 컬럼 권한, 디스코드 트리거)
- insert 전송: `src/hooks/useFeedback.ts`, 테스트 stub: `src/test/fakeFeedbackTable.ts`
- 결정 기록 전체: 같은 커밋의 `docs/specs/feedback-migration/decisions.md`
