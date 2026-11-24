# Decisions — Amplitude 새 프로젝트 이전과 이벤트 재설계

> 영향도: foundation(스펙 간) · significant(여러 부분) · local(단일 단위)
> 출처: user-suggested(사람 제안·사람 선택) · ai-suggested(AI 제안·사람 선택) · ai-selected(AI 제안·AI 선택)
> 상태: active · superseded by Dec-N · revoked

---

### Dec-1. SDK 자동 수집 끄기
영향도: significant · 출처: user-suggested

문제 — 의도하지 않게 켜져 있는 자동 수집(클릭·입력·폼·페이지뷰·파일 다운로드)을 어떻게 할 것인가
옵션
  (A) 그대로 둔다
  (B) 클릭·입력(autocapture)만 끈다
  (C) 클릭·입력·폼·페이지뷰·파일 다운로드를 모두 끈다. 세션과 유입 경로(attribution)는 유지한다
선택 — C
근거 — 단어 1회 제출마다 2~5개씩 같이 나가 한도 초과의 가장 큰 원인으로 추정된다. 필요한 화면 행동(공유·테마·설문)은 직접 보내는 이벤트로 이미 있고, 방문은 `Game Started`로 센다. B는 폼과 페이지뷰가 로드·제출마다 계속 나간다. 다만 C만으로는 부족할 수 있다. 1인당 평균 제출이 약 55회를 넘으면 여전히 한도를 넘는데, 현재 수치로 역산한 평균 제출이 40~100회다 (그래서 Dec-2가 필요). Amplitude 프로젝트의 원격 설정이 켜져 있으면 코드 옵션이 무시되므로 원격 설정도 꺼야 한다
영향 — SDK 초기화, Phase 1(원격 설정 확인), Phase 2, Dec-2
상태 — superseded by Dec-14

### Dec-2. `Word Submitted`는 그날 첫 제출에만, 이름 유지
영향도: significant · 출처: ai-suggested

문제 — 제출마다 나가는 `Word Submitted`를 어떻게 줄일 것인가
옵션
  (A) 그대로 제출마다 보낸다
  (B) 완전히 없애고 참여 여부는 서버 기록으로만 본다
  (C) 그날 첫 제출에만 보내고 이름은 그대로 둔다
  (D) 그날 첫 제출에만 보내고 새 이름(예: `First Word Submitted`)을 붙인다
선택 — C
근거 — 직접 보내는 이벤트의 대부분이고, 내용(단어·유사도)은 서버 로그와 겹친다. 하지만 방문과 참여를 구분하는 참여 DAU, 참여 리텐션, 퍼널의 기준 이벤트로 필요해서 B는 탈락이다. D는 기존 "Word Submitted 고유 사용자" 차트가 적용일 기준으로 끊긴다. 대신 Totals 기준 차트는 적용일부터 값이 떨어지므로 고유 사용자 기준으로 바꾼다. 제출 단위 분석은 서버 로그로 본다
영향 — Phase 2, Phase 1(차트 기준 변경), Verification, Dec-8, Dec-9
상태 — active

### Dec-3. `Game Started`는 하루 1회
영향도: significant · 출처: ai-suggested

문제 — 로드·새로고침·테마 전환마다 다시 나가는 `Game Started`를 어떻게 할 것인가
옵션
  (A) 그대로 둔다
  (B) 테마 전환 때만 다시 나가지 않게 한다
  (C) 게임 날짜당 1회만 보낸다
선택 — C
근거 — 방문 DAU와 방문 리텐션은 일 단위라 하루 1회면 충분하다. 테마 전환 때 다시 나가는 것은 의도한 동작이 아니었다. 같은 날 재방문 횟수는 세션 이벤트로 본다(Dec-6). B는 새로고침·재방문마다 계속 나간다
영향 — Phase 2, Verification, Dec-6, Dec-10
상태 — active

### Dec-4. `Hint Requested`는 그날 첫 일반 힌트에만
영향도: local · 출처: user-suggested

문제 — 일반 힌트마다 나가는 `Hint Requested`를 어떻게 할 것인가
옵션
  (A) 전부 보내서 Amplitude에서 횟수까지 분석한다
  (B) 그날 첫 일반 힌트에만 보낸다 (사용 여부만 본다)
선택 — B
근거 — 필요한 것은 "힌트를 썼는지"다. 횟수는 종료 이벤트의 `hintUsed`, 서버 로그, DB에 있다. A는 볼륨 영향은 작지만 행동 횟수에 비례하는 이벤트는 두지 않는다는 원칙(Dec-12)에 어긋난다
영향 — Phase 2, Verification
상태 — active

### Dec-5. 초성 힌트는 별도 이벤트로 유지
영향도: local · 출처: user-suggested

문제 — `Initial Consonant Hint Requested`를 `Hint Requested`에 합칠 것인가
옵션
  (A) `Hint Requested`에 속성으로 합친다
  (B) 별도 이벤트로 그대로 둔다
선택 — B
근거 — 초성 힌트는 포기를 막는 장치라서 일반 힌트와 따로 보는 게 편하다. 하루 1회 사용 규칙(`hint-giveup.md` B-5) 때문에 자연히 하루 최대 1개다. A는 이름이 바뀌어 기존 차트가 끊긴다
영향 — Scope(Out), Verification
상태 — active

### Dec-6. 세션 이벤트(`session_start` / `session_end`) 유지
영향도: local · 출처: ai-suggested

문제 — 이벤트 수에 포함되는 세션 이벤트를 끌 것인가
옵션
  (A) 끈다. `session_id` 필드만으로 세션을 본다
  (B) 유지한다
선택 — B
근거 — 하루 안 재방문 횟수를 보기 위해서다. 이벤트를 줄이면 아무 행동 없이 다시 들어온 방문은 다른 이벤트가 하나도 남지 않는다. 그래서 `session_id` 필드만으로는(A) 그 세션을 볼 수 없다. 리텐션은 일 단위라 세션 이벤트가 필요 없고, 플레이 시간은 `timeSinceFirstAction`으로 재므로 세션 길이로 대신하지 않는다. 비용은 1인 하루 세션당 2개다
영향 — SDK 초기화, Phase 2, Verification, Dec-3
상태 — superseded by Dec-14

### Dec-7. 중도 이탈자의 제출·힌트 횟수는 Amplitude로 보내지 않음
영향도: local · 출처: user-suggested

문제 — 종료 이벤트가 없는 중도 이탈자의 횟수를 Amplitude에서 볼 수 있게 할 것인가
옵션
  (A) 다음 방문 때 `Game Started`에 지난 게임 요약을 싣는다
  (B) 페이지를 떠날 때 요약 이벤트를 보낸다
  (C) 보내지 않는다
