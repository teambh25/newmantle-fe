# 테스트 하네스

Vitest + React Testing Library + user-event. 실행 명령은 루트 `README.md`의 "Testing" 참고.

## 원칙

### 1. 기능을 테스트한다 (구현 세부가 아니라)

- "어떤 상태에서 무엇을 하면 어떻게 되는가"를 확인한다. 내부 함수 호출 순서, 내부 state·ref 이름, 컴포넌트 구조는 검증하지 않는다
- 결과는 바깥에서 보이는 것으로 확인한다: 서버에 간 요청(`gameServer.requests`), 훅이 돌려주는 상태, 화면에 보이는 요소, 저장된 `localStorage` 값, 기록된 Amplitude 이벤트
- 화면 테스트는 역할과 접근성 이름으로 요소를 찾는다 (`getByRole("button", { name: "힌트" })`). CSS 클래스·DOM 구조에 기대는 것은 다른 방법이 없을 때만
- 문구(토스트·안내 문장)는 검증하지 않는다. "있는지 / 없는지 / 어떤 선택지인지"만 본다
- 같은 규칙을 도메인 로직, 화면, 분석 이벤트(Amplitude) 사이에서 중복 검증하지 않는다. 로직에서 확인한 규칙은 화면에서 "버튼에 반영되는지"만 본다
- 화면 테스트보다 로직 테스트를 먼저 쓴다. 컴포넌트에서 화면에 넘길 값을 계산하는 코드는 `utils`의 순수 함수로 빼서 테스트한다 (예: `src/utils/board.ts`). 화면 테스트는 화면이 있어야만 확인할 수 있는 흐름(타이밍, 포커스, 창 열고 닫기, 여러 컴포넌트가 함께 움직이는 것)만 쓰고, 흐름마다 대표 케이스 하나로 한다
- 앱 로직이 없는 건 테스트하지 않는다. 예: 라이브러리가 처리하는 동작(Radix 창을 ESC·X·바깥 클릭으로 닫기), 상태와 상관없이 항상 보이는 요소. 모양은 작업의 `plan.md` Verification에 적고 화면에서 직접 확인한다
- 화면에서 눈으로 확인하는 것(배치, 색, 실제 폰 동작)과 시각·체감 타이밍(애니메이션 속도, 깜빡임, 사용자가 느끼는 지연)은 코드로 테스트하지 않는다. 작업의 `plan.md` Verification에 적는다
- 지연(`setTimeout`, "5초 뒤" 등)은 사용자가 보는 화면이나 요청 결과가 달라지는 것만 테스트한다 (예: 창이 늦게 열림, 안내가 저절로 사라짐, 요청 시간 초과). 실제 시간을 기다리지 않고 `vi.useFakeTimers()`와 `vi.advanceTimersByTime()`으로 확인한다 (아래 "시간과 타임존"). 결과가 달라지지 않는 타이머(라이브러리 내부, 애니메이션)는 테스트하지 않는다

#### 분석 이벤트 (Amplitude)

- 두 가지만 검증한다: 어떤 행동에 어떤 이벤트가 나가는가(또는 막히는가), 그리고 전송 직전에만 하는 가공·매핑 규칙
- 다른 모듈에서 이미 검증한 값이나 그대로 넘기는 값(passthrough)은 이벤트 payload로 다시 검증하지 않는다
- 호출 횟수 제한을 "최대 N회" 같은 느슨한 상한으로 여러 케이스에 쪼개지 않는다. 중복 방지는 핵심 규칙(같은 상태에서 1회만, 조건이 안 맞으면 0회)을 순수 함수나 대표 시나리오 1~2개로만 검증한다

### 2. mock은 외부 경계에서만

외부와 통신하거나 외부 서비스에 기록하는 것만 mock한다. 앱 내부 코드(훅, 컴포넌트, `utils`, UI 라이브러리)는 실제 코드를 쓴다.

| 대상 | 방식 | 위치 |
|---|---|---|
| 게임 서버 API | `fetch`를 가로채는 가짜 서버. API 클라이언트(`api.ts`)는 실제 코드 | `fakeGameServer.ts` |
| 피드백 웹훅 (Make.com) | 웹훅 URL로 가는 `fetch`만 가로채 본문을 기록. 실패(500)·네트워크 오류·붙잡기 | `fakeFeedbackWebhook.ts` |
| Supabase | 게스트(세션 없음) 고정 | `setup.ts` |
| Amplitude | `track` 등 spy | `setup.ts` |
| 축하 효과 (`canvas-confetti`) | 호출 spy | `setup.ts` |
| 시간·기기 타임존 | 가짜 타이머 + `process.env.TZ` | `clock.ts` |

