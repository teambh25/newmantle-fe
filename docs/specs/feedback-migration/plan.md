# 피드백 저장소 이전 (Make.com → Supabase)
> 피드백을 Make.com 웹훅 → Google Sheet 대신 Supabase `feedback` 테이블에 저장하고, 새 피드백을 디스코드로 알린다

## 1. Context
- 배경:
  - 지금은 `src/hooks/useFeedback.ts`가 브라우저에서 Make.com 웹훅으로 바로 POST하고, Make.com 시나리오가 Google Sheet에 적는다
  - 2026-11 Make.com 크레딧이 떨어져 피드백이 시트에 적히지 않았다. 임시로 시나리오를 interval 모드에서 immediate 모드로 바꿨다 (`docs/todo/make-usage.md`)
  - 웹훅 URL이 클라이언트 번들에 노출돼 있어 누구나 호출할 수 있다
  - 시트 쪽 시나리오에 `quizDate` 등 맥락 필드가 연결돼 있지 않아, 시트에는 본문과 시간만 있다
  - 나중에 유사도 관련 피드백을 모아 검증 데이터로 쓰려 한다 (LLM으로 분류). 이때 유저 ID와 퀴즈 날짜가 있어야 서버 로그와 맞춰 맥락을 만들 수 있다
- 외부 제약:
  - Supabase는 이미 로그인과 `profiles` 테이블에 쓰고 있다. 같은 프로젝트에 테이블을 추가한다
  - anon key는 공개 값이다. 보안은 RLS와 컬럼 권한으로만 지킨다
  - 하루 1회 제한(KST, 브라우저 단위), 실패 시 입력 유지·재시도, Amplitude 이벤트(`Feedback Opened`, `Feedback Submitted`, 본문 제외) 등 기존 피드백 규칙은 바꾸지 않는다 (`docs/tasks/ui/feedback/decision.md`)
  - 진입점 3곳(설정 메뉴, classic 결과창, excel 결과 시트의 피드백 행)과 화면은 바꾸지 않는다. 바뀌는 것은 전송 경로와 보내는 필드뿐이다
  - 게스트 ID가 없을 때 피드백 때문에 새로 만들지 않는다 (`getAuthHeader()`를 재사용하지 않는다) (Dec-8)
  - 디스코드 웹훅 URL은 저장소와 클라이언트에 두지 않는다 (Dec-11)
  - 서버 로그(게임·link)는 한 달 뒤 삭제된다. 분석용 로그는 사용자가 로컬에 따로 보관하고 있다
- 기존 패턴:
  - 클라이언트에서 Supabase 테이블에 직접 insert: `src/components/NicknameSetupModal.tsx:54` (`profiles`)
  - 유저 구분 체계: 백엔드 stats API의 `/v2/stats/{user_type}/{subject_id}` (`docs/api/stats.md`)
  - 게스트 ID: localStorage `newmantle_guest_id` (`src/utils/api.ts`), 로그인 연동 후 삭제 (`src/hooks/useGuestLink.ts`)
  - 요청 타임아웃: `AbortController` 3초 (`src/utils/api.ts`)
  - 테스트용 Supabase mock: `src/test/setup.ts`, 웹훅 fake: `src/test/fakeFeedbackWebhook.ts`

## 2. Scope
- In:
  - Supabase `feedback` 테이블, RLS, 컬럼 권한, check 제약 (Dec-4, Dec-5)
  - 저장 필드: 본문, `quiz_date`, `theme`, `entry`, `game_status`, `user_type`, `subject_id`, `status`, `memo`, `created_at` (Dec-2, Dec-6, Dec-7, Dec-8)
  - insert 시 디스코드 알림 트리거 (`pg_net`, Vault) (Dec-11)
  - SQL을 저장소에 파일로 남긴다: `supabase/migrations/` (Dec-12)
  - `useFeedback`의 전송을 Supabase insert로 바꾸고, 보낼 행을 만드는 로직을 `utils` 순수 함수로 뺀다 (Dec-3, Dec-16)
  - 테스트: 웹훅 fake를 Supabase insert stub으로 바꾼다 (Dec-16)
  - `docs/todo/privacy-terms.md`의 피드백 현황 메모 갱신 (Dec-17)
  - Make.com 시나리오·웹훅 종료 (Dec-14)