선택 — C
근거 — A와 B는 복잡도에 비해 이득이 작다. 2026-11-13 확인 결과, DB 일별 row에 중도 이탈자를 포함한 전체 사용자의 횟수가 이미 있다
영향 — Scope(Out)
상태 — active

### Dec-8. 참여·힌트 지표가 DB에 있어도 `Word Submitted` / `Hint Requested`는 유지
영향도: local · 출처: ai-suggested

문제 — 참여 DAU와 힌트 사용자 비율을 DB에서도 볼 수 있는데, 두 이벤트를 아예 없앨 것인가
옵션
  (A) 없앤다. 1인 하루 약 5개로 줄어든다
  (B) 유지한다. 1인 하루 최대 2개다
선택 — B
근거 — DB에는 기기·유입 경로·테마·세션 정보가 없다. Amplitude에서 퍼널(`Game Started` → `Word Submitted` → `Game Completed`)이나 유입 경로별 참여 전환율을 보려면 필요하다. 월 약 6만 개라 예산에 여유가 있다
영향 — Dec-2, Dec-4, Dec-12
상태 — active

### Dec-9. `Word Submitted`에서 `word`, `similarity` 속성 제거
영향도: local · 출처: ai-suggested

문제 — 첫 제출만 보내게 된 `Word Submitted`에 입력 단어와 유사도를 계속 실을 것인가
옵션
  (A) 기존 속성을 그대로 둔다
  (B) `word`, `similarity`를 뺀다
선택 — B
근거 — 속성은 이벤트 수와 무관하지만, 첫 제출 1개로는 분석 가치가 거의 없고 서버 로그에 같은 정보가 있다. 빼면 사용자가 입력한 단어를 외부 서비스로 보내지 않게 된다
영향 — Phase 2, Verification, Dec-13
상태 — active

### Dec-10. "그날 처음"을 판단할 수 없으면 보낸다
영향도: local · 출처: ai-selected

문제 — 저장소가 막혀 그날 이미 보냈는지 알 수 없을 때 보낼 것인가
옵션
  (A) 보내지 않는다
  (B) 보낸다
선택 — B
근거 — DAU가 빠지는 것보다 중복되는 게 낫다. 고유 사용자 기준으로 보므로 중복은 지표에 영향이 작다. A는 저장소가 막힌 환경의 사용자가 DAU에서 통째로 빠진다
영향 — Verification
상태 — active

### Dec-11. "하루"의 기준은 퀴즈 날짜(KST `gameDate`)
영향도: local · 출처: ai-selected

문제 — "하루 1회", "그날 첫" 판단의 날짜 기준을 무엇으로 할 것인가
옵션
  (A) 기기의 현지 날짜
  (B) 퀴즈 날짜(KST `gameDate`)
선택 — B
근거 — 게임 상태가 리셋되는 기준과 같아야 퀴즈 하루와 이벤트 하루가 어긋나지 않는다. A는 해외 사용자나 기기 시간이 틀린 경우에 퀴즈 하루 동안 두 번 보내거나 한 번도 안 보낼 수 있다
영향 — Glossary, Dec-2, Dec-3, Dec-4
상태 — active

### Dec-12. 볼륨 예산: 1인 하루 약 7개(최대 11개)
영향도: significant · 출처: ai-selected

문제 — 앞으로 이벤트를 추가·변경할 때 판단 기준이 되는 예산을 얼마로 둘 것인가
옵션
  (A) 한도(1인 하루 66개)까지 쓴다
  (B) 이번 규칙 기준 1인 하루 약 7개(최대 11개), 월 21만~33만 개(한도의 20% 미만)를 예산으로 둔다
선택 — B
근거 — 사용자가 늘거나 추정이 틀려도 한도를 넘지 않을 여유가 필요하다. A는 이번처럼 작은 변경 하나로 다시 넘는다. 새 이벤트를 추가할 때는 "1인이 하루에 최대 몇 번 보내는가"를 먼저 보고, 행동 횟수에 비례하는 이벤트는 추가하지 않는다
영향 — Context(외부 제약), Phase 3 완료 기준, Verification
상태 — superseded by Dec-21

### Dec-13. `Word Submitted`의 `attempt` 속성은 일단 유지
영향도: local · 출처: ai-selected

문제 — 첫 제출만 보내 항상 1이 되는 `attempt` 속성을 뺄 것인가
옵션
  (A) 뺀다
  (B) 유지한다
선택 — B
근거 — 속성은 이벤트 수와 무관하고, 기존 차트·필터가 이 속성을 쓸 수 있다. 차트를 확인한 뒤 뺄지 정한다
영향 — Verification, Backlog
상태 — superseded by Dec-32

### Dec-14. SDK 자동 수집은 유입 경로만 남기고 모두 끔
영향도: significant · 출처: ai-suggested

문제 — Dec-1에서 남겨 둔 세션 이벤트까지 포함해, 자동 수집을 어디까지 끌 것인가
옵션
  (A) Dec-1 그대로: 클릭·입력·폼·페이지뷰·파일 다운로드를 끄고, 세션과 유입 경로는 유지한다
  (B) 세션도 끄고 유입 경로만 유지한다
  (C) 유입 경로까지 모두 끈다
선택 — B
근거 — 세션 이벤트는 세션마다 2개씩(1인 하루 2~6개) 나가서 줄이고 나면 남는 이벤트 중 비중이 가장 크다. 세션이 있어야만 보이는 것은 아무 행동 없이 들어왔다 나간 재방문과 하루 방문 횟수뿐인데, 지금 보는 지표(DAU, 참여 비율, 리텐션, 테마 비율)에는 필요 없다. 이어 푸는 패턴은 서버 로그의 요청 시각으로 어느 정도 볼 수 있다. 설정 한 줄이라 필요해지면 다시 켠다(그 사이 데이터가 없는 것이 손해). 유입 경로는 identify로 user property만 남겨 한도에 포함되지 않으므로 끌 이유가 없다(C 탈락). 페이지뷰는 방문을 `Game Started`로 세므로 끈다(Dec-15)
영향 — SDK 초기화, Phase 1(원격 설정 확인), Phase 2, Phase 3, Backlog. Dec-1, Dec-6을 대체
상태 — active

### Dec-15. `Game Started`는 방문 의미를 유지하고 DAU 기준으로 삼음
영향도: significant · 출처: user-suggested

