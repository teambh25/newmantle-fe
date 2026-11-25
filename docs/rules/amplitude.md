# Amplitude 수집 규칙

Amplitude에 무엇을, 언제, 어떤 이름으로 보내는지 정한다. 이벤트를 추가하거나 바꿀 때 이 문서를 먼저 고친다.
결정 이유는 `docs/specs/amplitude-migration/decisions.md`. 코드는 Phase 2 배포 전까지 이 규칙과 다를 수 있다.

## 1. 역할 분담

| 무엇을 보나 | 어디서 보나 |
|---|---|
| 단어 제출·힌트·포기의 횟수와 분포, 중도 이탈자의 진행 정도 | 게임 서버 로그(요청마다), DB(유저별 하루 1 row) |
| 방문, 참여 여부, 정답·포기 여부, UI 사용(테마, 진행 상황 보기), 공유·피드백, 유입 경로 | Amplitude |

- Amplitude와 서버 데이터를 분석에서 엮지 않는다. 다만 문의가 오면 같은 사람을 찾을 수 있게 서버의 사용자 식별자를 남긴다: 로그인 사용자는 user_id(Supabase user id), 게스트는 사용자 속성 `guest_id`(`newmantle_guest_id`). 둘 다 UUID다
- 그래서 UI 설정과 함께 봐야 하는 최소한의 게임 정보(참여, 첫 힌트, 정답·포기)는 Amplitude에 직접 보낸다
- 새 이벤트·속성은 둘 중 하나에 해당할 때만 Amplitude에 넣는다. 보기 편하다는 것만으로는 넣지 않는다 (Dec-47)
  - 서버가 볼 수 없는 것: 방문(요청 없이 나간 사용자 포함), 공유, 피드백, UI 설정, 유입 경로
  - UI 설정·유입 경로로 나눠 봐야 하는 게임 정보. 서버 데이터와 엮지 않으므로 Amplitude에 직접 둔다
- 서버 이벤트 로그(`newmantle-game` `logs/raw-events`, 30일 보관, Airflow가 매일 수집)에는 제출(없는 단어 포함)·힌트·포기가 사용자 id·시각과 함께 남는다. 서버 오류(5xx)는 사용자 식별자 없이 앱 로그에만 남는다

## 2. 이벤트

모든 이벤트는 횟수에 제한이 있다. 반복할 수 있는 핵심 행동(단어 제출, 일반 힌트)에 비례해서 보내지 않는다.

| 이벤트 | 언제 | 속성 |
|---|---|---|
| `Game Page Visited` | 게임 화면에 들어올 때, 퀴즈 날짜당 1회 | `quiz_date` |
| `Word Submitted` | 게임 중(정답·포기 전) 그날 첫 단어 제출 | `quiz_date`, `result` |
| `Post Game Word Submitted` | 게임이 끝난 뒤(정답·포기 후) 그날 첫 단어 제출 | `quiz_date`, `ended_by` |
| `Hint Requested` | 그날 첫 일반 힌트 | `quiz_date`, `attempts`, `requested_rank`, `top_rank` |
| `Initial Consonant Hint Requested` | 초성 힌트 (하루 최대 1회) | `quiz_date`, `attempts`, `top_rank` |
| `Game Completed` | 정답 | `quiz_date`, `attempts`, `time_to_solve`, `hint_count`, `initial_consonant_hint_used` |
| `Game Given Up` | 포기 버튼으로 포기 | `quiz_date`, `attempts`, `time_to_give_up`, `hint_count`, `initial_consonant_hint_used` |
| `Result Shared` | 공유에 성공할 때마다 | `quiz_date`, `method` |
| `Feedback Submitted` | 피드백 제출 | `quiz_date`, `entry` |
| `Stats Page Visited` | 통계 페이지에 들어올 때, 하루(KST 날짜) 1회 | 없음 |

