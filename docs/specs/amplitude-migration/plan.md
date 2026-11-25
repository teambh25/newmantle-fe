# Amplitude 새 프로젝트 이전과 이벤트 재설계
> 새 Amplitude 프로젝트로 옮기면서 자동 수집을 끄고, Amplitude가 맡을 것(방문·참여·완료 여부와 UI 사용)만 정해진 이름으로 하루 몇 개씩 보내게 한다. 1인 하루 평균 약 2~4개로 월 한도(2M) 안에 들어온다

## 1. Context
- 배경
  - 무료 플랜 한도는 월 2M 이벤트인데, 2026-11-10 기준 이번 달 10일 만에 넘었다. 하루 20만 개 이상, 1인당 하루 200개 이상이다
  - 한도 초과로 기존 계정이 잠겨 이벤트별 수치를 볼 수 없다. 새 계정·프로젝트를 만들어 옮긴다 (Dec-25)
  - 원인 1: SDK 초기화 옵션에 `sessions: true`만 있었다. 설치된 SDK(`@amplitude/analytics-browser@2.9.0-featureremoteconfig.0`)는 `false`로 명시하지 않은 기본 수집(페이지뷰·폼·파일 다운로드·세션·유입 경로)과 `autocapture`(클릭·입력)를 모두 켠다. 단어를 낼 때마다 폼·클릭 이벤트가 같이 나간다
  - 원인 2: 직접 보내는 `Word Submitted`(제출마다), `Hint Requested`(힌트마다), `Game Started`(페이지 로드·테마 전환마다)가 행동 횟수에 비례해 나간다
  - 서버 로그로 세션당 단어 제출 수를 확인했다(평일 하루 세션당 약 89회). 제출 1회마다 `Word Submitted`와 SDK 폼·클릭 이벤트가 함께 나가는 것이 주원인이다
  - 대시보드를 어차피 새로 만들어야 하므로, 이 김에 수집 의도가 불분명하던 이벤트·속성과 이름을 정리한다 (Dec-25, Dec-28)
- Amplitude로 보려는 것 (Dec-28)
  - 방문 DAU·리텐션, 참여 비율, 정답·포기·중도 이탈 비율, 힌트 사용 여부, 테마·진행 상황 보기 사용, 공유·피드백, 유입 경로
  - 위 지표를 테마·보기 설정별로 나눠 보는 것
  - 횟수·분포(제출·힌트 횟수, 중도 이탈자의 진행 정도)는 서버 로그와 DB로 본다
- 외부 제약
  - 한도는 **이벤트 수** 기준이다. HTTP 요청 수나 속성 개수·크기는 상관없다. SDK가 1초 단위로 묶어 보내므로 배치 설정으로는 줄지 않는다
  - `$identify`, `$groupidentify`는 월 이벤트 한도에 포함되지 않는다. 그래서 사용자 속성과 유입 경로(attribution, identify로 전송)는 비용이 0이다
  - 일평균 사용자 약 1,000명 → 1인당 하루 평균 66개 이하여야 한도 안이다
  - 서버 기록은 바꾸지 않는다. 로그에는 제출·힌트·포기 요청이 요청마다 남고, DB(Supabase)에는 유저별로 하루 1 row가 집계된다(중도 이탈자 포함)
  - Amplitude와 서버 데이터는 분석에서 엮지 않는다(device_id ≠ `newmantle_guest_id`). 문의 대응용으로만 게스트 id를 사용자 속성으로 남긴다. 로그인 사용자는 user_id가 같다 (Dec-28, Dec-40)
  - 새 프로젝트의 데이터는 기존 계정 데이터와 이어지지 않는다. 기존 사용자도 새 사용자로 잡힌다(SDK 저장소 이름이 키에 따라 정해져 device_id를 새로 만든다). 로그인 사용자는 user_id로 이어진다
  - Amplitude 프로젝트에 Autocapture 원격 설정이 있으면 코드 옵션보다 우선한다
  - 로컬 테스트도 운영과 같은 프로젝트로 보낸다. 그래서 배포 전 테스트로 보낸 옛 이름 이벤트가 프로젝트에 남는다. 차트는 배포일 이후로 본다 (Dec-27)