문제 — 지금 코드의 `Game Started`는 페이지 로드마다 나가 사실상 방문인데, 원래 의도는 "게임을 진행한 사람"이었다. 의미를 어디에 맞추고 방문은 무엇으로 셀 것인가
옵션
  (A) `Game Started`를 그날 첫 게임 행동(제출 성공·일반 힌트·초성 힌트·포기)에서 보내 참여로 바꾸고, 방문은 페이지뷰로 센다
  (B) `Game Started`는 지금처럼 페이지 로드 시점(하루 1회)에 보내 방문으로 쓰고, 페이지뷰는 끈다. 참여는 행동 이벤트로 본다
선택 — B
근거 — `Game Started`는 지금까지 사실상 방문이었으므로 의미가 그대로 이어지고, 페이지뷰 기준 DAU 차트도 `Game Started`로 바꾸면 값이 거의 이어진다. 참여는 행동 이벤트의 고유 사용자로 볼 수 있어(Dec-16) 의미를 바꿀 이유가 없다. 페이지뷰(로드와 앱 안 이동마다, 1인 하루 2~5개)도 빠진다. A는 같은 이름의 의미가 적용일부터 바뀌어 과거 값과 비교할 수 없다. `/stats` 등으로 바로 들어온 사용자가 방문에서 빠지지만 대부분 메인을 거친다고 보고 감수한다
영향 — Dec-3, Dec-14, Dec-16, Phase 1(DAU 차트 기준 변경), Glossary
상태 — active

### Dec-16. 참여 비율은 행동 이벤트 합집합 / `Game Started`
영향도: local · 출처: user-suggested

문제 — 방문자 중 실제로 게임을 한 비율을 무엇으로 셀 것인가
옵션
  (A) `Word Submitted` 고유 사용자 / `Game Started` 고유 사용자
  (B) `Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`, `Game Given Up` 중 하나라도 보낸 고유 사용자 / `Game Started` 고유 사용자
선택 — B
근거 — 단어 없이 힌트나 포기만 한 사용자도 게임을 진행한 것이다. 네 이벤트 모두 그날 1회 이상 나가기만 하면 되므로, 하루 1회로 줄여도 합집합 결과는 같다. Amplitude 차트 설정만으로 되고 코드 변경이 없다. A는 단순하지만 힌트·포기만 한 경우가 빠진다
영향 — Phase 1(참여 비율 차트), Glossary, Dec-2, Dec-4
상태 — active

### Dec-17. `Share Error`는 Amplitude에서 지우고 Sentry로 기록
영향도: local · 출처: user-suggested

문제 — 클립보드 복사 실패 시 나가는 `Share Error`를 어떻게 할 것인가
옵션
  (A) 그대로 둔다
  (B) 지우기만 한다
  (C) 지우고 그 자리에서 Sentry에 예외를 기록한다
선택 — C
근거 — 오류 감지는 Amplitude가 아니라 이미 설치된 Sentry의 일이다. 실패는 코드에서 잡아 토스트로 처리하므로 Sentry가 자동 수집하지 못해 직접 기록해야 한다. B는 실패가 아무 데도 남지 않는다
영향 — `useShareLink`, Phase 2
상태 — active

### Dec-18. `Feedback Opened` 삭제
영향도: local · 출처: user-suggested

문제 — 피드백 창을 열 때마다 나가는 `Feedback Opened`를 남길 것인가
옵션
  (A) 남긴다. 연 사람 대비 보낸 비율로 창 문구 효과를 본다(피드백 작업 Dec-8의 근거)
  (B) 지운다
선택 — B
근거 — 연 사람 대비 보낸 비율은 실제로 볼 필요가 크지 않다. 피드백 작업(`docs/tasks/ui/feedback/decision.md`) Dec-8의 일부를 뒤집는 결정이지만, 그 문서는 다른 작업 범위라 고치지 않는다
영향 — `useFeedback`, 피드백 테스트, Phase 2
상태 — active

### Dec-19. `Theme Switched`, `Theme Changed`, `toggleTheme` 삭제
영향도: local · 출처: user-suggested

문제 — 테마를 바꿀 때 나가는 이벤트를 남길 것인가
옵션
  (A) `Theme Switched`를 남긴다. 언제, 몇 명이 테마를 바꿨는지 볼 수 있다
  (B) 지운다
선택 — B
근거 — 궁금한 것은 어떤 테마를 더 많이 쓰는지이고, 이는 user property `theme`이나 `Game Started`의 `theme` 속성으로 본다. 바꾼 횟수는 의미가 없다. `Theme Changed`는 이를 보내는 `toggleTheme`이 git 이력 전체에서 화면에 쓰인 적이 없어 한 번도 나간 적이 없으므로 함께 지운다
영향 — `useUITheme`, Phase 2
상태 — active

### Dec-20. `setUserProperty("theme")`는 그대로 둠
영향도: local · 출처: user-suggested

문제 — 페이지를 열 때마다 보내는 identify(`setUserProperty("theme")`)를 줄일 것인가
옵션
  (A) 그대로 둔다
  (B) 값이 바뀔 때만 보낸다
  (C) 없애고 테마 비율은 이벤트 속성으로 본다
선택 — A
근거 — `$identify`는 월 이벤트 한도에 포함되지 않으므로 줄여도 효과가 없다. B와 C는 코드만 늘거나 user property 기준 분석을 잃는다
영향 — Scope(Out). 기존 문서의 identify 확인 항목과 Backlog 항목 삭제
상태 — active

### Dec-21. 볼륨 예산: 1인 하루 평균 약 2~4개, 최대 약 6개
영향도: significant · 출처: ai-suggested

문제 — Dec-14~Dec-19로 이벤트 구성이 바뀌었으니 예산과 원칙을 어떻게 다시 둘 것인가
옵션
  (A) Dec-12 그대로: 1인 하루 약 7개(최대 11개), "행동 횟수에 비례하는 이벤트는 두지 않는다"
  (B) 바뀐 구성 기준 1인 하루 평균 약 2~4개, 최대 약 6개(`Game Started`, `Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`, 완료·포기 각 1 + 가끔 공유·피드백), 월 약 6만~18만 개(한도의 10% 미만). 원칙은 "반복할 수 있는 핵심 행동(제출·힌트)에 비례하는 이벤트는 두지 않는다"로 좁힌다
선택 — B
근거 — 세션·페이지뷰가 빠지고 부가 이벤트를 지워 실제 예상치가 크게 낮아졌다. 공유(`Result Shared`)는 횟수에 비례하지만 반복할 이유가 없는 버튼이라 그대로 두므로, 원칙을 핵심 행동으로 좁혀야 현재 구성과 맞는다. A는 숫자와 원칙 모두 현재 구성과 어긋난다
영향 — Phase 3 완료 기준, Verification, Scope(Out). Dec-12를 대체
상태 — active