- "하루", "그날"은 퀴즈 날짜(KST `gameDate`) 기준이다. 자정을 넘겨도 열어 둔 화면은 어제 퀴즈다
- "제출"은 서버가 단어를 판정한 것만 센다: 순위·정답 응답과 없는 단어 응답. 네트워크·서버 오류와 이미 낸 단어의 재입력은 세지 않는다
- "힌트", "포기"는 성공한 것만 센다
- `Word Submitted`와 `Post Game Word Submitted`는 함께 나가지 않는다. 입력 0개에서 포기한 뒤의 첫 제출은 `Post Game Word Submitted`만 나간다
- "그날 처음"인지 저장소가 막혀 판단할 수 없으면 보낸다
- 중도 이탈은 이벤트가 없다. "그날 참여했는데 정답도 포기도 없는 사용자"로 센다

### 이벤트 속성

| 속성 | 뜻 | 값 |
|---|---|---|
| `quiz_date` | 플레이 중인 퀴즈 날짜 | KST `YYYY-MM-DD` |
| `result` | 첫 제출의 판정 결과 | `accepted`(순위·정답 응답), `unknown_word`(없는 단어) |
| `ended_by` | 게임이 어떻게 끝났나 | `solved`(정답), `given_up`(포기) |
| `attempts` | 그 시점까지 낸 단어 수. 힌트로 받은 단어는 세지 않는다 | 정수 |
| `requested_rank` | 일반 힌트로 요청한 순위(`hint/{rank}`의 `rank`) | 1~999 |
| `top_rank` | 힌트 요청 직전의 최고 순위. 순위 안에 든 단어가 없으면 null | 1~999 또는 null |
| `time_to_solve` | 그날 첫 행동부터 정답까지 걸린 초. 새로고침해도 이어진다. 첫 행동이 곧 정답이면 0 | 숫자(초) |
| `time_to_give_up` | 그날 첫 행동부터 포기까지 걸린 초 | 숫자(초) |
| `hint_count` | 그날 쓴 일반 힌트 횟수 | 정수 |
| `initial_consonant_hint_used` | 그날 초성 힌트를 썼는지 | true / false |
| `method` | 공유 방식. 공유 방식이 늘면 값을 추가한다 | `native_share`(OS 공유 창), `link_copy`(링크 복사) |
| `entry` | 피드백을 보낸 곳 | `result`(결과창), `settings`(설정) |

## 3. 사용자 속성

identify로 보낸다. 월 이벤트 한도에 들어가지 않는다. Amplitude는 받은 값을 기억해 두고, 그 뒤 그 사용자의 이벤트에 그 시점의 값을 찍는다. 그래서 테마·보기 설정은 이벤트 속성으로 보내지 않는다.

| 속성 | 값 | 언제 보내나 |
|---|---|---|
| `theme` | `classic` / `excel` | 페이지를 열 때, 테마를 바꿀 때 |
| `theme_chosen` | true(저장된 값이 있음) / false(기본값) | 같음 |
| `classic_progress_view` | `card` / `bar` | 페이지를 열 때, classic 진행 상황 보기를 바꿀 때 |
| `classic_progress_view_chosen` | true / false | 같음 |
| `excel_progress_view` | `chart` / `bar` | 페이지를 열 때, excel 진행 상황 보기를 바꿀 때 |
| `excel_progress_view_chosen` | true / false | 같음 |
| `logged_in` | true / false | 페이지를 열 때, 로그인·로그아웃할 때 |
| `guest_id` | 서버가 게스트를 식별하는 UUID (`newmantle_guest_id`) | 페이지를 열 때 있으면, 처음 만들어질 때(첫 게임 요청 또는 피드백 전송). 만드는 곳(`ensureGuestId`)에서 보낸다 |

