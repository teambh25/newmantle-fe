# Decisions — 피드백 전송 이전 (Make.com → Apps Script)

> 영향도: foundation(스펙 간) · significant(여러 부분) · local(단일 단위)
> 출처: user-suggested(사람 제안·사람 선택) · ai-suggested(AI 제안·사람 선택) · ai-selected(AI 제안·AI 선택)
> 상태: active · superseded by Dec-N · revoked
>
> Supabase 방식으로 작업하던 때의 결정 기록은 커밋 ee0da94의 이 파일에 있다. 중요한 고려 사항은 `docs/todo/feedback-supabase.md`

---

### Dec-1. 피드백을 어디에 저장하나
영향도: foundation · 출처: user-suggested

문제 — Make.com 크레딧이 떨어져 피드백이 시트에 적히지 않는다. 어디에, 어떤 경로로 저장하나?
옵션
  (A) Google 시트 유지, Make.com만 Apps Script 웹앱으로 교체
  (B) Supabase `feedback` 테이블 (이 브랜치에서 구현까지 함)
  (C) Make.com 유지, 사용량 줄이기 (스케줄 간격 늘리기, immediate 모드)
  (D) 게임 백엔드에 엔드포인트 추가
선택 — A
근거 — 피드백을 어떻게 쓸지(유사도 평가 데이터)가 아직 구체적이지 않아, 용도가 정해진 뒤 맞는 스키마로 테이블을 만드는 편이 낫다. 시트는 컬럼을 자유롭게 늘릴 수 있고 하루 10건 미만이라 손으로 다루기 쉽다. B는 Supabase가 메모리 부족으로 최적화 중이라 알림용 `pg_net` 상주 워커와 이후 분석 쿼리가 부담이 될 수 있다. 주소 공개·스팸은 B로도 풀리지 않는다. C는 사용량 한도가 그대로 남는다. D는 백엔드 작업이 든다. B의 구현과 고려 사항은 `docs/todo/feedback-supabase.md`로 옮기고 이 브랜치의 Supabase 코드는 지운다
영향 — 전체. Phase 2, Phase 3, Backlog
상태 — active

### Dec-2. 브라우저에서 Apps Script로 어떤 형식으로 보내나
영향도: local · 출처: ai-suggested

문제 — Apps Script 웹앱은 CORS 사전 확인을 처리하지 못한다. 어떻게 보내고, 결과를 어떻게 알까?
옵션
  (A) 지금처럼 `application/json` (사전 확인이 나가 막힌다)
  (B) `mode: "no-cors"` (요청은 가지만 응답을 읽을 수 없다)
  (C) `Content-Type: text/plain`으로 JSON 문자열을 보내고, Apps Script가 성공 표시(`{ ok: true }`)를 돌려준다
선택 — C
근거 — `text/plain`은 사전 확인 없이 나간다. 가장 흔한 실패(스크립트 오류, 권한 만료, 탭 이름 변경)는 네트워크 오류가 아니라 응답으로 오므로, 응답을 읽어야 실패를 Sentry로 보낼 수 있다(Dec-4). B는 이런 실패가 모두 성공처럼 보인다. Apps Script는 첫 POST에서 `doPost`를 실행하고 결과는 리다이렉트된 주소에서 받는다. 응답을 읽을 수 있는지는 배포 뒤 확인한다 (Verification)
영향 — `src/hooks/useFeedback.ts`, Apps Script `doPost`, Dec-4
상태 — active

### Dec-3. 화면이 Apps Script 응답을 기다리나
영향도: significant · 출처: ai-suggested

문제 — Apps Script는 첫 호출이 1~3초 걸리기도 한다. 응답을 기다렸다가 감사 상태로 바꿀까, 바로 바꿀까?
옵션
  (A) 기다린다. 실패하면 알림을 띄우고 입력을 남겨 다시 보내게 한다 (기존 규칙, 제한 시간을 늘림)
  (B) 기다리지 않는다. 누르면 바로 감사 상태로 바꾸고, 요청은 `keepalive`로 뒤에서 보낸다