### Dec-22. `Feedback Submitted`에 속성을 추가하지 않음
영향도: local · 출처: ai-suggested

문제 — 피드백을 보낸 사람이 어떤 사용자인지(제출을 얼마나 했는지) 보려고 `Feedback Submitted`에 `attempts`, `hintUsed` 등을 실을 것인가
옵션
  (A) 속성을 추가한다. 게스트를 포함해 이벤트에서 바로 보인다
  (B) 추가하지 않고, Amplitude에서 같은 사용자(device_id/user_id)의 다른 이벤트로 이어 본다
선택 — B
근거 — 정답자·포기자는 `Game Completed` / `Game Given Up`의 `attempts`로 이어 볼 수 있다(User Lookup, 코호트). 진행 중에 보낸 사람은 횟수가 안 보이지만, 웹훅의 `gameStatus`로 진행 중이었다는 것은 알 수 있고 피드백 건수가 적어 충분하다. 이벤트 축소와 별개의 일이기도 하다
영향 — Scope(Out)
상태 — active

### Dec-23. 게스트 id를 Amplitude에 보내지 않음
영향도: local · 출처: ai-suggested

문제 — Amplitude의 게스트 식별자(SDK가 만든 device_id)와 서버의 게스트 id(`newmantle_guest_id`)가 달라 서로 연결되지 않는데, 연결할 것인가
옵션
  (A) device_id를 게스트 id로 맞춘다. 기존 게스트가 배포일에 새 사용자로 잡힌다
  (B) 게스트 id를 user property로 보낸다 (identify라 한도와 무관)
  (C) 보내지 않는다
선택 — C
근거 — Amplitude 데이터를 서버 DB와 연결해서 볼 필요가 없다. Amplitude 안에서 같은 사용자의 이벤트를 이어 보는 것은 device_id/user_id로 이미 된다(Dec-22). 로그인 사용자는 user_id가 Supabase user id라 필요하면 서버와도 맞출 수 있다
영향 — Scope(Out)
상태 — superseded by Dec-40

### Dec-24. 1차·2차로 나눠 배포
영향도: significant · 출처: ai-suggested

문제 — 정한 변경을 한 번에 배포할 것인가, 볼륨 원인부터 먼저 배포할 것인가
옵션
  (A) 한 번에 배포한다
  (B) 1차: SDK 자동 수집 끄기 + `Word Submitted` 하루 1회·속성 제거. 2차: `Game Started`·`Hint Requested` 하루 1회, `Share Error`·`Feedback Opened`·테마 이벤트 삭제
선택 — B
근거 — 서버 로그로 확인한 세션당 제출 수(평일 하루 약 89회)와 월 총량을 맞춰 보면, 볼륨은 제출마다 나가는 `Word Submitted`와 SDK 폼·클릭 이벤트가 거의 전부다. 둘 중 하나만 고치면 여전히 한도를 넘으므로 둘은 함께 1차에 넣는다. 나머지는 볼륨 영향이 작고 목적에 맞지 않던 기록을 정리하는 일이라, 1차를 가볍게 빨리 내보내기 위해 2차로 미룬다. 차트를 고유 사용자 기준으로 보면 2차 전까지 `Game Started` 중복은 지표에 영향이 없다
영향 — Phase 2, Phase 3, Phase 4
상태 — superseded by Dec-25

### Dec-25. 새 Amplitude 프로젝트로 옮기며 모든 변경을 한 번에 배포
영향도: significant · 출처: ai-suggested

문제 — 기존 계정이 잠겨 새 프로젝트로 옮기는데, 키 교체와 이벤트 변경을 어떤 배포 단위로 묶을 것인가
옵션
  (A) 키 교체 + 1차(SDK 끄기, `Word Submitted`)만 먼저, 2차 정리는 나중에 (Dec-24 유지)
  (B) 키 교체 + 1차 + 2차 정리를 한 번에
  (C) 1차는 옛 키로, 키 교체는 2차에
선택 — B
근거 — 새 프로젝트는 대시보드를 어차피 처음부터 만들어야 하므로, 이 기회에 수집 의도가 불분명하던 이벤트까지 정리해 새 프로젝트가 처음부터 의도한 이벤트만 받게 한다. A는 2차 전까지 낡은 이벤트(`Theme Switched` 등)가 새 프로젝트에 쌓이고 차트를 두 번 손봐야 한다. C는 옛 계정이 잠겨 있어 1차 효과를 확인할 수 없다
영향 — Phase 1(새 프로젝트 준비), Phase 2, Phase 3. Dec-24를 대체
상태 — active

### Dec-26. Amplitude API 키를 환경변수로 옮김
영향도: local · 출처: user-suggested

문제 — `src/utils/amplitude.ts`에 직접 적힌 API 키를 새 키로 바꿀 때, 코드에 그대로 둘 것인가 환경변수로 옮길 것인가
옵션
  (A) 코드의 문자열만 새 키로 바꾼다
  (B) `NEXT_PUBLIC_AMPLITUDE_API_KEY` 환경변수로 옮긴다
선택 — B
근거 — 키는 브라우저에 노출되는 공개 키라 보안상 이점은 없지만, 계정을 바꿀 때 코드 수정 없이 배포 설정만 바꾸면 되고 개발·운영 프로젝트를 나눌 수도 있다. 키가 없으면 초기화하지 않는다(로컬·테스트에서 운영 프로젝트로 이벤트가 나가지 않게)
영향 — `initAmplitude`, 배포 환경변수 설정(Prerequisites), Phase 2
상태 — active

### Dec-27. 로컬 테스트와 운영을 한 Amplitude 프로젝트로
영향도: local · 출처: user-suggested

문제 — 로컬 연동 확인과 이벤트 정리 실험을 운영과 같은 새 프로젝트에서 할 것인가, 테스트용 프로젝트를 따로 둘 것인가
옵션
  (A) 한 프로젝트에서 로컬 테스트와 운영을 함께 받는다
  (B) dev·prod 프로젝트를 나누고 로컬 `.env`에는 dev 키를 쓴다
선택 — A
근거 — 운영 배포는 이벤트 정리 후 Phase 2에서 한 번에 하므로 실제 사용자 데이터는 정리된 이름으로만 쌓이고, 로컬 테스트 양은 한도에 영향이 없다. B는 이름 정리 전 테스트 이벤트와 로컬 기기가 운영 데이터에 섞이지 않는 장점이 있지만, 지금은 프로젝트 하나로 단순하게 간다. 테스트로 보낸 옛 이름 이벤트는 프로젝트에 남으므로 차트는 배포일 이후 기간으로 본다
영향 — Phase 1, Phase 3(배포 후 확인 기간), Dec-25, Dec-26
상태 — active

