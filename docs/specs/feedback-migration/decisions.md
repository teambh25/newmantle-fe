# Decisions — 피드백 저장소 이전 (Make.com → Supabase)

> 영향도: foundation(스펙 간) · significant(여러 부분) · local(단일 단위)
> 출처: user-suggested(사람 제안·사람 선택) · ai-suggested(AI 제안·사람 선택) · ai-selected(AI 제안·AI 선택)
> 상태: active · superseded by Dec-N · revoked

---

### Dec-1. 피드백을 어디에 저장하나
영향도: foundation · 출처: user-suggested

문제 — Make.com 크레딧이 떨어져 피드백이 시트에 적히지 않는다. 계속 Google Sheet에 둘까, 다른 저장소로 옮길까?
옵션
  (A) Google Sheet 유지, Make.com만 Apps Script 웹앱으로 교체
  (B) 이미 로그인에 쓰는 Supabase에 `feedback` 테이블을 만든다
  (C) 게임 백엔드 DB에 저장 (`POST /v2/feedback` 추가)
선택 — B
근거 — 처리 상태 표시, 디스코드 알림, 나중의 LLM 분류(어디까지 처리했나, 어떤 프롬프트 버전인가)를 한 테이블에서 SQL로 다룰 수 있다. 사용량 과금이 없다. A는 시트와 Apps Script 두 곳을 관리해야 하고 분류 결과 관리가 번거롭다. C는 백엔드 작업이 필요하다
영향 — 전체. Dec-2, Dec-3, Dec-15
상태 — active

### Dec-2. 쌓인 피드백을 어떻게 보고 공유하나
영향도: local · 출처: ai-suggested

문제 — 시트를 팀원과 공유하던 역할을 Supabase로 옮긴 뒤 무엇으로 대신하나?
옵션
  (A) Supabase 대시보드 Table Editor, 팀원을 프로젝트에 초대, `status`·`memo` 컬럼으로 처리 표시
  (B) Supabase에 저장하고 시트로 자동 동기화
  (C) 별도 관리자 페이지
선택 — A
근거 — 팀원이 개발자라 대시보드 접근이 문제없다 (다른 테이블도 보이는 것을 감수). Table Editor로 정렬·필터·CSV 내보내기가 된다. B는 동기화 경로가 하나 더 생기고, C는 만들 이유가 없다
영향 — Phase 1, Dec-5(`status`·`memo` 컬럼), Dec-11
상태 — active

### Dec-3. 브라우저에서 어떤 경로로 Supabase에 쓰나
영향도: significant · 출처: ai-suggested

문제 — 피드백 insert를 어디서 하나?
옵션
  (A) 브라우저에서 anon key로 직접 insert, RLS로 insert만 허용
  (B) Next.js Route Handler(`/api/feedback`)에서 service role로 insert
  (C) 게임 백엔드 엔드포인트를 거침
선택 — A
근거 — 서버 코드와 비밀 키 없이 크레딧 문제가 풀린다. 이미 `profiles`를 같은 방식으로 insert한다. 피드백은 하루 몇십 건 이하이고, 지금 문제는 남용이 아니라 크레딧이다. B·C는 서버 쪽 검증과 IP 횟수 제한이 가능하지만, 스팸이 실제로 생기면 그때 옮겨도 클라이언트는 `useFeedback` 한 곳만 바뀐다. insert 뒤 `.select()`를 붙이지 않는다 (select 정책이 없어 실패). 타임아웃은 다른 요청처럼 3초 (`.abortSignal()`)
영향 — Phase 2, `src/hooks/useFeedback.ts`, Dec-4. 감수한 위험: 게스트 ID 위조, 횟수 제한 없음 → Backlog
상태 — active

### Dec-4. 공개 anon key에서 테이블을 어떻게 지키나
영향도: significant · 출처: ai-selected

문제 — 누구나 가진 anon key로 insert를 열어 주면서, 읽기·수정과 관리용 컬럼 조작은 어떻게 막나?
옵션
  (A) RLS insert 정책만 둔다
  (B) RLS 활성화 + anon·authenticated 권한 전부 회수 후 클라이언트가 채우는 컬럼에만 `grant insert` + insert 정책
선택 — B
근거 — RLS는 행만 검사하고 컬럼은 막지 않아, A로는 클라이언트가 `status`, `memo`, `created_at`을 넣을 수 있다. select 권한을 아예 주지 않으면 읽기도 이중으로 막힌다. SQL로 만든 테이블은 RLS가 자동으로 켜지지 않으므로 마이그레이션에 `enable row level security`를 반드시 넣는다. insert 정책: `(user_type = 'user' and subject_id = auth.uid()) or (user_type = 'guest' and auth.uid() is null)`. 로그인 사용자가 남의 ID나 게스트로 위장하는 것을 막는다
영향 — Phase 1, Verification(Supabase 확인), Dec-7
상태 — active