선택 — B
근거 — 한 건씩 우연히 실패할 확률은 낮다. 걱정할 실패는 설정 문제로 모두 실패하는 경우인데, A의 실패 알림은 사용자에게만 보이고 우리에게는 오지 않는다. 사용자가 다른 경로로 알려 줄 일도 거의 없다. A가 얻는 것은 그 사용자가 그 자리에서 다시 보낼 수 있다는 것뿐이고, 누락 감지는 어느 쪽이든 Sentry가 한다(Dec-4). B는 느린 첫 호출을 사용자가 기다리지 않는다. `keepalive`는 보내자마자 탭을 닫아도 요청이 끝까지 가게 한다. 이 결정은 `docs/tasks/ui/feedback`의 실패 시 입력 유지·재시도 규칙을 뒤집는다 (기존 문서는 범위 밖이라 고치지 않음)
영향 — `src/hooks/useFeedback.ts`, `src/app/feedback.test.tsx`(실패 재시도 테스트 삭제), Dec-4, Dec-16
상태 — active

### Dec-4. 전송 실패를 어떻게 알아채나
영향도: significant · 출처: user-suggested

문제 — 화면이 실패를 보여 주지 않으면(Dec-3) 피드백이 사라져도 모른다. 어떻게 알까?
옵션
  (A) Sentry 자동 수집에 맡긴다
  (B) 뒤에서 응답을 확인해, 성공 표시가 없거나 네트워크 오류·제한 시간 초과면 `Sentry.captureException`으로 직접 보낸다
  (C) Amplitude 수와 시트 행 수를 맞춰 보는 것만 한다
선택 — B (C는 Backlog)
근거 — Sentry는 잡히지 않은 오류만 자동으로 보낸다. 실패를 `catch`하면 아무것도 가지 않아 A로는 안 잡힌다. 보고에는 `feature: "feedback"` 태그를 달고 본문은 넣지 않는다(Amplitude와 같은 규칙). 응답이 오지 않는 경우도 잡도록 제한 시간을 두고 넘으면 보고한다. 페이지가 닫힌 뒤에는 응답 확인 코드가 실행되지 않아 그 경우의 실패는 보고되지 않는다(감수). 설정 문제로 모두 실패하면 하루 몇 건 중 하나는 잡혀 알 수 있다
영향 — `src/hooks/useFeedback.ts`, Dec-15
상태 — active

### Dec-5. Apps Script 내부 오류를 어떻게 알리나
영향도: local · 출처: ai-suggested

문제 — 시트 쓰기 실패처럼 Apps Script 안에서 난 오류는 어떻게 알까?
옵션
  (A) 성공 표시 없이 응답하는 것만으로 둔다 (프론트가 Sentry로 보고)
  (B) `doPost`에서 `try/catch`로 잡아 디스코드에 오류 메시지를 보내고, 성공 표시 없이 응답한다
선택 — B
근거 — 프론트 보고는 페이지가 닫히거나 광고 차단기가 Sentry를 막으면 빠진다. 스크립트 쪽에서도 알리면 두 곳에서 감시된다. 오류 메시지에도 본문은 넣지 않는다
영향 — Apps Script `doPost`, Dec-6
상태 — active

### Dec-6. 새 피드백 디스코드 알림을 어떻게 보내나
영향도: local · 출처: ai-suggested

문제 — 새 피드백 알림을 어디서 보내고, 무엇을 담나?
옵션
  (A) Apps Script가 시트에 쓴 뒤 `UrlFetchApp`으로 디스코드 웹훅에 보낸다
  (B) 프론트에서 디스코드 웹훅으로 직접 보낸다