### Dec-28. Amplitude는 서버와 연결하지 않고, UI와 함께 볼 최소 게임 정보만 직접 기록
영향도: foundation · 출처: user-suggested

문제 — 게임 서버가 제출·힌트·포기·정답을 모두 기록하는데, Amplitude는 무엇을 맡을 것인가. 특히 UI 사용과 게임 행동을 사용자 단위로 엮어 볼 방법을 어떻게 둘 것인가
옵션
  (A) Amplitude와 서버를 연결하지 않는다. UI 설정과 함께 볼 게임 정보(참여, 첫 힌트, 정답·포기)만 Amplitude에 직접 보내고, 횟수·분포는 서버에서 본다
  (B) 게스트 id를 user property로 보내 필요할 때 서버 데이터와 조인한다
  (C) 새 프로젝트로 옮기는 김에 device_id를 게스트 id로 맞춘다
선택 — A
근거 — Amplitude에서 보려는 것은 방문·참여·완료 여부와 테마·진행 상황 보기 같은 UI 사용, 그리고 둘을 함께 나눠 보는 것이다. 이것은 Amplitude 안의 이벤트와 사용자 속성으로 충분하다. 횟수·분포는 서버 로그와 DB가 이미 정확하다. AI는 C를 추천했다(새 프로젝트라 기존 게스트가 새 사용자로 잡히는 단점이 없음). 하지만 서버 조인이 필요한 질문이 지금은 없어 택하지 않았다. B는 id가 둘로 남아 조인이 번거롭다
영향 — `docs/rules/amplitude.md` 1장, Dec-23(이후 Dec-40으로 대체), Dec-31~Dec-35
상태 — active

### Dec-29. 테마·진행 상황 보기는 사용자 속성으로만 기록
영향도: significant · 출처: ai-suggested

문제 — 거의 모든 이벤트에 붙은 `theme` 속성과 `Progress View Switched` 이벤트를 남길 것인가
옵션
  (A) 이벤트 속성의 `theme`과 `Progress View Switched`를 빼고, 사용자 속성(`theme`, `classic_progress_view`, `excel_progress_view`)으로만 본다
  (B) 이벤트 속성과 사용자 속성을 둘 다 둔다
선택 — A
근거 — Amplitude는 사용자 속성을 받은 뒤의 이벤트에 그 시점 값을 찍으므로 "어떤 테마로 그 행동을 했나"가 이벤트 속성 없이 보인다. "끄고 쓰나"도 현재 값으로 충분하다. 위험은 페이지를 열 때 identify보다 이벤트가 먼저 가는 경우뿐인데, 열자마자 자동으로 나가는 이벤트는 `Game Started` 하나라 identify를 그보다 먼저 호출하면 된다. B는 같은 값이 두 곳에 있어 필터 기준이 갈린다
영향 — 모든 이벤트의 속성, `useUITheme`, `useProgressView`, Phase 2, Verification. Dec-20(identify는 그대로 둠)과 함께 간다
상태 — active

### Dec-30. 설정을 직접 골랐는지 `_chosen` 사용자 속성으로 남김
영향도: local · 출처: ai-suggested

문제 — 저장된 값이 없으면 기본값(`classic`, `card`)을 보내서 기본값 비율이 부풀려지는데, 보정할 것인가
옵션
  (A) 보정하지 않는다. 바꾼 쪽(excel, 끔)의 숫자만 믿는다
  (B) `theme_chosen`, `classic_progress_view_chosen`, `excel_progress_view_chosen`을 보낸다. 저장된 값이 있으면 true
선택 — B
근거 — identify라 비용이 없고, "직접 고른 사람"과 "바꾼 적 없는 사람"을 나눠야 기본값 선호를 해석할 수 있다. A는 "끄고 쓰나"에는 충분하지만 기본값 쪽 숫자를 해석할 수 없다
영향 — `docs/rules/amplitude.md` 3장, Phase 2, Verification
상태 — active

### Dec-31. 행동별 "그날 첫 이벤트"를 따로 유지
영향도: significant · 출처: user-suggested

문제 — 횟수는 서버로 넘겼으니 `Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`를 "오늘 게임을 했다" 이벤트 하나(예: `Game Played`)로 합칠 것인가
옵션
  (A) 지금처럼 행동별로 그날 첫 번째를 따로 보낸다 (Dec-2, Dec-4, Dec-5)
  (B) 그날 첫 행동 때 이벤트 하나만 보내고, 첫 행동 종류를 속성으로 남긴다
선택 — A
근거 — 따로 보내야 중도 이탈자의 힌트·초성 힌트 사용, 첫 제출부터 첫 힌트까지의 시간, 첫 힌트 → 정답·포기 퍼널을 테마별로 볼 수 있다. 비용 차이는 1인 하루 최대 2개로 예산(Dec-21) 안이다. AI는 처음에 B를 추천했지만, 사용자가 구분해서 얻는 정보를 짚어 A로 바꿨다. B는 차트가 단순하지만 위 정보를 잃는다
영향 — Dec-2, Dec-4, Dec-5, Dec-16(그대로 유효)
상태 — active

### Dec-32. 첫 이벤트의 속성: 제출은 없음, 힌트는 시점의 진행 정도
영향도: local · 출처: ai-suggested

문제 — 그날 첫 번째만 보내게 된 이벤트에 어떤 속성을 실을 것인가
옵션
  (A) 기존 속성을 둔다 (`Word Submitted`: `attempt`, `isCorrect` / `Hint Requested`: `hintRank`)
  (B) `Word Submitted`는 속성 없음. `Hint Requested`는 `attempts`, `requested_rank`, `top_rank`. `Initial Consonant Hint Requested`는 `attempts`, `top_rank`
선택 — B
근거 — 첫 제출의 `attempt`는 항상 1이고, 첫 단어로 맞힌 경우는 `Game Completed`(`attempts = 1`)로 보인다(사용자 지적). 힌트는 순위가 현재 최고 순위에 따라 자동으로 정해지므로, 요청 순위(`requested_rank`)와 그 입력인 직전 최고 순위(`top_rank`)를 함께 두면 "몇 개 내고, 몇 위에서 힌트를 쓰나"가 보인다. `hintRank`는 받은 순위로 오해될 수 있어 이름을 바꿨다(사용자 요청). `top_rank`는 AI 제안
영향 — `docs/rules/amplitude.md` 2장, Phase 2, Verification. Dec-13을 대체
상태 — active