- `api.ts`나 훅을 `vi.mock`하지 않는다. HTTP 경계에서 가로채야 API 클라이언트가 바뀌어도 테스트가 그대로 동작하고, 요청 경로(날짜·순위)까지 검증할 수 있다
- 파일 단위로 다른 mock이 필요하면 그 테스트 파일에서 `vi.mock`으로 덮어쓴다 (예: 로그인 세션 → `src/app/stats/page.test.tsx`). 덮어쓸 때는 그 화면이 실제로 쓰는 메서드를 모두 넣는다. 빠지면 테스트는 통과해도 unhandled rejection이 난다

### 3. 테스트 케이스를 먼저 문서로 정한다

- 작업마다 `docs/specs/<작업>/plan.md`의 Verification 섹션에 케이스를 적는다 (사전 상태 / 행동 / 기대 결과). ID는 붙이지 않고 동작 문장으로 적는다
- 케이스는 `plan.md`와 `decisions.md`의 결정 사항을 기준으로 만든다. 구현 기록을 보고 케이스를 바꾸지 않는다
- 테스트 이름은 케이스 문장과 맞춰 확인하는 동작으로 짓는다: `it("힌트를 받을 수 없을 때까지 반복 → 999부터 20까지 15회", ...)`. 케이스 ID는 테스트 이름·주석에 적지 않는다. 일부만 실행할 때는 이름으로 고른다: `npx vitest run -t "힌트"`
- 케이스를 추가·변경하면 문서를 먼저 고친 뒤 테스트를 고친다. 통과하면 `plan.md`의 Phase 진행상황을 갱신한다

### 4. TDD: 테스트 먼저, 실패 확인, 그다음 구현

1. `plan.md`의 Verification에 케이스를 적는다
2. 테스트를 작성한다
3. 실행해서 **실패하는지 확인한다**. 실패 이유가 "아직 구현되지 않은 동작" 때문이어야 한다 (오타·mock 누락으로 인한 실패가 아니어야 함). 처음부터 통과하면 케이스가 버그를 구분하지 못하는 것이므로 케이스를 다시 본다
4. 구현해서 통과시킨다
5. 이미 구현된 코드에 테스트를 나중에 붙이는 경우에는, 구현 파일을 직접 고치지 말고 격리된 복사본(git worktree 등)에서 규칙을 어기도록 바꿔 테스트가 실패하는지 확인한다 (mutation 확인)

## 파일

| 파일 | 내용 |
|---|---|
| `setup.ts` | 모든 테스트 전에 실행 (`vitest.config.ts`의 `setupFiles`). 외부 mock, jsdom에 없는 브라우저 API, 테스트마다 초기화 |
| `fakeGameServer.ts` | 가짜 게임 서버 (`gameServer`), 정답 상수 `ANSWER` |
| `fakeFeedbackWebhook.ts` | 가짜 피드백 웹훅 (`feedbackWebhook`): `bodies`, `failNext()`, `networkErrorNext()`, `holdNext()` → `release()`. 예: `src/app/feedback.test.tsx` |
| `formHarness.tsx` | 화면 레벨 도구: 게임 화면 렌더링·조작 (NewMantleForm 폴더의 화면 테스트가 같이 씀) |
| `gameHarness.ts` | 로직 레벨 도구: `renderGame`, `presets`, `amplitudeEvents`, `confettiFired`, `GAME_DATE` |
| `clock.ts` | 기기 타임존·현재 시각 고정: `setClock`, 기준 시각 상수 |

## 테스트마다 자동으로 되는 것 (`setup.ts`)

- 시작 전: `gameServer.reset()`, `feedbackWebhook.reset()`, `fetch`를 가짜 서버로 교체(웹훅 URL은 가짜 웹훅으로), `setInterval`만 가짜 타이머(축하 효과가 다음 테스트로 새지 않게), `console.error` 출력 억제
- 끝난 후: 렌더링 정리, 타이머 정리, `localStorage.clear()`, URL을 `/`로, mock 호출 기록 초기화, `vi.stubGlobal` 해제

따라서 테스트 안에서 저장소·URL·서버 상태를 직접 되돌릴 필요는 없다.

## 가짜 게임 서버 (`gameServer`)

응답 형태는 `docs/api/game-v2.md` 기준.

| 메서드 | 용도 |
|---|---|
| `setRank(word, rank)` | 추측 단어의 순위. 정하지 않은 단어는 순위 밖(-1). `ANSWER.word`는 항상 정답 |
| `setUnknown(word)` | 게임 단어 목록에 없는 단어로 정함 → 그 단어 추측은 404 (없는 단어 안내 테스트용) |
| `failNext(kind)` | 다음 `kind` 요청 1회를 500으로 실패 |
| `holdNext(kind, match?)` | 다음 요청을 붙잡아 둔다 → `release()` / `fail()`로 응답. 요청 중 잠금 테스트용 |
| `requests` | 받은 요청 목록 (`kind`, `path`, `word`, `rank`). `path`로 날짜까지 확인 가능 |
| `count(kind, filter?)` | 요청 횟수 |
| `normalHintRanks()` / `consonantHintCount()` | 일반 힌트로 요청된 순위 목록 / 초성 힌트(0위) 요청 횟수 |