- 기존 패턴
  - 수집 규칙(이벤트·속성·이름·지표): `docs/rules/amplitude.md` (Dec-37)
  - Amplitude 호출: `src/utils/amplitude.ts`(`initAmplitude`, `logEvent`, `setUserProperty`). 초기화와 로그인 user_id는 `src/components/AmplitudeInitializer.tsx`
  - 게임 이벤트: `src/hooks/useGameState.ts`, 테마: `src/hooks/useUITheme.ts`, 진행 상황 보기: `src/hooks/useProgressView.ts`(`src/utils/progressView.ts`), 공유: `src/hooks/useShareLink.ts`, 피드백: `src/hooks/useFeedback.ts`
  - 오류 수집: Sentry(`@sentry/nextjs`, `src/instrumentation-client.ts`)
  - 힌트 순위 계산: `src/utils/gameRules.ts`(`getNextHintRank`, `getTopRank`)

## 2. Scope
- In
  - 새 프로젝트 API 키로 교체하고 `NEXT_PUBLIC_AMPLITUDE_API_KEY` 환경변수로 옮김. 키가 없으면 초기화하지 않는다 (Dec-25, Dec-26)
  - SDK 자동 수집 끄기: 클릭·입력, 폼, 페이지뷰, 파일 다운로드, 세션. 유입 경로만 유지 (Dec-14)
  - 이벤트 빈도 줄이기
    - `Game Started` → `Game Page Visited`로 이름 변경, 페이지 로드 시점 하루 1회. 의미는 방문 그대로 (Dec-3, Dec-15, Dec-38)
    - `Word Submitted`: 게임 중 그날 첫 제출만 (Dec-2, Dec-31, Dec-43)
  - `Post Game Word Submitted` 추가: 게임이 끝난 뒤 그날 첫 제출 (Dec-43)
  - 제출로 세는 범위를 서버가 단어를 판정한 것(없는 단어 포함)으로 정함 (Dec-44)
  - `Stats Page Visited` 추가: 통계 페이지 방문 하루 1회 (Dec-48)
    - `Hint Requested`: 그날 첫 일반 힌트만 (Dec-4, Dec-31)
  - 이벤트 속성을 `docs/rules/amplitude.md` 2장대로 바꿈
    - 모든 이벤트에서 `theme` 제거 (Dec-29)
    - `Word Submitted`: `result`만 (`word`, `similarity`, `attempt`, `isCorrect` 제거) (Dec-9, Dec-32, Dec-45) / `Post Game Word Submitted`: `ended_by` (Dec-43)
    - `Hint Requested`: `attempts`, `requested_rank`, `top_rank` / `Initial Consonant Hint Requested`: `attempts`, `top_rank` (Dec-32)
    - `Game Completed`: `timeSpent` 제거, `time_to_solve` / `Game Given Up`: `time_to_give_up` 추가 (Dec-33)
    - `Result Shared`: `method`만 (`attempts` 제거) / `Feedback Submitted`: `entry`만 (`length` 제거) (Dec-35)
    - 게임·공유·피드백 이벤트에 `quiz_date` (Dec-34)
    - 속성 이름과 값을 snake_case로 (Dec-36)
  - 사용자 속성을 `docs/rules/amplitude.md` 3장대로 바꿈
    - `progress_view` → `classic_progress_view` (Dec-36)
    - `theme_chosen`, `classic_progress_view_chosen`, `excel_progress_view_chosen` 추가 (Dec-30)
    - `logged_in` 추가 (Dec-39)
    - `guest_id` 추가. 문의 대응용 (Dec-40)
    - 페이지를 열 때의 identify를 `Game Page Visited`보다 먼저 호출 (Dec-29)
  - 이벤트 삭제
    - `Share Error` → Sentry로 옮김 (Dec-17)
    - `Feedback Opened` (Dec-18)
    - `Theme Switched`, 그리고 쓰지 않는 `Theme Changed`와 `toggleTheme` (Dec-19)
    - `Progress View Switched` (Dec-29)
  - 수집 규칙 문서 `docs/rules/amplitude.md` (Dec-37)
  - 새 프로젝트에 지표 차트 만들기 (Phase 1)
- Out
  - 서버 로그·DB 집계 변경
  - Amplitude와 서버 데이터를 엮은 분석, device_id를 게스트 id로 맞추기 (Dec-28)
  - 중도 이탈자의 제출·힌트 횟수를 Amplitude로 보내는 것 (Dec-7)
  - 새 공유 방식 추가. 추가할 때 `method` 값만 늘린다 (Dec-35)
  - 다른 작업 문서 수정. `Feedback Opened` 삭제로 `docs/tasks/ui/feedback/decision.md`의 Dec-8 일부가 낡고, 속성 이름 변경으로 `docs/rules/hint-giveup.md` E-1의 속성 이름이 낡지만 여기서 고치지 않는다

