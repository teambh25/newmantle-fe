# 피드백 전송 이전 (Make.com → Apps Script)
> 피드백은 계속 Google 시트에 쌓고, 시트에 적는 일을 Make.com 대신 Apps Script 웹앱이 한다. 새 피드백은 디스코드로 알리고, 전송 실패는 Sentry로 알아챈다

## 1. Context
- 배경:
  - 지금은 `src/hooks/useFeedback.ts`가 브라우저에서 Make.com 웹훅으로 POST하고, Make.com 시나리오가 시트에 적는다 (main 기준)
  - 2026-11 Make.com 크레딧이 떨어져 피드백이 시트에 적히지 않았다. 임시로 시나리오를 immediate 모드로 바꿨다 (`docs/todo/make-usage.md`)
  - 시트 쪽 시나리오에 맥락 필드가 연결돼 있지 않아 시트에는 본문과 시간만 있다
  - 나중에 유사도 관련 피드백을 모아 유사도 평가 데이터를 만들려 한다. 그때 퀴즈 날짜와 사용자 식별자가 있어야 서버 로그와 맞춰 볼 수 있다
  - 이 브랜치에서 Supabase `feedback` 테이블로 옮기는 작업을 구현까지 했다가 보류했다 (Dec-1). 고려할 점과 구현 위치는 `docs/todo/feedback-supabase.md`
- 외부 제약:
  - 피드백은 하루 10건 미만이다
  - Supabase는 메모리 부족으로 최적화 중이라 이 작업에서 Supabase를 쓰지 않는다 (`docs/specs/db-perf/plan.md`)
  - Apps Script 웹앱은 CORS 사전 확인(OPTIONS)을 처리하지 못한다. 요청은 `text/plain` 본문으로 보낸다 (Dec-2)
  - 웹앱 주소는 클라이언트 번들에 공개된다. 스팸은 막지 못한다 (Make.com 웹훅과 같음)
  - 디스코드 웹훅 URL은 Apps Script 스크립트 속성에만 둔다. 저장소와 클라이언트에 두지 않는다 (Dec-6)
  - 하루 1회 제한(KST, 브라우저 단위, 보내는 시점 날짜)은 바꾸지 않는다 (`docs/tasks/ui/feedback/decision.md`, Dec-9)
  - 실패 시 입력 유지·재시도 규칙은 없앤다. 화면은 응답을 기다리지 않는다 (Dec-3). 기존 문서(`docs/tasks/ui/feedback`)는 이 작업 범위 밖이라 고치지 않는다
  - Sentry에 피드백 본문을 보내지 않는다. Amplitude에도 보내지 않는 기존 규칙과 같다 (Dec-4)
  - 진입점 3곳(설정 메뉴, classic 결과창, excel 결과 시트의 피드백 행)과 화면 문구는 바꾸지 않는다
- 피드백 한 건을 어디에 무엇으로 남기나 (Dec-7):

  | 값 | 시트 행 | Amplitude |
  | --- | --- | --- |
  | 본문 | 본문 | 보내지 않음 |
  | 퀴즈 날짜 | `quiz_date` | `Feedback Submitted`의 `quiz_date` (같은 값) |
  | 게임 진행 상태 | `game_status` (클라이언트 값) | 보내지 않음 |
  | 사용자 | `user_type` + `subject_id` (클라이언트 값) | 로그인은 user_id, 게스트는 사용자 속성 `guest_id` |
  | 보낸 곳 | 저장 안 함 | `Feedback Submitted`의 `entry` |
  | 테마 | 저장 안 함 | 사용자 속성 `theme` |
  | 받은 시각 | Apps Script가 적음 | 이벤트 시각 |
  | 처리 완료 | 사람이 시트에서 채움 (Dec-12) | 없음 |
- 기존 패턴:
  - 보낼 행 만들기: `buildFeedbackRow` (`src/utils/feedback.ts`, 이 브랜치에서 작성)
  - 게스트 ID: `ensureGuestId()` (`src/utils/guestId.ts`). 처음 만들 때 Amplitude `guest_id`도 보낸다 (Dec-8)
  - 열려 있는 게임 화면의 퀴즈 날짜: `getOpenQuizDate()` (`src/hooks/useGameDate.ts`)
  - Sentry 직접 보고: `src/hooks/useShareLink.ts` (`captureException`에 `feature` 태그)
  - 테스트의 fetch 가로채기: `src/test/fakeGameServer.ts`