### Dec-5. 테이블 제약을 어떻게 두나
영향도: local · 출처: ai-selected

문제 — 클라이언트 값을 어디까지 DB에서 검증하나?
옵션
  (A) 제약 없이 받는다
  (B) check와 NOT NULL로 허용 값만 받고, 시간은 DB가 정한다
선택 — B
근거 — 직접 insert라 DB가 마지막 방어선이다. 본문 `char_length` 1~500, `theme`·`entry`·`game_status`·`user_type`는 허용 값만, `quiz_date`는 `date` 타입. 기존 시트 데이터를 옮기지 않아(Dec-13) `quiz_date`, `user_type`, `theme`, `entry`, `game_status`를 NOT NULL로 둘 수 있다. `subject_id`만 nullable (Dec-8). `created_at`은 `now()` 기본값으로, 클라이언트 시각을 믿지 않는다. `quiz_date`가 실제로 오늘·어제인지는 검증하지 않는다 (분석용)
영향 — Phase 1, Verification(Supabase 확인)
상태 — active

### Dec-6. 피드백에 유저 식별자를 저장하나
영향도: significant · 출처: user-suggested

문제 — 기존 결정(`docs/tasks/ui/feedback/decision.md` Dec-7: 식별자를 보내지 않음)을 유지할까, 서버 로그와 맞춰 보기 위해 식별자를 저장할까?
옵션
  (A) 지금처럼 식별자 없이 저장
  (B) 로그인 사용자 id와 게스트 UUID를 함께 저장
  (C) 로그인 사용자 id만 저장
선택 — B
근거 — 유사도 관련 피드백의 맥락(어떤 단어를 말하는지)은 서버 로그와 맞춰야 알 수 있다. 맥락 자체는 DB에 저장하지 않고 식별자만 둔다. UUID는 다른 정보와 연결되면 개인정보이므로, 처리방침에 수집 항목·목적·보관 기간을 명시하는 것으로 대응한다 (별도 동의 절차는 두지 않음). C는 대부분의 사용자인 게스트 피드백의 맥락을 잃는다. 이 결정은 위 기존 Dec-7을 뒤집는다 (기존 문서는 이 작업 범위 밖이라 고치지 않음)
영향 — Phase 2, Phase 4(`docs/todo/privacy-terms.md`), Dec-7, Dec-8, Dec-18
상태 — active

### Dec-7. 회원과 게스트를 어떻게 구분하나
영향도: local · 출처: ai-suggested

문제 — 두 ID 모두 UUID인데 `user_type` 컬럼이 필요한가?
옵션
  (A) `subject_id` 하나만 두고, 필요하면 `auth.users`와 join해 구분
  (B) 백엔드와 같은 `user_type`(`user` | `guest`) + `subject_id`
선택 — B
근거 — 값만 봐서는 구분할 수 없다. 서버 로그·stats API(`/v2/stats/{user_type}/{subject_id}`)와 같은 체계라 바로 대응된다. RLS 정책(Dec-4)도 단순해진다
영향 — Dec-4, Dec-5
상태 — active

### Dec-8. 게스트 ID가 아직 없으면 어떻게 하나
영향도: local · 출처: ai-selected

문제 — 한 번도 게임 요청을 하지 않아 localStorage에 게스트 ID가 없는 사람이 피드백을 보내면?
옵션
  (A) `getAuthHeader()`처럼 새로 만들어 저장
  (B) 만들지 않고 `subject_id`를 null로
선택 — B
근거 — 게임을 안 한 사람은 맞춰 볼 서버 로그가 없다. 피드백 때문에 게스트 ID를 만들면 이후 게임 기록과 의도치 않게 묶인다. 그래서 `getAuthHeader()`를 재사용하지 않고 localStorage를 읽기만 한다
영향 — Phase 2(행 만들기 순수 함수), Verification(로직 테스트)
상태 — active

### Dec-9. 게스트가 로그인한 뒤의 ID 불일치를 보정하나
영향도: local · 출처: user-suggested

문제 — 로그인 연동 뒤 게스트 UUID는 서버와 localStorage에서 사라진다. 피드백 행의 ID를 보정할까?
옵션
  (A) 저장 단계에서 보정하지 않는다
  (B) 연동 시 피드백 행의 게스트 ID를 user id로 바꾼다