## 3. Plan
### Phase 0 — 원인 조사, 수집 규칙과 지표 기준 정하기
- 완료 기준: 이 문서와 decisions.md에 이벤트별 빈도·속성 규칙, 지표별 기준 이벤트가 정리되어 있다
- 진행상황: [x] 완료 (2026-11-13), 현재 코드 기준으로 재검토 완료 (2026-11-17), 분석 관점 재설계와 `docs/rules/amplitude.md` 작성 완료 (2026-11-18)

### Phase 1 — 새 프로젝트 준비
- 완료 기준
  - 새 Amplitude 프로젝트가 있고, Autocapture 원격 설정이 꺼져 있고, 시간대가 Asia/Seoul이다
  - 배포 환경에 `NEXT_PUBLIC_AMPLITUDE_API_KEY`가 설정되어 있다
  - 로컬(`.env`에 새 키)에서 이벤트가 새 프로젝트에 들어오는 것을 확인했다. 운영 배포는 Phase 2에서 한 번에 한다. 로컬 테스트도 같은 프로젝트로 보낸다 (Dec-27)
  - 아래 Prerequisites의 차트가 새 프로젝트에 만들어져 있다. 이벤트 이름이 확정된 뒤에 만든다
- 진행상황: [~] 진행 중. 로컬 연동 확인 완료 (2026-11-18), 원격 설정·시간대·배포 환경변수·차트 대기

### Phase 2 — 구현과 배포 (한 번에, Dec-25)
- 범위: Scope In의 코드 변경 전부. 기준은 `docs/rules/amplitude.md`
- 완료 기준
  - 환경변수의 키로 초기화되고, 키가 없으면 초기화하지 않는다
  - 클릭·입력·폼·페이지뷰·파일 다운로드·세션 수집이 꺼져 있고, 유입 경로만 켜져 있다
  - `Game Page Visited`·`Word Submitted`·`Hint Requested`가 하루 1회 규칙대로 나간다
  - 모든 이벤트와 사용자 속성이 `docs/rules/amplitude.md`의 이름·속성과 일치한다
  - 삭제한 이벤트가 더 이상 나가지 않고, 클립보드 복사 실패는 Sentry에 기록된다
  - 관련 테스트와 기존 이벤트 테스트를 통과한다. `npm run lint`, `npm run build`를 통과한다
- 진행상황: [~] 진행 중. API 키 환경변수화, SDK 자동 수집 끄기 완료 (2026-11-18). 나머지 코드 변경 완료, 테스트·`npm run lint` 통과 (2026-11-23), `npm run build` 통과 (2026-11-24). 게임 끝난 뒤 제출·제출 범위 변경(Dec-43~46) 구현, 테스트·lint·build 통과 (2026-11-25). 통계 페이지 방문(Dec-48) 구현, 테스트·lint·build 통과 (2026-11-25). 운영 배포 대기

### Phase 3 — 배포 후 확인
- 완료 기준: 아래 Verification의 "Amplitude에서 직접 확인" 중 배포 후 항목을 모두 확인했다
- 진행상황: [ ] 대기

## 4. Verification
- 테스트 방식은 CLAUDE.md의 Testing 규칙을 따른다. 기록된 Amplitude 이벤트(이름·횟수·속성), 사용자 속성(identify), Sentry 호출, SDK 초기화 옵션으로 확인한다
- 코드로 보는 것은 두 가지다 (`src/test/README.md` 1장 "분석 이벤트")
  - 어떤 행동에 이벤트가 나가고 어떤 행동에 막히는가: 하루 1회 판단
  - 전송 직전에만 하는 가공: `time_to_give_up`, 피드백의 `quiz_date`, `_chosen`
- payload를 보지 않는 것: 다른 모듈에서 검증한 값과 그대로 넘기는 값(`attempts`, `requested_rank`, `top_rank`, `hint_count`, `initial_consonant_hint_used`, `method`, `entry`, `logged_in`, `guest_id`), 이벤트·속성 이름, `theme` 제거, 삭제한 이벤트, identify 순서. 코드 리뷰와 아래 "Amplitude에서 직접 확인"으로 본다
- 하루 1회 판단 (Dec-10, Dec-11, Dec-31)
  - 방문: 퀴즈 날짜가 빈 값이면 보내지 않는다. 오늘 보낸 기록이 있으면 보내지 않고, 없거나 다른 날짜면 보낸다. 기록을 읽을 수 없으면 보낸다
  - 게임 중 첫 제출: 게임이 끝나지 않았고, 오늘 보낸 기록이 없고, 그날 기록에 직접 낸 단어가 없으면 보낸다. 힌트로 받은 단어는 세지 않는다. 보낸 기록을 읽을 수 없으면 게임 기록만으로 판단한다 (Dec-46)
  - 끝난 뒤 첫 제출: 정답·포기로 게임이 끝났고 오늘 보낸 기록이 없으면 보낸다. 기록이 없거나 다른 날짜이거나 읽을 수 없으면 보낸다 (Dec-43, Dec-46)
  - `ended_by`: 포기했으면 `given_up`, 아니면(정답) `solved` (Dec-43)
  - 첫 일반 힌트: 그날 일반 힌트를 쓴 적이 없으면 첫 일반 힌트다. 초성 힌트는 세지 않는다