### Dec-33. 정답·포기의 시간 속성은 첫 행동 기준 하나만
영향도: local · 출처: ai-suggested

문제 — `Game Completed`의 `timeSpent`(페이지 연 시점부터)와 `timeSinceFirstAction`(첫 행동부터) 중 무엇을 남기고, `Game Given Up`에도 넣을 것인가
옵션
  (A) 둘 다 둔다
  (B) `timeSinceFirstAction`만 `time_to_solve`로 남기고, `Game Given Up`에 `time_to_give_up`을 추가한다
선택 — B
근거 — `timeSpent`는 새로고침하면 0부터 다시 재서 믿기 어렵다. 첫 행동 기준은 저장된 시각을 써서 이어진다. 포기까지의 시간이 있으면 "얼마나 버티다 포기하나"를 볼 수 있다(사용자 요청)
영향 — `useGameState`, `docs/rules/amplitude.md` 2장, Phase 2
상태 — active

### Dec-34. 게임·공유·피드백 이벤트에 `quiz_date`를 실음
영향도: local · 출처: ai-suggested

문제 — 퀴즈 날짜(`date`)가 `Game Started`에만 있어, 자정을 넘겨 어제 퀴즈를 끝낸 경우를 구분할 수 없는데 어떻게 할 것인가
옵션
  (A) `Game Started`, `Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`, `Game Completed`, `Game Given Up`, `Result Shared`, `Feedback Submitted`에 싣는다
  (B) `Game Started`에만 둔다
  (C) 모두 빼고 프로젝트 시간대로만 본다
선택 — A. 프로젝트 시간대도 Asia/Seoul로 맞춘다
근거 — 하루 1회 규칙이 퀴즈 날짜 기준(Dec-11)이라 이벤트에도 같은 기준이 있어야 차트와 규칙이 어긋나지 않는다. 화면을 열어 두면 다음 날에도 어제 퀴즈로 플레이·공유·피드백할 수 있다(피드백 포함은 사용자 요청). 이름은 이벤트 시각과 헷갈리지 않게 `quiz_date`로 한다(Dec-36)
영향 — 모든 게임 이벤트, `useShareLink`, `useFeedback`, Prerequisites
상태 — active

### Dec-35. 공유·피드백 이벤트 속성 정리
영향도: local · 출처: user-suggested

문제 — `Result Shared`(`method`, `attempts`, `theme`)와 `Feedback Submitted`(`length`, `entry`, `theme`)의 속성을 어떻게 할 것인가
옵션
  (A) 그대로 둔다
  (B) `Result Shared`는 `method`, `quiz_date`. `Feedback Submitted`는 `entry`, `quiz_date`
선택 — B
근거 — 시도 수와 정답·포기 여부는 같은 사용자의 같은 날 `Game Completed` / `Game Given Up`으로 보인다. 피드백 내용은 웹훅으로 받으므로 길이만 따로 볼 일이 없다. `method`는 지금 `native_share` / `link_copy` 두 값이고, 공유 방식을 추가할 예정이라 남긴다. 공유로 들어온 쪽은 유입 경로(`initial_utm_medium = share`)로 본다
영향 — `useShareLink`, `useFeedback`, `docs/rules/amplitude.md` 2장. Dec-22(그대로 유효)
상태 — active

### Dec-36. 이름 규칙: 속성은 snake_case, 이벤트는 Title Case
영향도: significant · 출처: ai-suggested

문제 — 이벤트 속성(camelCase), 사용자 속성(snake_case), 값(Title Case·소문자)이 섞여 있는데 어떻게 맞출 것인가
옵션
  (A) 속성 이름과 값을 모두 소문자 snake_case로
  (B) 이벤트 속성은 camelCase, 사용자 속성은 snake_case
  (C) 모두 camelCase
선택 — A. 이벤트 이름은 Title Case 유지. 직접 보내는 속성에 접두사를 붙이지 않고, 자동 속성과의 구분은 Amplitude 데이터 관리 화면의 설명으로 한다
근거 — Amplitude가 자동으로 붙이는 유입 경로 속성이 snake_case라 필터 목록이 한 방식으로 보인다. 새 프로젝트라 이름을 바꿔도 끊기는 차트가 없다. 이 김에 뜻이 어긋난 이름도 바꾼다: `date` → `quiz_date`, `hintUsed` → `hint_count`(값이 횟수), `progress_view` → `classic_progress_view`(excel과 짝). 접두사는 이름만 길어지고, 유입 경로 속성은 정해진 모양이라 구분된다
영향 — 모든 이벤트·사용자 속성, `docs/rules/amplitude.md` 5장, Dec-5 근거의 "기존 차트가 끊긴다"는 더 이상 해당 없음(결정은 유지)
상태 — active

### Dec-37. 수집 규칙은 `docs/rules/amplitude.md`로 분리하고, 작업 폴더는 하나로 유지
영향도: local · 출처: ai-suggested

문제 — 한도 축소로 시작한 작업 문서에 이벤트 재설계까지 들어가게 됐는데, 문서를 어떻게 나눌 것인가
옵션
  (A) 재설계용 작업 폴더를 새로 만든다
  (B) 현재 스키마·지표는 `docs/rules/amplitude.md`에 두고, 결정과 단계는 기존 작업 폴더에 둔다. 폴더 이름은 `amplitude-migration`으로 바꾼다
  (C) rules 문서 없이 작업 문서에만 둔다
선택 — B
근거 — 재설계와 한도 축소는 같은 배포(Dec-25)의 같은 코드 변경이고, 새 결정 여럿이 기존 결정을 이어받아 한 파일에 있어야 이력이 이어진다. 나중에 이벤트를 추가할 때 볼 기준은 작업 기록이 아니라 현재 규칙이라 rules 문서로 뺀다(`hint-giveup.md`와 같은 방식). 폴더 이름 변경은 사용자 요청
영향 — `docs/rules/amplitude.md`, plan.md 제목·Scope
상태 — active

### Dec-38. `Game Started`를 `Game Page Visited`로 이름 변경
영향도: local · 출처: user-suggested

문제 — 하루 1회 게임 화면 방문을 뜻하는 이벤트의 이름이 "게임을 시작했다"로 읽히는데, 이름을 바꿀 것인가
옵션
  (A) `Game Started` 유지
  (B) `Game Page Visited`
  (C) `Visited` 또는 `Page Viewed`