선택 — A
근거 — 피드백과 로그는 같은 시점의 ID로 남아 대부분 그대로 맞는다. 어긋나는 것은 게스트로 플레이하다 같은 날 로그인한 뒤 보낸 경우뿐이고, 필요하면 link 요청 로그에서 대응을 찾는다. 서버 로그는 한 달 뒤 지워지지만 사용자가 로컬에 보관하고 있다
영향 — 없음 (Prerequisites에 link 로그 확인 TODO)
상태 — active

### Dec-10. 하루 1회 제한을 DB에서도 막나
영향도: local · 출처: ai-suggested

문제 — 식별자가 생겼으니 `(subject_id, quiz_date)` unique로 서버에서도 막을까?
옵션
  (A) 지금처럼 localStorage로만 막는다
  (B) DB unique 인덱스로도 막는다
선택 — A
근거 — 하루 1회는 스팸 방지가 아니라 "가볍게 한 번"이라는 UX 규칙이다. B는 기기를 바꾼 정상 사용자에게 오류가 나고 그 처리 화면이 필요하며, `subject_id`가 null이면 막지도 못한다
영향 — 기존 하루 1회 동작 유지
상태 — active

### Dec-11. 새 피드백을 어떻게 알리나
영향도: significant · 출처: ai-suggested

문제 — 시트 공유를 대신할 새 피드백 알림을 어떻게, 언제 만드나?
옵션
  (A) Supabase Database Webhooks (대시보드 UI)
  (B) 직접 만든 트리거 함수 + `pg_net`으로 디스코드에 POST, 이번 작업에 포함
  (C) Edge Function을 거쳐 변환
  (D) 백로그로 미룸
선택 — B
근거 — A는 payload가 Supabase 고정 형식이라 디스코드가 받지 않는다. C는 배포할 것이 하나 늘어난다. D면 이전 뒤 새 피드백을 알 방법이 없다. B는 SQL만으로 되고 프론트 변경이 없으며, `pg_net`이 비동기라 알림이 실패해도 insert와 사용자 응답에 영향이 없다. 본문의 멘션을 막기 위해 `allowed_mentions: { parse: [] }`를 넣고, 디스코드 메시지 길이에 맞게 본문을 자른다. 웹훅 URL은 Vault에 두고 저장소·클라이언트에 두지 않는다. 스팸 insert는 디스코드에도 그대로 간다 (감수)
영향 — Phase 1, Verification(Supabase 확인)
상태 — active

### Dec-12. Supabase SQL을 어디서 관리하나
영향도: local · 출처: ai-suggested

문제 — 저장소에 Supabase SQL이 하나도 없다 (`profiles`도 대시보드에서만). 피드백 SQL은?
옵션
  (A) 대시보드에서만 실행
  (B) `supabase/migrations/<날짜>_feedback.sql`로 저장소에 남기고 실행은 대시보드 SQL Editor
  (C) Supabase CLI 도입
선택 — B
근거 — 이 작업의 보안은 전부 SQL(RLS, 권한, 정책, 멘션 차단)에 달려 있어 코드 리뷰가 가능해야 한다. C는 이번 작업에 비해 크다. `profiles` 이전은 범위 밖
영향 — Phase 1
상태 — active

### Dec-13. 기존 시트 데이터를 옮기나
영향도: local · 출처: ai-suggested

문제 — Google Sheet에 쌓인 피드백을 Supabase로 가져올까?
옵션
  (A) 시트는 보관용으로 두고 Supabase에는 새 피드백만
  (B) CSV로 한 번 가져온다
선택 — A
근거 — 기존 행에는 `quiz_date`와 식별자가 없어 새 데이터와 성격이 다르다. 섞지 않고 구분해 두는 편이 낫고, 덕분에 새 테이블을 엄격하게(NOT NULL) 둘 수 있다 (Dec-5)
영향 — Dec-5, Dec-14
상태 — active

### Dec-14. 어떤 순서로 전환하나
영향도: local · 출처: ai-suggested

문제 — Make.com 웹훅을 언제 끄나?
옵션
  (A) 프론트 배포와 동시에 끈다
  (B) Supabase 준비·확인 → 프론트 배포 → 웹훅 큐가 비고 배포 뒤 1~2주가 지나면 시나리오 종료·웹훅 삭제