- 대표 시나리오 (Dec-21)
  - 오늘 기록이 없을 때 → 제출 실패, 단어 여러 개 제출, 이미 낸 단어 재입력, 일반 힌트 실패, 일반 힌트 여러 번, 초성 힌트, 새로고침, 테마 전환 후 정답을 맞히면 → `Game Page Visited`, `Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`, `Game Completed`가 1회씩 기록된다
- 제출 판정 결과 (Dec-44, Dec-45)
  - 오늘 기록이 없을 때 → 제출 오류, 없는 단어, 단어 제출을 하면 → `Word Submitted` 1회, `result`는 `unknown_word`
- 끝난 뒤 제출 (Dec-43, Dec-44)
  - 정답을 맞힌 뒤 → 이미 낸 단어 재입력, 제출 오류를 하면 → `Post Game Word Submitted` 0회. 이어서 없는 단어, 단어 여러 개 제출, 새로고침 후 단어 제출을 하면 → 1회. `Word Submitted`는 정답 전의 1회 그대로다
  - 입력 0개에서 포기한 뒤 → 단어를 제출하면 → `Post Game Word Submitted` 1회, `Word Submitted` 0회
- 통계 페이지 방문 (Dec-48)
  - 오늘 보낸 기록이 없을 때 → 통계 페이지를 열고, 닫았다 다시 열면 → `Stats Page Visited` 1회. 하루 1회 판단 규칙은 방문과 같은 순수 함수로 본다
- 시간 (Dec-33)
  - 단어 제출 → 60초 → 새로고침 → 30초 → 포기하면 → `time_to_give_up` 90
  - 기존 `Game Completed` 플레이 시간 테스트는 `time_to_solve`를 보도록 이름만 바꾼다. 첫 행동 시각 규칙의 유일한 검증이다
- 피드백의 퀴즈 날짜 (Dec-34)
  - 어제 퀴즈 화면을 연 채 KST 자정이 지난 뒤 → 피드백을 보내면 → `quiz_date`는 어제다
- `_chosen` (Dec-30)
  - 테마·classic 보기·excel 보기 각각, 저장값이 없거나 올바르지 않으면 → 기본값, `_chosen` false. 올바른 저장값이 있으면 → 저장값, `_chosen` true
- 기존 테스트 정리: 도메인 규칙과 겹치는 이벤트 payload 검증을 뺀다. `Game Given Up`의 시도 횟수(`useGameState.test.ts`), 공유 이벤트의 시도 횟수(`HintGiveUp.test.tsx`)
- API 키 (Dec-26)
  - `NEXT_PUBLIC_AMPLITUDE_API_KEY`가 있을 때 → 초기화하면 → 그 키로 SDK를 초기화한다
  - `NEXT_PUBLIC_AMPLITUDE_API_KEY`가 없거나 빈 값일 때 → 초기화하면 → SDK를 초기화하지 않는다
- SDK 자동 수집 (Dec-14)
  - 키가 있을 때 → 초기화하면 → 요소 클릭·입력 자동 수집, 폼·페이지뷰·파일 다운로드·세션 자동 수집이 꺼지고 유입 경로만 켜진다
- Amplitude에서 직접 확인 (코드 테스트는 SDK를 mock으로 바꿔 호출까지만 본다. 서버 집계·원격 설정·실제 전송은 여기서 본다)
  - 배포 전 (Phase 1)
    - 프로젝트 설정에서 Autocapture 원격 설정이 꺼져 있고, 시간대가 Asia/Seoul이다
    - 로컬에서 보낸 이벤트가 새 프로젝트에 들어온다
  - 배포 후 (Phase 3, 배포 후 며칠)
    - 이벤트 목록에 `[Amplitude] ...` 자동 이벤트와 `session_start` / `session_end`가 없다. 들어오면 원격 설정을 의심한다
    - 삭제하거나 이름을 바꾼 이벤트(`Game Started`, `Share Error`, `Feedback Opened`, `Theme Switched`, `Theme Changed`, `Progress View Switched`)가 배포일 이후 0이다
    - 1인 하루 평균 이벤트가 예산(Dec-21) 안이다
    - 처음 들어온 사용자의 `Game Page Visited`에도 사용자 속성 `theme`, `theme_chosen`, 진행 상황 보기, `logged_in`이 비어 있지 않다. 비어 있으면 identify 순서를 의심한다 (Dec-29)
    - User Lookup으로 몇 사용자의 이벤트를 열어, 이벤트마다 `docs/rules/amplitude.md` 2장의 속성만 snake_case로 있고 `theme`이 없다
    - 공유 링크를 새 브라우저(시크릿 창)로 열면 그 사용자의 `initial_utm_medium`이 `share`다
    - 로그인하면 user_id가 붙고 `logged_in`이 true가 된다
    - 게임을 한 게스트의 사용자 속성 `guest_id`가 브라우저 localStorage의 `newmantle_guest_id`와 같다
    - `docs/rules/amplitude.md` 6장의 차트에 값이 나온다

