# useGameState 버그 정리

대상: `src/hooks/useGameState.ts`

상태 표기: ✅ 수정됨(미커밋) / 🔧 수정 예정 / ❓ 설계 검토 중 / ⏸ 미착수

힌트 / 포기 관련 항목(#1~#4, #6, 2-1, #9, #10)은 `docs/tasks/hint-giveup-fix/problem.md`로 옮김.

날짜 관련 항목(#5, 2-2, #12, #13)은 `docs/tasks/kst-date-fix/problem.md`로 옮김.

## Claude가 추가로 찾은 문제

진행 순서: #7 → #8 → #11 (항목별 커밋). #11은 #7의 기본값 병합으로 구데이터에 새 필드가 채워지는 것을 전제로 한다.

테스트 위치: #7은 `src/hooks/useGameState.storage.test.ts`, #8·#11은 `src/hooks/useGameState.events.test.ts` (`src/test/gameHarness.ts`의 `renderGame`, `amplitudeEvents` 사용). 저장소를 미리 채워야 하는 경우는 `useGameState.lastPlayedDate.test.ts`처럼 마운트 전에 `localStorage`에 값을 넣는다.

### 7. localStorage 파싱 실패 시 게임이 뜨지 않음 — ✅
- 문제
  - `JSON.parse`에 예외 처리가 없다. `useState` 초기화 함수(렌더링 중)에서 실행되므로 예외가 나면 화면이 뜨지 않는다
  - 날짜 비교보다 먼저 실행되어 다음 날에도 계속 실패한다. 사이트 데이터를 지우기 전까지 복구되지 않음
  - 구버전 데이터는 새 필드가 `undefined` → 예: `hintUsed + 1`이 `NaN`
- 위급도: 낮음. 발생 경로가 사실상 없다
  - 이 키는 2024-07부터 `JSON.stringify`로만 저장했고, 브라우저는 값을 트랜잭션 단위로 저장하므로 위조·직접 수정이 아니면 깨진 JSON이 생기지 않는다
  - 현재 필드는 이 훅이 생길 때부터 있었으므로 필드가 빠진 기록도 지금까지는 생길 수 없었다
  - 저장소 차단 환경(사이트 데이터 저장 안 함 등)은 `useUITheme`, `api.ts`도 localStorage를 예외 처리 없이 쓰므로 여기만 고쳐서는 해결되지 않는다. 범위 밖
  - 그래도 수정하는 이유: 만에 하나 발생하면 복구되지 않는 크래시를 막는 방어 코드이고 비용이 작다. 기본값 병합은 #11에서 필드(`firstActionAt`)를 추가할 때 필요하다
  - 실패는 기록하지 않는다(Sentry 보고 없음). 발생 가능성이 거의 없어서
- 수정 (`getInitialGameState`)
  - `getItem` + `JSON.parse`를 try/catch로 감싸고, 실패하면 빈 상태로 시작한다. 저장소가 막힌 환경(Safari 비공개 모드 등)에서는 `getItem`도 예외를 던진다
  - 최소 검증: 파싱 결과가 객체가 아니거나 `submittedWords`가 배열이 아니면 빈 상태로 시작한다
  - 기본값 병합: `{ ...createEmptyGameState(), ...parsed }`. 오늘 날짜 그대로 쓰는 경우와 이전 형식 이어받기 경우 **둘 다** 적용한다
  - 저장 effect의 `setItem`도 try/catch로 감싼다(용량 초과, 저장소 차단). 실패해도 게임은 계속 진행된다
- 테스트
  - S-1: 깨진 JSON(`"{abc"`) 저장 → 마운트 시 예외 없이 빈 게임
  - S-2: `"null"` 저장 → 빈 게임 (숫자·문자열·배열은 `lastPlayedDate`가 없어 수정 전에도 빈 게임이 되므로 제외)
  - S-3: `submittedWords`가 배열이 아닌 객체(오늘 날짜) → 빈 게임
  - S-4: 오늘 날짜이고 `hintUsed`, `givenUp`, `initialConsonantHintUsed` 등이 빠진 구버전 객체 → 기존 단어·시도 횟수는 유지되고, 힌트 1회 후 `hintUsed === 1`
  - S-5: 이전 형식 날짜(이어받기 대상)이고 필드가 빠진 객체 → S-4와 같은 결과
  - S-6: `localStorage.getItem`이 예외를 던지게 mock → 빈 게임으로 마운트
  - S-7: `localStorage.setItem`이 예외를 던지게 mock → 단어 제출이 정상 동작

### 8. "Game Started" 이벤트 중복 기록 — ✅
- 문제: `useGameDate`가 `""`로 시작했다가 effect에서 KST 날짜를 넣으므로, `[gameDate, theme]` effect가 두 번 실행되어 이벤트가 두 번 기록된다
- 영향: Amplitude 기록만. 게임 동작에는 영향 없음
- 수정: effect 첫 줄에서 `gameDate`가 비어 있으면 return
- 그대로 두는 것: classic/excel 테마 전환 시 폼이 다시 마운트되어 다시 기록되는 것은 정상 동작으로 본다. dev StrictMode 이중 실행은 운영과 무관
- 테스트
  - G-1: `gameDate=""`로 렌더 → `rerender`로 날짜 설정 → `Game Started` 1회, `date`는 그 날짜
  - G-2: `gameDate=""`로만 렌더 → `Game Started` 0회

### 11. timeSpent가 새로고침 시 초기화됨 — ✅
- 문제: `timeSpent`는 훅 마운트 시점(`startTimeRef`)부터 측정한다 → 중간에 새로고침하면 0부터 다시 시작해, 실제로 푸는 데 걸린 시간을 알 수 없다
- 영향: Amplitude 기록만
- 결정
  - 지표 2개를 둘 다 기록한다
    - `timeSpent` (기존, 변경 없음): 이번 페이지 로드부터 정답까지, 초. 연속 플레이 시간
    - `timeSinceFirstAction` (신규): 그날 첫 행동부터 정답까지, 초. 새로고침·이탈 시간을 모두 포함한 실제 경과 시간
  - 첫 행동 = 단어 제출, 일반 힌트, 초성 힌트 중 **성공해서 상태에 반영된 것**. 없는 단어·요청 실패·이미 제출한 단어 재제출은 포함하지 않는다
  - 배포 당일 진행 중이던 게임은 `firstActionAt`이 없으므로, 배포 이후 첫 행동 시각부터 잰다(실제보다 짧게 기록됨). 감수한다
- 수정
  - `GameData`에 `firstActionAt: number | null` 추가(ms epoch), `createEmptyGameState`의 기본값은 `null`. 구데이터는 #7의 병합으로 `null`이 채워진다
  - 제출 성공 / 일반 힌트 성공 / 초성 힌트 성공의 `setGameState`에서 `firstActionAt: prev.firstActionAt ?? Date.now()`
  - `Game Completed`: `now`를 한 번 구해 `timeSinceFirstAction: (now - (gameState.firstActionAt ?? now)) / 1000`. 첫 행동이 곧 정답이면 0
  - `startTimeRef`와 `timeSpent`는 그대로 둔다
- 테스트 (fake timer로 시각 제어)
  - T-1: 단어 제출 → 60초 경과 → 다시 마운트 → 30초 경과 → 정답 → `timeSinceFirstAction === 90`, `timeSpent === 30`
  - T-2: 일반 힌트로 시작 → 10초 → 정답 → `timeSinceFirstAction === 10`
  - T-3: 초성 힌트로 시작 → 10초 → 정답 → `timeSinceFirstAction === 10`
  - T-4: 첫 행동이 정답 → `timeSinceFirstAction === 0`
  - T-5: 단어 제출 실패(서버 오류. 가짜 서버에 "없는 단어" 응답이 없어 대신 씀. 훅에서는 같은 catch 경로) → 20초 → 단어 제출 성공 → 10초 → 정답 → `timeSinceFirstAction === 10` (실패는 첫 행동이 아님)
  - T-6: 힌트 요청 실패 → 20초 → 단어 제출 → 10초 → 정답 → `timeSinceFirstAction === 10`
  - T-7: 첫 제출 후 두 번째 행동에서 `firstActionAt`이 바뀌지 않음 (저장된 값 확인)
  - T-8: 오늘 날짜이고 `firstActionAt`이 없는 구데이터로 마운트 → 제출 → 10초 → 정답 → `timeSinceFirstAction === 10` (배포 당일 동작)