선택 — B
근거 — 실제 게임 참여는 첫 제출·힌트·포기 이벤트로 따로 센다(Dec-16, Dec-31). 그래서 이 이벤트는 방문만 뜻하고, 이름도 그래야 참여와 헷갈리지 않는다. "대상 + 과거분사" 규칙(Dec-36)에 맞고, `/stats` 등 다른 페이지 방문은 세지 않는다는 점도 드러난다. C는 어디를 방문했는지 모호하고, `Page Viewed`는 Amplitude 자동 이벤트 `[Amplitude] Page Viewed`와 헷갈린다
영향 — `useGameState`, `docs/rules/amplitude.md`, 방문 DAU 차트, Dec-15(의미는 그대로)
상태 — active

### Dec-39. 로그인 여부를 `logged_in` 사용자 속성으로 남김
영향도: local · 출처: user-suggested

문제 — 로그인 사용자와 게스트를 비교해 볼 수 있게 할 것인가
옵션
  (A) 따로 보내지 않고 user_id 유무로 본다
  (B) `logged_in` 사용자 속성을 보낸다
선택 — B
근거 — identify라 비용이 없고, 참여율·리텐션·테마를 로그인 여부로 나누는 것이 필터 하나로 된다. A는 user_id 유무를 차트 필터로 쓰기 편한지 확인되지 않았다
영향 — `AmplitudeInitializer`, `docs/rules/amplitude.md` 3장, Verification
상태 — active

### Dec-40. 게스트 id를 문의 대응용 사용자 속성으로 남김
영향도: local · 출처: user-suggested

문제 — 서버 데이터와 엮어 분석할 일은 거의 없지만, 문의가 왔을 때 서버 기록과 Amplitude에서 같은 게스트를 찾을 수 있게 할 것인가
옵션
  (A) 보내지 않는다 (Dec-23)
  (B) `guest_id`(`newmantle_guest_id`)를 사용자 속성으로 보낸다
선택 — B
근거 — 서버는 로그인 사용자를 Supabase user id, 게스트를 `newmantle_guest_id`(둘 다 UUID)로 식별한다. 로그인 사용자는 이미 user_id로 같은 값이 들어가므로 빠진 것은 게스트뿐이다. identify라 비용이 없다. 분석 지표에는 쓰지 않는다(Dec-28). 게스트 id는 첫 게임 요청 때 만들어지므로 페이지를 열 때 있으면 보내고, 처음 만들어질 때도 보낸다
영향 — `src/utils/api.ts`(게스트 id 생성), `AmplitudeInitializer`, `docs/rules/amplitude.md` 1·3장, Verification. Dec-23을 대체
상태 — active

### Dec-41. 피드백의 `quiz_date`는 열려 있는 게임 화면의 퀴즈 날짜
영향도: local · 출처: ai-selected

문제 — 피드백 창(설정·결과창)은 게임 화면의 `gameDate`를 받지 않는데, `Feedback Submitted`의 `quiz_date`를 어디서 얻을 것인가
옵션
  (A) 설정 버튼·결과창·피드백 행까지 `gameDate`를 props로 내려 준다
  (B) 저장된 게임 기록의 `lastPlayedDate`를 읽는다
  (C) `useGameDate`가 열려 있는 게임 화면의 퀴즈 날짜를 모듈 값으로 들고 있고(`getOpenQuizDate`), 피드백은 그 값을, 게임 화면이 없으면(통계 화면) 보내는 시점의 KST 오늘을 쓴다
선택 — C
근거 — 설정 버튼은 헤더에 있고 통계 화면에도 있어 A는 여러 컴포넌트를 거쳐야 하고 통계 화면에는 넘길 날짜가 없다. B는 통계 화면에서 며칠 전 기록의 날짜가 실릴 수 있다. C는 게임 화면을 연 채 자정이 지나도 어제 퀴즈 날짜를 쓰고, 게임 화면이 없으면 오늘로 둔다. 웹훅 본문의 `quizDate`(보내는 시점 KST, `docs/tasks/ui/feedback` Dec-10)는 바꾸지 않는다
영향 — `src/hooks/useGameDate.ts`, `src/hooks/useFeedback.ts`, Dec-34
상태 — active

### Dec-42. `logged_in`은 세션을 읽은 뒤 보내고, `Game Page Visited`를 기다리게 하지 않음
영향도: local · 출처: ai-selected

문제 — 로그인 여부는 Supabase 세션을 비동기로 읽어야 알 수 있는데, 페이지를 열 때의 identify를 `Game Page Visited`보다 먼저 보내야 한다(Dec-29). 방문 이벤트를 세션 확인까지 미룰 것인가
옵션
  (A) `AmplitudeInitializer`에서 세션을 읽은 뒤(`getSession`, `onAuthStateChange`) `logged_in`을 보내고, 방문 이벤트는 그대로 둔다
  (B) 방문 이벤트를 세션을 읽은 뒤로 미룬다
선택 — A
근거 — 방문 이벤트는 테마 identify 뒤 게임 화면이 그려지고 퀴즈 날짜가 정해진 다음 렌더에서 나가므로, 세션 읽기가 보통 먼저 끝난다. B는 게임 상태 훅이 Supabase에 기대게 되고 방문 기록이 비동기가 된다. 순서가 어긋나는지는 배포 후 Verification("처음 들어온 사용자의 `Game Page Visited`에 `logged_in`이 비어 있지 않다")으로 보고, 비어 있으면 B를 다시 본다
영향 — `AmplitudeInitializer`, Verification, Dec-29, Dec-39
상태 — active

### Dec-43. 게임이 끝난 뒤의 첫 제출을 `Post Game Word Submitted`로 남김
영향도: significant · 출처: user-suggested

문제 — 정답·포기로 게임이 끝난 뒤에도 단어를 계속 내 보는지 알고 싶다. 끝난 뒤에는 힌트·포기 버튼을 쓸 수 없고 제출만 할 수 있다
옵션
  (A) 보내지 않는다. 서버 로그로만 본다
  (B) `Word Submitted`에 "끝난 뒤인지" 속성을 붙인다
  (C) 새 이벤트 `Post Game Word Submitted`를 끝난 뒤 그날 첫 제출에 1회 보내고, 어떻게 끝났는지 `ended_by`(`solved` / `given_up`)를 싣는다. `Word Submitted`는 게임 중 제출로 좁혀 두 이벤트가 함께 나가지 않게 한다