## 5. Prerequisites
배포 전에 갖출 것 (Phase 1):
- 새 Amplitude 계정·프로젝트. 데이터센터를 EU로 만들면 초기화 옵션에 `serverZone: "EU"`가 필요하다(기본 US는 불필요)
- 새 프로젝트의 Autocapture 원격 설정이 꺼져 있는지 (Dec-14)
- 프로젝트 시간대 Asia/Seoul (Dec-34)
- 배포 환경(운영)에 `NEXT_PUBLIC_AMPLITUDE_API_KEY` 설정 (Dec-26). `.env`가 git에 올라가 있어, 키를 커밋하면 Vercel 빌드도 그 키를 쓴다. 나중에 `.env.local`과 Vercel 환경변수로 나눌 수 있다
- 새 프로젝트에 만들 차트: `docs/rules/amplitude.md` 6장의 지표
- Amplitude 데이터 관리 화면에서 직접 보내는 속성에 설명 달기 (Dec-36)

## 6. Glossary
- **하루**: 퀴즈 날짜(KST `gameDate`) 기준. 게임 상태가 리셋되는 기준과 같다 (Dec-11)
- **제출**: 서버가 단어를 판정한 단어 제출(순위·정답 응답, 없는 단어 응답). 네트워크·서버 오류와 이미 낸 단어의 재입력은 제출이 아니다 (Dec-44)
- **게임 중 / 끝난 뒤**: 정답을 맞히거나 포기하기 전 / 후
- **일반 힌트 / 초성 힌트**: 일반 힌트는 `hint/{1~999}`로 힌트 버튼에서 요청한다. 초성 힌트는 `hint/0`으로 포기 버튼 확인 창에서 받는다 (`docs/rules/hint-giveup.md`)
- **방문 DAU**: 하루 `Game Page Visited` 고유 사용자 수. 게임 화면에 들어온 사용자다. `/stats` 등으로 바로 들어와 게임 화면을 거치지 않은 사용자는 빠진다
- **참여 비율**: 그날 제출·일반 힌트·초성 힌트·포기 중 하나라도 한 고유 사용자 / 방문 DAU
- **중도 이탈자**: 그날 참여했지만 정답도 포기도 하지 않은 사용자. 종료 이벤트가 없다
- **자동 수집**: SDK가 코드 없이 보내는 이벤트. `[Amplitude] ...`(클릭·입력·폼·페이지뷰·파일 다운로드)와 `session_start` / `session_end`
- **사용자 속성 (user property)**: 사용자에게 붙는 값. identify로 보내며, Amplitude가 그 뒤 들어오는 그 사용자의 이벤트에 그 시점 값을 찍는다. 이벤트 한도에 포함되지 않는다
- **원격 설정**: Amplitude 프로젝트 화면에서 정하는 Autocapture 설정. 코드 옵션보다 우선한다

## 7. Backlog
- 같은 날 재방문 패턴(중도 이탈 후 재접속 등)이 궁금해지면 세션 수집을 다시 켠다 (Dec-14)
- `.env`의 Amplitude 키를 `.env.local`과 Vercel 환경변수(Production / Preview 구분)로 옮긴다 (Dec-26)
- 힌트를 다 쓴 뒤에도 더 원하는지(막힌 힌트 버튼을 누르는지). 연타와 구분하기 어려워 보류했다. 먼저 정답·포기 이벤트의 `hint_count`가 상한에 닿은 비율로 본다
- 배포 후 행동별 첫 이벤트(`Word Submitted`, `Hint Requested`, `Initial Consonant Hint Requested`, `Post Game Word Submitted`)를 쓰지 않으면 `Game Played` 하나로 합친다 (Dec-47)
- 공유 방식을 추가하면 `method` 값을 `docs/rules/amplitude.md`에 추가한다 (Dec-35)
