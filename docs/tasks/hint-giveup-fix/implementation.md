# 구현 계획: 힌트 / 포기 규칙

## Context

- `docs/spec/hint-giveup.md`(이하 spec)의 **규칙** 열을 코드에 반영한다
- 검증은 `docs/tasks/hint-giveup-fix/verification.md`(이하 verification)가 맡는다. verification은 기능 기준으로만 적혀 있고 함수·상태 이름은 정하지 않으므로, 테스트 코드는 아래 이름을 기준으로 쓴다
- 기준 코드: `bugfix` 브랜치 미커밋 상태 (`useGameState.ts`에 `getTopRankedWord`, `getNextHintRank`, 상수가 이미 들어가 있음)

## 아키텍처 영향

큰 구조 변경은 없다. 바뀌는 건 세 가지.

1. **순수 규칙 모듈 분리**: `src/utils/gameRules.ts` 신설. 훅 안의 순위 계산 로직을 옮긴다 (테스트 계약)
2. **훅에 요청 중 상태 추가**: `useGameState`가 `hintPending`, `giveUpPending`을 반환. 버튼 비활성은 폼(`NewMantleForm`)이 조합
3. **`GiveUpButton`이 상태를 덜 가짐**: "첫 클릭" 상태(`firstClickDone`)와 툴팁 상태(`showTooltip`) 제거. 열림/닫힘 상태만 남음

localStorage 스키마(`GameData`)는 바뀌지 않는다. 이미 저장된 기록도 그대로 호환된다.

---

## 작업 단계

### 1. `src/utils/gameRules.ts` 신설 (A-1 ~ A-7)

```ts
export const FIRST_HINT_RANK = 999;
export const HINT_LIMIT_RANK = 20;
export const HINT_RATIO = 0.75;

// -1, 0(초성/포기 정답 행), correct 행, undefined 제외
export function getTopRank(words: SubmittedWord[]): number | null
// null → 999, 그 외 max(20, Math.round(topRank * 0.75))
export function getNextHintRank(topRank: number | null): number
// topRank !== null && topRank <= 20
export function isHintDisabled(topRank: number | null): boolean
```

- `useGameState.ts`의 `HINT_DISABLE_RANK`, `MIN_HINT_RANK`, `FIRST_HINT_RANK`, `getTopRankedWord`, `getNextHintRank` 제거 → 이 모듈 import
- `Math.round`로 spec 수열과 일치하는지 직접 계산해 봄: 999→749→562(561.75)→422(421.5)→317(316.5)→238→179(178.5)→134→101(100.5)→76→57→43→32→24→20 ✓
- `getTopRank`는 순위 숫자만 반환한다 (기존엔 단어 객체를 반환했지만 쓰는 곳은 rank뿐)

### 2. `src/hooks/useGameState.ts`

**일반 힌트 (A, D-2, D-3)**
- `hintDisabled = isHintDisabled(getTopRank(words))`
- `requestHint`: `hintRank = getNextHintRank(getTopRank(words))`
- 힌트 단어 중복 방지(`findWordIndex`/`moveWordToTop`) 제거 → 그대로 앞에 추가 (`problem.md` P-5에서 정한 것)
- 잠금: `hintPendingRef`(useRef)로 즉시 막고, UI용으로 `hintPending` state를 같이 둔다. `try/finally`로 해제
  - state만 쓰면 같은 틱 안에서 두 번 호출될 때 막지 못함 (렌더 전 클로저가 이전 값을 봄). 테스트도 `requestHint()`를 연달아 부르는 방식이라 ref가 필요

**초성 힌트 (B-2, B-5, D-2)**
- `requestInitialConsonantHint`: 앞부분에서 `initialConsonantHintUsed || giveUpPendingRef.current`면 return
- 일반 힌트 비활성(A-6), `hintPending`과는 무관하게 동작

**포기 (C-4, D-2)**
- `giveUp`: `giveUpPendingRef.current`면 return. 초성 힌트와 같은 ref/state(`giveUpPending`)를 쓴다
- 정답 행 `attempt: currentAttempts + 1` → `currentAttempts` (C-4). 그러면 `correctAttempts`도 N이 됨 → 공유 링크 `shared_attempts`, Amplitude `attempts`가 자동으로 N으로 맞춰짐
- 이미 `gameCompleted`면 return (방어용)

**Amplitude (E-1)**
- "Game Completed", "Game Given Up" 둘 다 `hintUsed`, `initialConsonantHintUsed` 속성 추가
- `hintUsed`는 지금처럼 일반 힌트만 센다 (B-4)

**반환값**: 기존 값 + `hintPending`, `giveUpPending`

**바꾸지 않는 것**: `submitWordAction`의 게임 종료 후 처리(C-5, D-1) — 이미 `solvedAttempts`를 유지하고 포기 후엔 축하 효과를 내지 않음. 테스트로 확인만 한다

### 3. `GiveUpButton` (B-2, C-2, C-3, D-4) — classic, excel 둘 다