## 2. Scope
- In:
  - Apps Script 웹앱: 새 스프레드시트 파일에 행 추가, 디스코드 알림, 내부 오류 시 디스코드 오류 메시지 (Dec-5, Dec-6, Dec-12)
  - Apps Script 코드를 저장소에 파일로 둔다 (Dec-13)
  - `useFeedback`의 전송을 Apps Script로 바꾸고, 응답을 기다리지 않게 한다 (Dec-2, Dec-3)
  - 전송 실패(오류 응답, 네트워크 오류, 무응답)를 Sentry로 보낸다 (Dec-4)
  - 이 브랜치의 Supabase 피드백 코드 삭제: SQL, insert, 테스트 stub (Dec-1)
  - 테스트: Apps Script fake와 Sentry mock (Dec-15)
  - `docs/todo/privacy-terms.md`의 피드백 현황 메모, `docs/todo/make-usage.md` 정리
  - Make.com 시나리오·웹훅 종료 (Dec-14)
- Out:
  - Supabase 테이블 (`docs/todo/feedback-supabase.md`로 보류, Dec-1)
  - 기존 시트 파일의 행을 새 파일로 옮기는 것 (Dec-12)
  - 스팸 차단, 서버 쪽 횟수 제한
  - 로그인 사용자 ID 검증 (Dec-11)
  - 유사도 평가 데이터 만들기(LLM 분류 등)
  - 피드백 화면·문구·진입점 변경
  - `SurveyForm`, `showSurvey`, `ExcelSurveyContent` 이름 정리 → Backlog
  - 처리방침 본문 작성 (탈퇴 구현 뒤 별도 작업)

## 3. Plan

### Phase 1 — 클라이언트 준비 (이미 한 것)
- 범위: feat/amplitude merge, 보낼 행을 만드는 함수, `ensureGuestId()`에서 `guest_id` 전송, `useFeedback`의 `theme` 인자 삭제 (Dec-7, Dec-8, Dec-9, Dec-10)
- 완료 기준: 로직 테스트(`src/utils/feedback.test.ts`, `src/utils/guestId.test.ts`)가 통과한다
- 진행상황: [x] 완료 (2026-11-27) — Supabase 방식 작업 중에 했고, 시트 방식에도 그대로 쓴다

### Phase 2 — Apps Script와 시트 준비
- 범위: Apps Script 코드 작성(Claude, `apps-script/feedback/Code.gs`), 새 스프레드시트 파일과 헤더, 팀원 공유, 스크립트 속성에 디스코드 웹훅 URL, 웹앱 배포(사용자) (Dec-13)
- 완료 기준:
  - Apps Script 코드가 저장소에 있고 디스코드 웹훅 URL이 들어 있지 않다
  - 4. Verification의 Apps Script 확인 항목이 모두 통과한다
- 진행상황: [~] 진행 중 — 코드 작성, 시트 만들기·배포, 실제 웹앱 확인 (2026-11-27). 남은 것: 팀원 공유. 브라우저 응답 읽기·`keepalive`는 Phase 3에서 확인

### Phase 3 — 클라이언트 전환
- 범위: Supabase 피드백 코드 삭제, 전송을 Apps Script로 교체(기다리지 않음, `keepalive`), 실패 시 Sentry 보고, 테스트 교체. 보내는 중 표시(excel의 대기 문구·회전 아이콘)는 기다리지 않으니 없앤다 (Dec-3)
- 완료 기준:
  - `useFeedback.ts`에 Make.com URL과 Supabase insert가 없고, `supabase/migrations/`와 `src/test/fakeFeedbackTable.ts`가 없다
  - 4. Verification의 화면 테스트가 통과한다
  - `npm test`, `npm run lint`, `npm run build`가 통과한다