`kind`: `"guess" | "hint" | "give-up" | "stats"`

```ts
const held = gameServer.holdNext("hint", (r) => r.rank === 0); // 초성 힌트만 붙잡기
// ... 요청 중 상태 확인
await held.release();
```

## 로직 레벨: `renderGame()`

화면 없이 `useGameState`를 실제 코드로 렌더링한다.

```ts
const h = renderGame();
await h.submit("사과", 120);   // 순위를 정하고 제출
await h.hint();
await h.consonant();
await h.giveUp();
await h.submitAnswer();
expect(h.game.attempts).toBe(1); // 훅 반환값
```

- `h.start(action)` + `h.settle(p)`: 응답을 기다리지 않고 요청만 시작 (`holdNext`와 함께 요청 중 상태 재현)
- `h.failureToastShown()` / `h.dismissToasts()`: 실패 안내 여부
- `h.unmount()` 후 다시 `renderGame()` = 새로고침 (`localStorage`는 유지됨)
- 사전 상태 프리셋 (`presets`): `OUT_ONLY`, `TOP(n)`, `CONSONANT_USED`, `SOLVED(k)`, `GIVEN_UP(n)` — 정의는 `gameHarness.ts`의 주석. 겹치지 않는 단어가 필요하면 `presets.nextWord()`
- 저장된 기록에서 시작해야 하면 마운트 전에 `localStorage.setItem("newmantle_game_data", ...)`
- `amplitudeEvents(name)`: 그 이벤트의 속성 목록. `confettiFired()`: 축하 효과 실행 여부

## 화면 레벨

실제 컴포넌트를 렌더링하고 user-event로 조작한다. 예: `src/components/classic/NewMantleForm/HintGiveUp.test.tsx`

- 게임 화면(NewMantleForm) 테스트는 `formHarness.tsx`의 도구를 같이 쓴다: `setup()`(렌더링 + 날짜 기다림), 버튼·입력창 찾기, `submitWord`, `submitAnswer`, `takeConsonantHint`, `giveUpViaDialog`, 방금 입력 칸·기록 표 읽기

- `userEvent.setup({ pointerEventsCheck: 0 })`: Radix 확인 창이 `body`에 `pointer-events: none`을 거는 것 때문에 필요
- 마운트 직후 게임 날짜가 정해질 때까지 기다린 뒤 조작한다 (`await waitFor(() => expect(textbox).toBeEnabled())`)
- 비동기 결과는 `waitFor` / `findBy*`로 기다린다
- 새로고침은 `unmount()` 후 다시 `render`
- 다른 화면(예: 통계)은 `QueryClientProvider`(`retry: false`)로 감싸고, `next/navigation`의 `useRouter`를 mock한다 → `src/app/stats/page.test.tsx`

## 시간과 타임존 (`clock.ts`)

```ts
setClock("America/Los_Angeles", KST_AFTERNOON); // 기기 타임존 + 현재 시각 고정
```

- 기준 시각: `KST_AFTERNOON`, `SAME_DAY`, `KST_BEFORE_MIDNIGHT`, `KST_MIDNIGHT` (UTC·KST·LA 값은 상수 주석)
- `setup.ts`가 이미 `setInterval`만 가짜로 설치해 두므로, `Date`까지 고정하려면 `vi.useRealTimers()` 후 `Date`를 포함해 다시 설치해야 한다. `setClock`이 이걸 한다. 그냥 `vi.useFakeTimers()`를 다시 부르면 `Date`가 고정되지 않는다
- 시각만 멈추고 흘려보내는 경우(경과 시간 측정)는 `src/hooks/useGameState.events.test.ts`의 `freezeClock` / `passSeconds` 참고
- `setup.ts`는 `setTimeout`을 가짜로 만들지 않는다 (user-event와 가짜 서버가 실제 `setTimeout`을 쓴다). 지연 뒤 동작하는 로직을 테스트할 때는 그 테스트에서 `setTimeout`을 포함해 가짜 타이머를 설치하고 `vi.advanceTimersByTime()`으로 넘긴다. user-event를 함께 쓰면 `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`로 만든다
- `GAME_DATE`는 모듈을 불러올 때 실제 시각으로 한 번 계산된다. `setClock`을 따라가지 않으므로, 날짜가 중요한 테스트는 기대값을 직접 적는다 (`"2026-11-10"`)