- 페이지를 열 때 보내는 identify는 `Game Page Visited`보다 먼저 호출한다. 그래야 그날 첫 이벤트에도 값이 찍힌다
- classic과 excel의 진행 상황 보기는 따로 저장되므로 속성도 따로 둔다
- `_chosen`이 false인 사용자는 기본값을 고른 것이 아니라 바꾼 적이 없는 것이다. "기본값을 선호한다"는 해석은 `_chosen = true`인 사용자로 한다
- 로그인 사용자는 user_id로 Supabase user id(UUID)를 보낸다
- `guest_id`는 문의 대응용이다. 분석 지표에 쓰지 않는다. 게스트 id는 첫 게임 요청이나 피드백 전송 때 만들어지므로, 둘 다 하지 않고 나간 첫 방문자에게는 없을 수 있다
- 유입 경로(`utm_*`, `referrer`, `referring_domain`, `initial_*`)는 SDK가 자동으로 보낸다. 공유 링크에는 `utm_medium=share`가 붙어서, 공유로 들어온 사용자는 `initial_utm_medium = share`로 보인다

## 4. 보내지 않는 것

- SDK 자동 수집: 요소 클릭·입력(autocapture), 폼, 페이지뷰, 파일 다운로드, 세션(`session_start` / `session_end`). 유입 경로만 켠다
- 횟수·분포 정보(모든 제출, 모든 힌트, 단어, 유사도): 서버에서 본다
- 오류: Sentry로 보낸다 (예: 공유 링크 복사 실패)
- 피드백 창 열기, 테마·진행 상황 보기 전환 행동: 사용자 속성으로 충분하다

## 5. 이름 규칙

- 이벤트 이름: Title Case, "대상 + 과거분사" (`Hint Requested`)
- 속성 이름과 값: 소문자 snake_case (`time_to_solve`, `link_copy`)
- 직접 보내는 속성에 접두사를 붙이지 않는다. 자동 속성과의 구분은 Amplitude 데이터 관리 화면의 설명으로 한다

## 6. 지표

| 지표 | 기준 |
|---|---|
| 방문 DAU, 방문 리텐션 | `Game Page Visited` 고유 사용자 |
| 참여 비율 | `Word Submitted`·`Hint Requested`·`Initial Consonant Hint Requested`·`Game Given Up` 중 하나라도 보낸 고유 사용자 / `Game Page Visited` 고유 사용자 |
| 정답률·포기율·중도 이탈률 | 참여 사용자 중 `Game Completed` / `Game Given Up` / 둘 다 없는 사용자 |
| 첫 제출이 없는 단어였던 비율·그 뒤 이탈 | `Word Submitted`의 `result` |
| 끝난 뒤에도 계속하는 비율 | `Post Game Word Submitted` 고유 사용자 / `Game Completed`·`Game Given Up` 고유 사용자, `ended_by`로 나눔 |
| 힌트 사용 | 첫 힌트 이벤트(`top_rank`, `attempts`), 정답·포기 이벤트의 `hint_count` |
| 테마·진행 상황 보기 비율 | 사용자 속성, 선호 해석은 `_chosen` 함께 |
| 로그인·게스트 비교 | 사용자 속성 `logged_in` |
| 공유 | `Result Shared` (공유하는 쪽), `initial_utm_medium = share` (들어온 쪽) |
| 피드백 | `Feedback Submitted`의 `entry` |
| 통계 페이지 사용 | `Stats Page Visited` 고유 사용자 |

위 지표를 테마·보기 설정·유입 경로별로 나눌 때는 사용자 속성 필터를 쓴다.

## 7. 프로젝트 설정

- API 키: `NEXT_PUBLIC_AMPLITUDE_API_KEY`. 없으면 SDK를 초기화하지 않는다
- 프로젝트 시간대: Asia/Seoul. 일 단위 차트가 KST 하루로 잘리게 한다
- Autocapture 원격 설정: 끈다. 켜져 있으면 코드 옵션을 덮어쓴다
- 예산: 1인 하루 평균 약 2~4개, 최대 약 6개 + 가끔 공유·피드백. 새 이벤트는 "1인이 하루에 최대 몇 번 보내는가"를 먼저 본다