선택 — B
근거 — 배포 뒤에도 이전 번들을 띄운 탭은 한동안 웹훅으로 보낸다. 또 크레딧 초과로 아직 실행되지 않은 요청이 큐에 남아 있어, 크레딧이 들어온 뒤 처리돼야 한다 (사용자 제공 사유). 큐가 남은 채 웹훅을 지우면 쌓인 요청이 사라질 수 있다. 그 사이 시트에 들어온 행은 시트에 둔다 (Dec-13)
영향 — Phase 3
상태 — active

### Dec-15. 유사도 검증 데이터를 어떻게 모으나
영향도: significant · 출처: user-suggested

문제 — "왜 이 단어 순위가 낮아요?" 같은 피드백을 검증 데이터로 쓰려면 무엇을 모으나?
옵션
  (A) 자유 텍스트만 받고, 나중에 식별자·날짜로 서버 로그와 맞춰 LLM으로 추출
  (B) 자유 텍스트에 추측 단어 목록 등 맥락을 붙여 DB에 저장
  (C) 단어별 구조화 신고를 별도 테이블로 받음
선택 — A (C는 Backlog)
근거 — 식별자와 날짜만 있으면 서버 로그로 맥락을 만들 수 있어 맥락을 DB에 둘 필요가 없다. C가 데이터 품질은 가장 좋지만 UI와 서버 작업이 따로 필요하다. Supabase 선택(Dec-1)은 C를 나중에 테이블 하나로 추가하는 것과 충돌하지 않는다. LLM 파이프라인은 먼 일이라 주기 등 제약을 두지 않는다
영향 — Dec-6, Backlog
상태 — active

### Dec-16. 테스트를 어떻게 하나
영향도: local · 출처: ai-suggested

문제 — 단순한 insert인데 Supabase를 어디까지 흉내 내서 테스트하나?
옵션
  (A) 웹훅 fake와 같은 인터페이스의 insert fake를 만들고 기존 화면 테스트를 그대로 옮긴다
  (B) 행 만들기는 `utils` 순수 함수로 로직 테스트, 화면 테스트는 성공·실패 흐름만 최소 stub으로
  (C) 화면 테스트 없이 로직 테스트만
선택 — B
근거 — 새로 생기는 로직(식별자 결정, 게스트 ID를 만들지 않음)은 mock 없이 순수 함수로 확인하는 것이 맞다 (CLAUDE.md: 로직 테스트 우선). setup.ts가 Supabase client를 전역 mock하고 `from`이 없어 stub은 어차피 필요하다. 웹훅 body를 확인하던 화면 테스트는 로직 테스트로 옮겨 중복을 없앤다. RLS·권한은 프론트 테스트로 확인할 수 없어 Supabase에서 직접 확인한다. C는 실패 시 재시도 같은 기존 흐름을 잃는다
영향 — Phase 2, Verification
상태 — active

### Dec-17. 이웃 작업을 어디까지 포함하나
영향도: local · 출처: ai-suggested

문제 — 처리방침 메모 갱신과 `SurveyForm` 등 이름 정리를 이번에 할까?
옵션
  (A) 둘 다 포함
  (B) `docs/todo/privacy-terms.md`의 피드백 현황 메모만 포함, 이름 정리는 Backlog
  (C) 둘 다 제외
선택 — B
근거 — 이 작업 때문에 처리방침 메모(저장소, Amplitude 본문 전송, 진입점 1곳, 처리 위탁 업체)가 틀려지고, 나중에 처리방침 본문을 쓸 때 그 메모를 보게 된다. 처리방침 본문은 탈퇴 구현 뒤로 미뤄져 있어 메모만 고친다. 이름 정리는 동작 변화 없이 diff만 커지고 리뷰가 섞인다
영향 — Phase 4, Backlog
상태 — active

### Dec-18. 회원 탈퇴 시 피드백을 어떻게 하나
영향도: local · 출처: user-suggested

문제 — 탈퇴한 회원의 피드백 행(`subject_id` = user id)을 어떻게 처리하나?
옵션
  (A) 행 삭제
  (B) `subject_id`만 null로 익명화
  (C) 지금 정하지 않고 탈퇴 작업에서 정한다
선택 — C
근거 — 탈퇴 자체가 아직 구현 전이고, 처리 방식은 탈퇴 작업의 삭제 순서·처리방침과 함께 정하는 것이 맞다. `subject_id`는 게스트 ID와 같은 컬럼이라 `auth.users` FK cascade로 자동 처리할 수 없어, 탈퇴 로직에서 직접 다뤄야 한다. `docs/tasks/withdrawal/plan.md` 1-1 표와 6절 결정 필요에 넘겼다
영향 — `docs/tasks/withdrawal/plan.md`
상태 — active