- 진행상황: [~] 진행 중 — 테스트 작성·실패 확인, 전송 교체, Supabase 피드백 코드 삭제, `npm test`·`npm run lint`·`tsc`·`npm run build` 통과, mutation 확인 (2026-11-27). 남은 것: 화면 확인

### Phase 4 — 배포와 Make.com 종료
- 범위: 프론트 배포, 실제 환경 확인, Make.com 웹훅 큐 처리 대기, 시나리오 종료와 웹훅 삭제
- 완료 기준:
  - 배포 뒤 실제 피드백이 새 시트 파일에 쌓이고 디스코드 알림이 온다
  - Make.com 웹훅 큐가 비었고 배포 뒤 1~2주가 지났다 (Dec-14)
  - Make.com 시나리오가 꺼지고 웹훅이 삭제됐다
- 진행상황: [ ] 대기

### Phase 5 — 문서 정리
- 범위: `docs/todo/privacy-terms.md`의 피드백 현황 메모(저장소, 수집 항목, 처리 위탁 업체에서 Make.com 제외, Sentry·디스코드 추가 여부), `docs/todo/make-usage.md` 정리
- 완료 기준: 두 문서에 Make.com 웹훅이 현재 피드백 경로로 적혀 있지 않다
- 진행상황: [ ] 대기

## 4. Verification
- 테스트 방식은 CLAUDE.md의 Testing 규칙을 따른다. 화면 테스트는 `src/app/feedback.test.tsx`를 고친다
- Apps Script는 fetch를 가로채는 fake로, Sentry는 SDK mock으로 흉내 낸다 (Dec-15)

### 로직 테스트
- 보낼 행 만들기와 게스트 ID 생성 테스트는 Phase 1 그대로 둔다

### 화면 테스트 (전송 흐름)
- 피드백을 입력한 상태 → 보내기 → Apps Script로 요청이 한 번 나가고(`text/plain`, 행 내용), 응답을 기다리지 않고 감사 상태로 바뀌며, 같은 날 다시 보낼 수 없고, `Feedback Submitted`가 한 번 나간다
- Apps Script가 성공 표시 없이 응답하는 상태 → 보내기 → Sentry에 피드백 태그로 한 번 보고되고, 보고에 본문이 없으며, 화면은 감사 상태 그대로다
- 요청이 네트워크 오류로 실패하는 상태 → 보내기 → Sentry에 한 번 보고된다
- Apps Script가 제한 시간 넘게 응답하지 않는 상태 → 보내고 제한 시간이 지남 → Sentry에 한 번 보고된다
- Apps Script가 성공을 돌려주는 상태 → 보내기 → Sentry에 보고되지 않는다
- 게임 화면을 KST 자정 전에 연 채 자정이 지난 뒤 보내기 → 요청 행과 `Feedback Submitted`의 `quiz_date`가 모두 어제이고, 하루 1회 저장값은 오늘이다
- 기존 하루 1회·돌아가기 테스트는 전송 fake만 바꾸고 그대로 둔다

### Apps Script 확인 (배포한 웹앱으로 직접)
상태: 통과(날짜) / 대기

| 확인할 것 | 상태 |
| --- | --- |
| `text/plain` 요청이 사전 확인 없이 나가고, 응답의 성공 표시를 읽을 수 있다 | curl 통과(2026-11-27, `access-control-allow-origin: *`). 브라우저(localhost:3000)는 Phase 3에서 |
| 요청 하나에 새 파일에 행이 하나 생기고, 받은 시각이 적힌다 | 통과(2026-11-27, KST) |
| 새 파일에 사람이 채우는 컬럼(처리 완료 등)을 추가해도 행이 제자리에 들어간다. `done` 칸에 빈 체크박스가 생긴다 | 통과(2026-11-27, 시트 수정 경고 보호를 건 상태에서도) |
| 요청 하나에 디스코드 알림이 하나 온다. 본문의 `@everyone`이 멘션되지 않는다 | 통과(2026-11-27). `allowed_mentions`만으로는 멘션됐고, `@` 뒤 폭 없는 공백을 넣은 뒤 막힘 |
| 시트 쓰기가 실패하면(예: 탭 이름을 바꿈) 디스코드에 오류 메시지가 오고, 응답에 성공 표시가 없다 | 통과(2026-11-27, 탭 이름·헤더 공백으로 실제 발생) |
| 본문이 비었거나 500자를 넘는 요청, 형식이 틀린 요청은 행이 생기지 않고 디스코드에도 알리지 않는다 | 통과(2026-11-27, JSON 아님·501자·`user_type` 값) |
| `=`로 시작하는 본문이 수식이 아니라 글자 그대로 적힌다 (Dec-17) | 통과(2026-11-27) |
| 보내기 직후 탭을 닫아도 행이 생긴다 (`keepalive`) | 통과(2026-11-27) |
| 저장소의 Apps Script 코드에 디스코드 웹훅 URL이 없다 | 통과(2026-11-27) |