- Out:
  - 기존 시트 데이터를 Supabase로 옮기는 것 (Dec-13)
  - 서버를 거치는 경로(Route Handler, 백엔드 엔드포인트)와 서버 쪽 횟수 제한 (Dec-3)
  - DB에서 하루 1회 막기 (Dec-10)
  - 게스트 → 로그인 전환 시 ID 보정 (Dec-9)
  - 회원 탈퇴 시 피드백 처리. `docs/tasks/withdrawal/plan.md` 6절 결정 필요로 넘김 (Dec-18)
  - 처리방침 본문 작성 (탈퇴 구현 뒤 별도 작업)
  - `SurveyForm`, `showSurvey`, `ExcelSurveyContent` 이름 정리 → Backlog (Dec-17)
  - 피드백 화면·문구·진입점 변경
  - 기존 `profiles` 테이블 SQL을 저장소로 옮기는 것
  - Supabase CLI 도입

## 3. Plan

### Phase 1 — Supabase 준비
- 범위: `supabase/migrations/<날짜>_feedback.sql` 작성(테이블, check, RLS, 권한, 디스코드 트리거), Vault에 디스코드 웹훅 URL 저장, 대시보드 SQL Editor에서 실행, 팀원 초대
- 완료 기준:
  - SQL 파일이 저장소에 있고, 디스코드 웹훅 URL이 들어 있지 않다
  - 4. Verification의 Supabase 확인 항목이 모두 통과한다
- 진행상황: [ ] 대기

### Phase 2 — 클라이언트 전환
- 범위: 보낼 행을 만드는 순수 함수, `useFeedback` 전송을 Supabase insert로 교체(3초 타임아웃), 테스트 stub 교체, 웹훅 body 테스트를 로직 테스트로 이동
- 완료 기준:
  - `useFeedback.ts`에 Make.com URL이 없다
  - `src/test/fakeFeedbackWebhook.ts`가 삭제되고, 기존 피드백 테스트(하루 1회, 실패 재시도, 돌아가기, Amplitude)가 Supabase stub으로 통과한다
  - `npm test`, `npm run lint`, `npm run build`가 통과한다
- 진행상황: [ ] 대기

### Phase 3 — 배포와 Make.com 종료
- 범위: 프론트 배포, 실제 환경에서 확인, Make.com 웹훅 큐 처리 대기, 시나리오 종료와 웹훅 삭제
- 완료 기준:
  - 배포 뒤 실제 피드백이 Supabase에 쌓이고 디스코드 알림이 온다
  - Make.com 웹훅 큐가 비었고 배포 뒤 1~2주가 지났다 (Dec-14)
  - Make.com 시나리오가 꺼지고 웹훅이 삭제됐다
- 진행상황: [ ] 대기

### Phase 4 — 문서 정리
- 범위: `docs/todo/privacy-terms.md`의 피드백 현황 메모 갱신 (저장소, 수집 항목, 진입점 3곳, 처리 위탁 업체에서 Make.com·Google 제외), `docs/todo/make-usage.md` 정리
- 완료 기준: 두 문서에 Make.com 웹훅이 현재 피드백 경로로 적혀 있지 않다
- 진행상황: [ ] 대기

## 4. Verification
- 테스트 방식은 CLAUDE.md의 Testing 규칙을 따른다. 화면 테스트는 기존 `src/app/feedback.test.tsx`를 고친다
- 테스트에서 Supabase는 `src/test/setup.ts`의 client mock에 `from('feedback').insert`(성공 / 오류 응답 / 네트워크 오류 / 대기) stub을 추가해 흉내 낸다. 로그인 케이스는 그 테스트 파일에서 세션을 덮어쓴다

### 로직 테스트 (보낼 행 만들기)
- 로그인한 상태 → 행을 만든다 → `user_type`은 user, `subject_id`는 세션의 user id
- 로그인하지 않았고 localStorage에 게스트 ID가 있는 상태 → 행을 만든다 → `user_type`은 guest, `subject_id`는 그 게스트 ID
- 로그인하지 않았고 게스트 ID가 없는 상태 → 행을 만든다 → `subject_id`는 null이고, localStorage에 게스트 ID가 새로 생기지 않는다
- 입력 앞뒤에 공백이 있는 상태 → 행을 만든다 → 본문은 앞뒤 공백을 뺀 값
- 오늘 퀴즈를 맞힘 / 포기 / 진행 중인 상태 → 행을 만든다 → `quiz_date`는 그 KST 날짜이고 `game_status`는 각각 solved / given_up / playing
- 진입점과 테마가 정해진 상태 → 행을 만든다 → `entry`와 `theme`가 그 값
- 어떤 상태든 → 행을 만든다 → `status`, `memo`, `created_at`은 행에 없다