선택 — A
근거 — B는 웹훅 URL(토큰 포함)이 브라우저에 노출돼 누구나 메시지를 보내거나 웹훅을 지울 수 있다. A는 URL을 스크립트 속성에 두어 저장소와 클라이언트에 남지 않고, 시트에 쓴 행만 알린다. 메시지에는 퀴즈 날짜와 본문만 담는다(Supabase 방식 때 사용자가 정한 내용). 본문 속 멘션이 울리지 않게 `allowed_mentions: { parse: [] }`를 넣고, 디스코드 길이 제한에 맞게 자른다. 알림이 실패해도 행 쓰기는 성공으로 본다
영향 — Apps Script, Dec-5
상태 — active

### Dec-7. 시트 행에 무엇을 남기나
영향도: significant · 출처: user-suggested

문제 — 피드백 한 건에 대해 시트 행과 Amplitude에 각각 무엇을 남기나?
옵션
  (A) 지금처럼 본문과 시간만
  (B) 본문, `quiz_date`, `game_status`, `user_type`, `subject_id`, 받은 시각. `theme`, `entry`는 Amplitude에만
선택 — B
근거 — 유사도 관련 피드백의 맥락(어떤 단어를 말하는지)은 퀴즈 날짜와 사용자 식별자로 서버 로그와 맞춰야 알 수 있다. 맥락 자체는 저장하지 않는다. `theme`, `entry`는 Amplitude가 추적한다. 두 곳을 잇는 값(`quiz_date`, 사용자 식별자)만 둘 다 둔다. 받은 시각은 클라이언트 시각을 믿지 않고 Apps Script가 적는다. 처리 완료 여부는 사람이 시트에서 직접 채우는 컬럼으로 따로 둔다 (Dec-12). 게스트 UUID는 다른 정보와 연결되면 개인정보라 처리방침 메모에 반영한다 (Phase 5). Supabase 방식 때 정한 내용을 이어받았다
영향 — `src/utils/feedback.ts`, Apps Script, plan.md Context 표
상태 — active

### Dec-8. 게스트 ID가 없을 때 피드백에서 만든다
영향도: local · 출처: ai-suggested

문제 — 게임 요청을 한 번도 하지 않아 게스트 ID가 없는 사람이 피드백을 보내면? 처음 만들 때 Amplitude `guest_id`는 어디서 보내나?
옵션
  (A) 만들지 않고 `subject_id`를 비워 둔다
  (B) `ensureGuestId()`로 게임 요청과 같은 방식으로 만들고, 처음 만들 때 그 함수 안에서 `guest_id`를 보낸다
  (C) 페이지에 들어오자마자 모든 방문자에게 만든다
선택 — B
근거 — 게스트 ID는 트래킹이 필요한 행동을 했을 때만 발급하고, 피드백 전송도 그 행동으로 본다. 만드는 곳에서 보내야 생성 경로가 늘어도 `guest_id`가 빠지지 않는다. `ensureGuestId()`는 ID 문자열만 돌려준다. A는 그 피드백을 서버 로그와 맞춰 볼 수 없다. C는 로그인 연동, 도전장 링크, 개인정보 수집 범위까지 바뀌어 범위를 넘는다. Supabase 방식 때 정하고 구현한 것을 이어받았다
영향 — `src/utils/guestId.ts`, `src/utils/api.ts`, `src/utils/feedback.ts`, Phase 1
상태 — active

### Dec-9. 퀴즈 날짜와 하루 1회 저장값의 날짜
영향도: local · 출처: user-suggested

문제 — 행의 `quiz_date`와 하루 1회 판정 저장값은 각각 어느 날짜인가?
옵션
  (A) 둘 다 보내는 시점의 KST 날짜 (기존)
  (B) `quiz_date`는 열려 있는 게임 화면의 퀴즈 날짜(없으면 KST 오늘), 하루 1회 저장값은 보내는 시점의 KST 날짜