선택 — C
근거 — `Word Submitted`는 그날 첫 제출 하나뿐이라 B로는 "끝난 뒤에도 냈는지"를 담을 수 없다. A는 정답자·포기자가 계속 하는지를 UI 설정과 함께 볼 수 없다. `ended_by`가 있으면 정답자와 포기자를 차트 하나로 나눠 본다. 이미 낸 단어의 재입력은 세지 않는다. 보고 싶은 것은 "새 단어로 계속 도전하나"이고, 재입력은 대부분 정답이나 낸 단어를 다시 확인하는 것이라서다(사용자 선택). 입력 0개에서 포기한 뒤의 첫 제출은 `Post Game Word Submitted`만 나간다. 그 사용자의 참여는 `Game Given Up`으로 잡힌다. 비용은 1인 하루 최대 1개가 늘어 최대 약 7개로, 예산(Dec-21)과 한도 안이다
영향 — `docs/rules/amplitude.md` 2·6장, Scope, Phase 2, Verification, Dec-2(게임 중으로 좁힘), Dec-21
상태 — active

### Dec-44. 제출로 세는 범위: 서버가 단어를 판정한 것
영향도: significant · 출처: ai-suggested

문제 — `Word Submitted`(Dec-2)와 `Post Game Word Submitted`(Dec-43)에서 무엇을 "제출"로 셀 것인가. 지금 규칙("서버가 응답한 것만")은 서버가 404로 답하는 없는 단어를 세는지 애매했고, 구현은 세지 않았다
옵션
  (A) 순위·정답 응답만 센다 (지금 구현)
  (B) 서버가 단어를 판정한 것을 센다: 순위·정답 응답과 없는 단어(404) 응답. 네트워크·서버 오류와 이미 낸 단어의 재입력은 세지 않는다
  (C) 오류까지 포함해 제출 요청을 보낸 것을 모두 센다
선택 — B
근거 — `Word Submitted`는 그날 플레이를 시도했는지 보는 참여 표시다. 처음 들어와 없는 단어를 내 보고 나간 사용자도 플레이를 시도했으므로 A는 참여를 빠뜨린다(사용자 지적). 오류는 사용자 행동이 아니라 우리 쪽 실패이고, 다시 내서 성공하면 그때 잡힌다. 빠지는 것은 오류만 겪고 떠난 사용자뿐인데, 이는 장애 영향이라 Sentry·서버 오류 로그의 일이다. 힌트·포기도 처리된 것만 센다는 기준과 맞는다. 오류의 제출 시도는 서버 제출 로그에 남지 않고 따로 집계할 계획도 없다
영향 — `docs/rules/amplitude.md` 2장, Glossary(제출), Verification, Dec-2, Dec-43
상태 — active

### Dec-45. `Word Submitted`에 첫 제출의 판정 결과 `result`를 실음
영향도: local · 출처: ai-suggested

문제 — 첫 제출이 없는 단어였는지를 Amplitude에서 볼 것인가
옵션
  (A) 속성 없이 둔다 (Dec-32)
  (B) `result`(`accepted`: 순위·정답 응답 / `unknown_word`: 없는 단어)를 싣는다
선택 — B
근거 — "첫 제출이 없는 단어였던 사용자 중 다른 행동 없이 떠난 비율"을 방문·이탈과 이어서 볼 수 있다. 서버 로그는 요청 단위라 방문부터 이탈까지를 한 흐름으로 보기 어렵다. 응답을 받은 뒤 보내므로 이벤트 수는 그대로다. Dec-32에서 속성을 뺀 이유는 값이 항상 같아서(`attempt` 1)였고, `result`는 사용자마다 달라 그 이유에 걸리지 않는다. `Post Game Word Submitted`에는 싣지 않는다. 끝난 뒤 계속하는지만 보면 된다
영향 — `docs/rules/amplitude.md` 2장, Verification, Dec-32(`Word Submitted` 부분)
상태 — active

### Dec-46. 그날 첫 제출 판단에 보낸 퀴즈 날짜 기록을 더함
영향도: local · 출처: ai-selected

문제 — 없는 단어는 게임 기록에 남지 않아서, "기록에 직접 낸 단어가 없으면 첫 제출"이라는 규칙으로는 없는 단어를 낸 뒤 다시 낼 때 `Word Submitted`가 또 나간다. 끝난 뒤 첫 제출도 같은 문제가 있다
옵션
  (A) 방문(Dec-10)처럼 보낸 퀴즈 날짜를 `localStorage`에 적고, 같은 날짜면 보내지 않는다
  (B) A에 더해, `Word Submitted`는 게임 기록에 직접 낸 단어가 있어도 보내지 않는다
선택 — B
근거 — 날짜 기록만 보면 배포 당일 이미 플레이 중인 사용자에게 `Word Submitted`가 한 번 더 나간다. 게임 기록 조건을 함께 두면 기록을 읽을 수 없을 때도 이미 낸 단어가 있는 기록에서는 보내지 않는다. 끝난 뒤 첫 제출은 새 이벤트라 배포 당일 1회 나가도 문제가 없어 날짜 기록만 본다. 날짜 기록을 읽을 수 없으면 그 조건은 보내는 쪽으로 본다(Dec-10)
영향 — `src/utils/analytics.ts`, Verification, Dec-10
상태 — active

### Dec-47. 게임 로직 정보가 서버 로그에 다 있어도 행동별 첫 이벤트를 유지
영향도: significant · 출처: user-suggested

문제 — 서버 이벤트 로그에 제출(없는 단어 포함)·힌트·포기가 사용자 id·시각과 함께 남는 것을 확인했다(`newmantle-game/fastapi/app/features/game/v2/routers.py`). 게임 로직 정보는 서버에서 볼 수 있고, Amplitude에서만 할 수 있는 것은 UI 설정·유입 경로로 나누는 것뿐이다. 그렇다면 Dec-31을 다시 B(`Game Played` 하나)로 합칠 것인가
옵션
  (A) 지금 구성(Dec-31 A, Dec-43, Dec-45)을 유지한다
  (B) `Word Submitted`·`Hint Requested`·`Initial Consonant Hint Requested`·`Post Game Word Submitted`를 그날 첫 플레이 행동 1회 `Game Played`로 합친다
선택 — A
근거 — 행동별 이벤트는 나중에 합치기 쉽지만, 합쳐 둔 기간의 행동별 데이터는 되살릴 수 없다(사용자 선택). 비용은 1인 하루 최대 약 8개로 한도 안이다. 앞으로 Amplitude에 넣을지는 `docs/rules/amplitude.md` 1장의 기준으로 판단한다. 배포 후 행동별 이벤트를 쓰지 않는다면 B로 합친다
영향 — `docs/rules/amplitude.md` 1장, Dec-21, Dec-28, Dec-31
상태 — active