### 화면 테스트 (전송 흐름)
- 피드백을 입력한 상태 → 보내기 → `feedback` 테이블에 한 행이 insert되고, 감사 상태로 바뀌며, 같은 날 다시 보낼 수 없다
- insert가 오류를 돌려주는 상태 → 보내기 → 실패 알림이 보이고, 입력이 남아 있으며, 다시 보낼 수 있다
- insert가 네트워크 오류로 실패하는 상태 → 보내기 → 실패 알림이 보이고, 다시 보낼 수 있다
- insert가 3초 넘게 응답하지 않는 상태 → 보내기 후 3초가 지남 → 실패 알림이 보이고, 다시 보낼 수 있다
- 기존 하루 1회·돌아가기·Amplitude 테스트는 전송 stub만 바꾸고 그대로 둔다

### Supabase 확인 (프론트 테스트로 확인 불가, 대시보드·anon key로 직접)
상태: 통과(날짜) / 대기

| 확인할 것 | 상태 |
| --- | --- |
| `feedback` 테이블에 RLS가 켜져 있다 | 대기 |
| anon key로 select / update / delete를 하면 거부된다 | 대기 |
| anon key로 `status`, `memo`, `created_at`을 넣은 insert는 거부된다 | 대기 |
| 비로그인(anon)으로 `user_type = 'user'` insert는 거부된다 | 대기 |
| 로그인한 사용자가 다른 user id나 `user_type = 'guest'`로 insert하면 거부된다 | 대기 |
| 본문이 빈 값이거나 500자를 넘으면, `theme`·`entry`·`game_status`·`user_type`이 허용 값이 아니면 거부된다 | 대기 |
| insert 하나에 디스코드 알림이 하나 온다. 본문의 `@everyone`이 멘션되지 않는다 | 대기 |
| 디스코드 웹훅 URL이 틀려도(알림 실패) insert는 성공한다 | 대기 |
| 대시보드 Table Editor에서 `status`, `memo`를 바꿀 수 있다 | 대기 |

### 화면 확인 (localhost:3000)
상태: 통과(날짜) / 대기

| 확인할 것 | 기기 | 상태 |
| --- | --- | --- |
| 세 진입점(설정, classic 결과창, excel 피드백 행)에서 보낸 피드백이 Supabase에 쌓이고 `entry`·`theme`가 맞다 | 데스크톱 | 대기 |
| 로그인 / 게스트 각각 `user_type`·`subject_id`가 맞다 | 데스크톱 | 대기 |
| 보내는 동안 체감 지연이 이전과 비슷하다 | 데스크톱 + 모바일 | 대기 |

## 5. Prerequisites
- Supabase 프로젝트 대시보드 권한 (SQL Editor, Vault, Database Extensions에서 `pg_net` 활성화)
- 피드백을 받을 디스코드 채널과 웹훅 URL
- 팀원의 Supabase 프로젝트 초대
- Make.com 대시보드 접근 (웹훅 큐 건수, 크레딧 충전 후 시나리오 재활성화 필요 여부 확인)
- TODO: 백엔드 `POST /v2/stats/link` 요청 로그에 게스트 ID와 user id가 함께 남는지 확인 (게스트 → 로그인 전환 분석용, Dec-9)

## 6. Glossary
- `user_type` / `subject_id`: 백엔드와 같은 유저 구분. `user`면 Supabase user id, `guest`면 localStorage `newmantle_guest_id`
- RLS: Supabase(Postgres) 행 단위 보안 정책. anon key로 들어온 요청이 어떤 행을 읽고 쓸 수 있는지 정한다
- 컬럼 권한: `grant insert (컬럼, ...)`. RLS는 컬럼을 막지 않으므로, 클라이언트가 채울 수 있는 컬럼을 따로 제한한다
- `pg_net`: Postgres에서 HTTP 요청을 비동기로 보내는 Supabase 확장. 트리거에서 디스코드로 알림을 보낼 때 쓴다
- Vault: Supabase의 비밀 값 저장소. 디스코드 웹훅 URL을 넣어 둔다
- 웹훅 큐: Make.com이 실행하지 못한 웹훅 요청을 쌓아 두는 곳

## 7. Backlog
- 단어별 구조화 신고 (단어 행마다 순위 이상 신고): `{ quiz_date, word, rank, 방향 }`을 별도 테이블에. UI와 서버 작업 필요 (Dec-15)
- LLM 유사도 검증 파이프라인: 피드백 분류 결과와 로그에서 뽑은 맥락을 별도 테이블(`feedback_labels` 등)에 저장 (Dec-15)
- 스팸이 생기면 Route Handler(service role) 경로와 IP 기준 횟수 제한으로 이전 (Dec-3)
- `SurveyForm`, `showSurvey`, `ExcelSurveyContent`를 Feedback 계열 이름으로 정리 (Dec-17)