선택 — B
근거 — 화면을 연 채 자정이 지나면 사용자는 어제 퀴즈를 보고 있고 서버 로그도 어제 날짜로 남는다. Amplitude `Feedback Submitted`와 같은 값이 된다. `game_status`도 같은 날짜의 게임 기록으로 읽는다. 하루 1회 제한은 바꾸지 않는 기존 규칙이라, 저장값까지 바꾸면 자정 뒤 어제 화면에서 보낸 사람이 같은 날 다시 보낼 수 있다. Supabase 방식 때 정한 내용을 이어받았다
영향 — `src/hooks/useFeedback.ts`, `src/utils/feedback.ts`, `src/app/feedback.test.tsx`(자정 케이스)
상태 — active

### Dec-10. `useFeedback`의 `theme` 인자를 지운다
영향도: local · 출처: user-suggested

문제 — 행에 `theme`가 없으면(Dec-7) `useFeedback({ entry, theme })`의 `theme`를 아무도 쓰지 않는다. 정리할까?
옵션
  (A) 인자와 호출처 3곳을 정리
  (B) Backlog로 넘김
선택 — A
근거 — 쓰지 않는 인자는 테마별로 다르게 동작한다는 오해를 준다. 호출처 3곳에서 한 줄씩이라 작다. 이미 구현했다
영향 — `src/hooks/useFeedback.ts`, classic·excel `SurveyForm`, excel `FeedbackRow`
상태 — active

### Dec-11. 클라이언트가 보낸 값을 검증하나
영향도: local · 출처: ai-suggested

문제 — `user_type`, `subject_id`, `game_status`는 클라이언트 값이다. Apps Script에서 검증할까?
옵션
  (A) 검증하지 않고 클라이언트 값임을 알고 쓴다. 본문 길이와 필드 존재만 확인한다
  (B) 로그인 사용자는 Supabase JWT를 함께 보내 Apps Script에서 검증한다
선택 — A
근거 — 게스트 ID와 `game_status`는 어느 방식으로도 검증되지 않는다. 회원 ID 검증은 B로 가능하지만 JWT 검증 코드가 Apps Script에 들어가고, 피드백에는 그 정도 엄밀함이 필요 없다. 정확한 기록은 서버 로그·통계로 확인한다. 본문이 비었거나 500자를 넘으면 행을 쓰지 않는다(화면 제한과 같은 값). 시트 헤더 메모에 클라이언트 값임을 남긴다
영향 — Apps Script, Verification
상태 — active

### Dec-12. Apps Script는 어느 시트에 쓰나
영향도: local · 출처: ai-suggested

문제 — 컬럼이 바뀌니(`quiz_date`, 사용자 식별자, `game_status` 등) 새로 쓸 곳이 필요하다. Make.com이 쓰는 곳과 어떻게 나누나?
옵션
  (A) 기존 탭에 컬럼을 추가해 이어 쓴다
  (B) 같은 스프레드시트 파일에 새 탭을 만든다
  (C) 새 스프레드시트 파일을 만들고 Apps Script를 그 파일에 붙인다. 기존 파일은 보관용으로 둔다
선택 — C
근거 — 전환 기간(Dec-14)에는 Make.com과 Apps Script가 동시에 써서, 한 곳에 쓰면 컬럼 구성이 다른 행이 섞인다. 기존 행에는 퀴즈 날짜와 식별자가 없어 성격도 다르다. 예전에 새 탭을 만들었더니 Make.com이 새 탭에 썼다(사용자 관찰). 그래서 B는 Make.com이 탭을 고르는 방식(이름·위치)을 확인해야 하고, 탭 순서를 바꾸면 다시 섞일 수 있다. C는 Make.com이 기존 파일만 알아 서로 엮이지 않는다. 대신 팀원에게 새 파일을 공유한다. Apps Script는 탭을 이름으로 찾고 헤더 이름에 맞춰 값을 넣는다. 그래서 처리 완료처럼 사람이 채우는 컬럼을 추가하거나 순서를 바꿔도 깨지지 않는다. 기존 행은 옮기지 않는다
영향 — Apps Script, Phase 2, Phase 4
상태 — active