- `firstClickDone`, 첫 클릭 시 바로 지급 로직 제거 → 클릭하면 항상 확인 창
- `showTooltip`과 "힌트를 먼저 사용해보세요!"("Use hint first!") 툴팁 제거. 툴팁은 "포기"만 남김
- 버튼에 `aria-label="포기"`
- 확인 창
  - 미사용: [초성 힌트 받고 계속 도전하기] (기본 선택) / [정말로 포기할래요]
  - 사용 후: [계속 도전하기] (기본 선택, 창만 닫음) / [포기하기]
  - 버튼 순서: 계속 플레이 → 포기
  - 색: 두 버튼 모두 채움. 계속 = 파랑(`bg-blue-600`, 대표색 #2563eb), 포기 = 빨강(shadcn `destructive`, C-2 위험 동작 스타일)
  - 안내 문구: "포기하면 정답이 공개되고, 이후 입력하는 단어는 오늘 기록에 반영되지 않아요"
  - 기본 포커스: `DialogContent`의 `onOpenAutoFocus`에서 계속 플레이 버튼 ref로 포커스 (DOM 순서나 모바일 `flex-col-reverse`에 의존하지 않기 위해)
  - X / 바깥 클릭 / ESC: 기존 `onOpenChange`로 닫힘만 함 → 그대로 둠
- excel: 기존 "취소" 버튼은 사용 후 상태의 "계속 도전하기"와 역할이 겹치므로 위 구성으로 통일. 색은 계속 = excel 초록(#217346) 채움, 포기 = 빨강 채움

### 4. `HintButton` — classic, excel 둘 다

- `aria-label="힌트"` 추가. 로직 변경 없음

### 5. `NewMantleForm/index.tsx` — classic, excel 둘 다 (D-2)

```tsx
<HintButton disabled={hintDisabled || gameCompleted || givenUp || hintPending} />
<GiveUpButton disabled={gameCompleted || givenUp || giveUpPending} />
```

- `CompetitiveBar`의 `currentAttempts={solvedAttempts ?? correctAttempts}`는 C-4 변경 후 두 값이 같아지므로 그대로 둔다

### 6. 정리

- `src/components/GiveUpButton.tsx`, `src/components/HintButton.tsx`(루트)는 어디서도 import하지 않음 → 삭제 (아래 결정 사항 3)
- `CLAUDE.md` 프로젝트 구조에서 루트 버튼 항목을 `classic/`, `excel/`로 교체

---

## 결정이 필요한 것

spec에 직접 적혀 있지 않지만 구현하면서 정해야 하는 것들. 괄호 안이 이 계획의 기본값이다.

1. **C-5 / D-1 "서버 통계에 반영되지 않음"은 백엔드가 보장하는지** (백엔드 확인)
   - 프론트는 게임이 끝난 뒤에도 똑같이 `guess` API를 호출한다. API 문서에는 "추측 기록은 통계에 반영됩니다"만 있고, 정답·포기 후 추측을 빼는지는 적혀 있지 않음
   - 백엔드가 빼주지 않는다면 프론트가 할 수 있는 건 종료 후 API 호출을 하지 않는 것뿐인데, 그러면 유사도·순위를 보여줄 수 없음 → 백엔드 확인이 필요
2. **excel 테마도 같이 바꿀지** (같이 바꿈)
   - verification은 테스트를 classic으로만 하지만, 규칙은 테마와 상관없이 같아야 함. excel 쪽은 문구 일부가 영어 툴팁
3. **쓰지 않는 루트 `GiveUpButton.tsx` / `HintButton.tsx` 삭제** (삭제)
4. **포기 후 정답 단어 입력** (현재대로 "이미 제출한 단어입니다") — verification 5-1에 남아 있는 항목. spec에서 정하면 반영
5. **D-3 타임아웃 후 상태 불일치** (그대로 둠) — 서버는 포기를 기록했는데 화면은 진행 중일 수 있음. spec에서 "참고"로만 다뤘으므로 이번 범위에서 따로 처리하지 않음

## 작업 순서

1. `gameRules.ts` + 훅 연결 (A)
2. 훅 잠금·포기 attempt·Amplitude (C-4, D-2, E-1)
3. `GiveUpButton` / `HintButton` (classic → excel)
4. `NewMantleForm` 연결 (classic → excel)
5. 루트 컴포넌트 삭제, `CLAUDE.md` 정리

## 검증

- `npm run lint`, `npm run build`
- 테스트는 verification 계획대로 (테스트 환경 설치 포함). 이 문서 범위에서는 테스트 계약만 맞춘다
- 수동 확인 (`npm run dev`, classic/excel 각각)
  - 단어 없이 힌트 연타 → 999위 1개만 추가, 버튼이 잠겼다가 풀림
  - 힌트를 반복해 20위 도달 → 힌트 버튼 비활성, 포기 버튼은 활성
  - 포기 버튼 → 확인 창 (바로 지급 없음) → 초성 힌트 받기 → 다시 포기 버튼 → "계속 도전하기"/"포기하기"
  - 단어 3개 입력 후 포기 → 결과 "3번 시도", 정답 행 시도 3, 공유 링크 `shared_attempts=3`
  - 새로고침 후 초성 힌트 사용 여부 유지

## 결과 기록

| 날짜 | 단계 | 내용 |
|---|---|---|
| 2026-11-06 | 1~5 | 계획대로 구현. `npm run lint`, `npm run build` 통과. 힌트 수열은 node로 계산해 spec과 일치 확인 (15회). 자동 테스트·수동 확인은 아직 |
| 2026-11-06 | 2 | `giveUp`은 이미 게임이 끝났으면(`gameCompleted` / `givenUp`) 요청하지 않음. `requestInitialConsonantHint`는 사용 여부를 훅에서도 확인 (B-5) |
| 2026-11-06 | 3 | 처음엔 classic 계속 버튼을 `default`(검정), excel 포기 버튼을 빨간 테두리로 구현 → 포기 쪽이 더 눈에 띄고 채움/테두리가 섞여 어색해서 3번 "색" 기준으로 변경. excel의 "취소" 버튼 제거, 제목·설명을 `DialogTitle` / `DialogDescription`으로 바꿈 (접근성 경고 해소) |