### 화면 확인 (localhost:3000)
상태: 통과(날짜) / 대기

| 확인할 것 | 기기 | 상태 |
| --- | --- | --- |
| 세 진입점(설정, classic 결과창, excel 피드백 행)에서 보낸 피드백이 새 파일에 쌓인다 | 데스크톱 | 통과(2026-11-27) |
| 로그인 / 게스트 각각 `user_type`·`subject_id`가 맞다. 게스트는 localStorage `newmantle_guest_id`·게임 요청 `X-Guest-Id`와 같은 값 | 데스크톱 | 통과(2026-11-27) |
| 보내기를 누르면 바로 감사 상태로 바뀐다 | 데스크톱 + 모바일 | 데스크톱 통과(2026-11-27), 모바일 대기 |
| 웹앱 요청만 막아 실패시키면(개발자 도구 요청 차단에 `script.google.com`) Sentry에 `feature: feedback` 이벤트가 들어온다. 오프라인으로 하면 Sentry 전송도 막혀 확인할 수 없다 | 데스크톱 | 통과(2026-11-27, 이벤트 이름 정리 전 `TypeError`로 수신). 정리 뒤 `FeedbackSendError`로 오는지 한 번 더 |

## 5. Prerequisites
- 새 스프레드시트 파일 생성과 Apps Script 배포 권한 (웹앱: 실행 계정은 본인, 접근은 모든 사용자)
- 피드백을 받을 디스코드 채널과 웹훅 URL
- Sentry 프로젝트 접근 (이벤트 확인)
- Make.com 대시보드 접근 (웹훅 큐 건수 확인)

## 6. Glossary
- Apps Script 웹앱: Google 시트에 붙은 스크립트를 URL로 공개한 것. POST를 받으면 `doPost`가 실행된다
- 스크립트 속성: Apps Script의 키-값 설정 저장소. 디스코드 웹훅 URL을 넣어 둔다
- 사전 확인(preflight): 브라우저가 다른 출처로 특정 요청을 보내기 전에 먼저 보내는 OPTIONS 요청
- `keepalive`: `fetch` 옵션. 페이지가 닫혀도 요청을 끝까지 보낸다. HTTP 연결 재사용(keep-alive)과는 다르다
- `user_type` / `subject_id`: 백엔드와 같은 유저 구분. `user`면 Supabase user id, `guest`면 localStorage `newmantle_guest_id`
- 웹훅 큐: Make.com이 실행하지 못한 웹훅 요청을 쌓아 두는 곳

## 7. Backlog
- 피드백 용도가 정해지면 Supabase 테이블로 이전 검토 (`docs/todo/feedback-supabase.md`)
- Amplitude `Feedback Submitted` 수와 시트 행 수를 주기적으로 맞춰 보기 (누락 감지)
- 단어별 구조화 신고 (단어 행마다 순위 이상 신고)
- 유사도 평가 데이터 파이프라인. 피드백 본문은 사용자 입력이라 프롬프트 인젝션이 들어 있을 수 있어, 지시가 아니라 데이터로 다룬다
- 스팸이 생기면 Apps Script에서 걸러내기 또는 서버 경로로 이전
- `SurveyForm`, `showSurvey`, `ExcelSurveyContent`를 Feedback 계열 이름으로 정리