### Dec-13. Apps Script 코드를 어디서 관리하나
영향도: local · 출처: ai-suggested

문제 — Apps Script 코드를 편집기에만 둘까, 저장소에도 둘까?
옵션
  (A) Apps Script 편집기에만 둔다
  (B) 저장소에 파일로 두고, 배포는 편집기에 붙여 넣어 한다
  (C) `clasp`로 저장소와 동기화
선택 — B
근거 — 전송 형식, 검증, 알림, 오류 처리가 모두 이 코드에 있어 프론트와 같이 리뷰할 수 있어야 한다. C는 이번 작업에 비해 도구가 늘어난다. 디스코드 웹훅 URL은 코드에 넣지 않고 스크립트 속성에서 읽는다. 위치는 구현 때 정한다
영향 — Phase 2
상태 — active

### Dec-14. 어떤 순서로 전환하나
영향도: local · 출처: ai-suggested

문제 — Make.com 웹훅을 언제 끄나?
옵션
  (A) 프론트 배포와 동시에 끈다
  (B) Apps Script 준비·확인 → 프론트 배포 → 웹훅 큐가 비고 배포 뒤 1~2주가 지나면 시나리오 종료·웹훅 삭제
선택 — B
근거 — 배포 뒤에도 이전 번들을 띄운 탭은 한동안 Make.com으로 보낸다. 크레딧 초과로 실행되지 않은 요청이 큐에 남아 있을 수 있어, 큐가 남은 채 웹훅을 지우면 쌓인 요청이 사라진다. 그 사이 Make.com이 쓴 행은 기존 파일에 둔다 (Dec-12). Supabase 방식 때 정한 내용을 이어받았다
영향 — Phase 4
상태 — active

### Dec-15. 테스트에서 Apps Script와 Sentry를 어떻게 흉내 내나
영향도: local · 출처: ai-suggested

문제 — 전송 흐름 화면 테스트에서 Apps Script와 Sentry를 무엇으로 대신하나?
옵션
  (A) `useFeedback`이나 전송 함수를 `vi.mock`
  (B) Apps Script는 fetch를 가로채는 fake(성공 / 성공 표시 없음 / 네트워크 오류 / 무응답), Sentry는 SDK를 mock해 `captureException` 호출을 본다
선택 — B
근거 — CLAUDE.md는 hook mock을 금지하고 외부 경계만 mock하게 한다. Apps Script는 HTTP 경계, Sentry는 Amplitude처럼 외부 SDK다. 요청 형식(`text/plain`, 행 내용)과 보고 여부·태그·본문 미포함을 바로 확인할 수 있다. Supabase insert stub(`src/test/fakeFeedbackTable.ts`)은 지운다
영향 — `src/app/feedback.test.tsx`, `src/test/`, Verification
상태 — active

### Dec-16. `Feedback Submitted`를 언제 보내나
영향도: local · 출처: ai-suggested

문제 — 지금은 저장에 성공한 뒤 보낸다. 응답을 기다리지 않게 되면(Dec-3) 언제 보내나?
옵션
  (A) 보내기를 누를 때 보낸다
  (B) 뒤에서 응답을 확인해 성공일 때만 보낸다
선택 — A
근거 — Amplitude에서 중요한 것은 실제로 저장됐는지보다 사용자가 피드백을 보내려 했다는 행동이다(사용자 판단). 화면에서도 누르는 순간이 보낸 순간이다. A면 이 이벤트 수와 시트 행 수의 차이가 곧 누락이라 누락 감지에 쓸 수 있다(Backlog). B는 페이지가 닫히면 이벤트가 빠져 그 비교가 흐려진다. 이벤트 이름과 속성은 바꾸지 않는다
영향 — `src/hooks/useFeedback.ts`, Backlog
상태 — active
