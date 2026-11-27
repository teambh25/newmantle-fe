# 공지를 Supabase로 옮기기 (할 일)

## 문제
- 공지는 `src/static/notifications.ts` 정적 배열이라, 공지 한 줄을 올리려면 코드를 고치고 PR·배포를 거쳐야 한다
- 간단한 안내도 개발 절차를 거쳐야 해서 올리기 번거롭다
- 관리자 개념이 코드에 없다

## 방향
Supabase `notices` 테이블로 옮기고, 글쓰기·수정은 Supabase 대시보드(Table Editor)에서 직접 한다. 관리자 로그인 페이지는 만들지 않는다.
- 읽기: 누구나 select만 허용 (RLS). 앱은 공지를 서버에서 읽어 `/notices`와 메인 띠에 보여 준다
- 쓰기: 대시보드 계정으로만. 앱에는 쓰는 경로를 두지 않는다
- 사이트 안에서 쓰거나 여러 명이 올려야 할 때만 관리자 페이지를 따로 검토한다 (그때는 역할 확인을 서버에서 한다)

## 할 것
1. 테이블 설계
   - 컬럼: `id`(bigint, 자동 증가), `title`, `content`, `date`, `type`(`update` / `etc` / `incident`)
   - `id`는 기존 공지 번호(1~9)를 그대로 옮긴다. 읽음 처리가 id 비교에 기대므로 바꾸거나 재사용하지 않는다 (`docs/rules/notices.md`)
   - 정렬 규칙(`date` 내림차순, 같은 날짜는 `id` 내림차순)은 쿼리로 맞춘다
2. RLS
   - select만 anon에 허용. insert·update·delete는 열지 않는다 (대시보드는 Supabase 계정으로 접속하므로 영향 없음)
   - SQL로 만든 테이블은 RLS가 자동으로 켜지지 않으니 직접 켠다
3. 데이터 옮기기
   - `src/static/notifications.ts`의 9개를 테이블에 넣는다
   - 옮긴 뒤 화면에서 순서와 읽음 표시가 그대로인지 확인한다
4. 앱 읽기 경로
   - `src/utils/notifications.ts`, `src/components/classic/NotificationFeed.tsx`, `NoticeBanner.tsx`가 정적 배열 대신 조회 결과를 받도록 바꾼다
   - 조회 실패나 로딩 중에 공지가 없을 때 화면이 깨지지 않게 처리한다
   - 공지는 자주 바뀌지 않으니 캐시를 두어 요청 수를 줄인다 (Supabase 메모리 최적화와 함께 본다, `docs/specs/db-perf/plan.md`)
5. 정리
   - `src/static/notifications.ts`를 지우고, `docs/rules/notices.md`의 "데이터" 항목을 테이블 기준으로 고친다
   - 공지 작성 규칙(말투, 종류, 제목)은 그대로 두고 위치만 바꾼다

## 하지 않기로 한 것 (일단)
- 사이트 안 관리자 페이지와 관리자 로그인 (필요해지면 따로 설계)
- 공지 작성 알림(디스코드 등). Database Webhooks는 payload 형식이 고정이라 바로 쓰기 어렵다 (`docs/todo/feedback-supabase.md` 참고)

## 확인할 것
- 대시보드에서 공지를 추가·수정했을 때 배포 없이 화면에 반영되는지 (캐시 시간만큼 늦게 보이는 것은 허용)
- anon key로 insert·update·delete가 막혀 있는지
- 읽음 처리가 옮긴 뒤에도 기존 사용자에게 잘못 뜨지 않는지 (`newmantle_last_seen_notification_id` 저장값과 id가 맞는지)
