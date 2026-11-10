# useGameState 버그 정리

대상: `src/hooks/useGameState.ts` (+ 관련 `useGameDate.ts`, `utils/api.ts`, `utils/date.ts`)

상태 표기: ✅ 수정됨(미커밋) / 🔧 수정 예정 / ❓ 설계 검토 중 / ⏸ 미착수

## 사용자가 찾은 버그

### 1. 21~100위 구간에서 hintRank가 음수/0이 됨 — ✅ (❓ 2-1 참고)
- 문제: 항상 `rank - 100`으로 계산 → rank 50이면 -50, rank 100이면 0(초성 힌트 API 호출)
- 수정: rank > 100이면 -100, 이하면 -20, 최솟값 20 보장 (`getNextHintRank`)

### 2. 힌트 비활성 기준이 15위 — ✅
- 문제: `hintDisabled`, `requestHint` 두 곳 모두 `<= 15`
- 수정: 기준을 20위로 변경, 상수(`HINT_DISABLE_RANK`)로 관리

### 3. 초성 힌트(rank 0) 사용 후 일반 힌트 버튼이 막힘 — ✅
- 문제: 최고 순위 계산에서 rank 0을 제외하지 않아 초성 힌트 단어가 1위로 잡힘 → `hintDisabled` 고정
- 수정: 최고 순위 계산 시 rank 0도 제외

### 4. topRankedWord reduce 중복 — ✅
- 문제: `hintDisabled`와 `requestHint`에 동일한 reduce가 두 번 있음
- 수정: `getTopRankedWord` 함수로 추출, 도달 불가능한 `rank === -1` 분기 정리

### 5. 해외 접속 시 로컬 타임존 기준으로 다른 날짜의 퀴즈가 로드됨 — ✅ (❓ 2-2 참고)
- 문제:
  - `useGameDate`가 KST가 아닌 기기 로컬 날짜를 사용
  - 힌트/포기에서 `new Date(gameDate)`(UTC 자정) → 로컬 getter로 포맷하면서 UTC- 지역은 하루 더 밀림
  - 저장 데이터 리셋 기준(`lastPlayedDate`)도 로컬 `toDateString()`
- 수정: `getKSTDateString` 추가 후 gameDate를 KST 기준으로 생성, `getHint`/`getRecentAnswer`는 문자열을 그대로 받도록 변경, `lastPlayedDate`도 KST `YYYY-MM-DD`로 저장
- 참고: 이전에 고쳤던 버전의 `useGameState.ts`에는 이 수정이 없었음 → 당시 수정은 `useGameDate.ts`/`date.ts` 쪽에 있었을 가능성. 이전 버전 파일이 있으면 비교 필요

### 6. requestHint 안의 중복 조건 확인 — ✅ / 🔧
- 문제: `hintDisabled`로 이미 막는 `rank <= 15 → return` 분기가 requestHint 안에 한 번 더 있음
- 수정: 해당 분기 제거 (이전 버전과 동일)
- 🔧 Claude가 "같은 단어 중복 방지"로 오해해서 힌트 단어 중복 방지 로직을 추가했음 → **제거하기로 결정**
  - 이유: 힌트는 항상 현재 최고 순위보다 높은 순위를 요청하므로, 서버 순위가 일관되면 이미 목록에 있는 단어가 올 수 없음 (실효성 없음)
  - 할 일: requestHint를 이전 버전처럼 힌트 단어를 그대로 추가하도록 되돌림 (`findWordIndex`/`moveWordToTop`은 submitWordAction에서만 사용)

## 설계 검토 중인 항목

### 2-1. 101~120위에서 다음 힌트가 바로 20위로 감 — ❓
- 문제: 100위를 기준으로 빼는 값이 100 → 20으로 바뀌어서, 순위가 낮은데 필요한 힌트 수가 더 적어짐
  - 20위까지 필요한 힌트 수: 150위 3번 / 101위 **1번** / 100위 4번
- 후보:
  - A. 100위에서 멈춤: 100위 초과일 때 결과가 최소 100위가 되게 함. 101~199위에서는 항상 100위에서 한 번 멈춤
  - B. 비례 방식: `max(20, round(rank × 계수))`. 경계가 없어 끊김이 없고 순위가 낮을수록 힌트 수가 항상 같거나 많아짐
    - 계수 0.7이면 900위 시작 기준 힌트 수 11번 (현재 12번)으로 비슷
    - 단, 일부 구간은 힌트가 더 필요해짐 (예: 150위 3번 → 6번) → 게임 밸런스 결정 필요
- 확인할 것: 방식 선택, B라면 계수(0.6~0.7)

### 2-2. `lastPlayedDate` 형식 변경의 영향 — ❓
- 변경: `"Wed Nov 04 2026"`(로컬 `toDateString()`) → `"2026-11-04"`(KST)
- 영향 범위 확인 결과: `lastPlayedDate`와 저장 키 `newmantle_game_data`는 `useGameState.ts` 안에서만 사용. API 호출은 별도 값인 `gameDate`를 쓰므로 영향 없음
- 남은 위험:
  - 롤백 시 이전 코드가 새 형식을 인식하지 못해 그날 기록이 초기화됨
  - 배포 당일 기기 로컬 날짜와 KST 날짜가 다른 해외 사용자는 기록이 초기화될 수 있음 (한국 사용자는 이어받기 로직으로 유지)
- 후보:
  - 현재처럼 KST 오늘 날짜로 저장
  - `gameDate`를 그대로 저장해 "어느 퀴즈 날짜의 기록인지"로 기준 통일 (첫 렌더 시 gameDate가 `""`인 점 처리 필요)
  - KST 날짜를 `toDateString()` 모양으로 저장해 이전 형식 호환 유지
- 확인할 것: 기준 선택, 이어받기(마이그레이션) 로직 유지 여부

## Claude가 추가로 찾은 문제 — ⏸

### 7. localStorage 파싱 실패 시 게임이 뜨지 않음
- 문제: `JSON.parse`에 예외 처리가 없어 데이터가 손상되면 초기화 단계에서 크래시. 구버전 데이터는 새 필드가 `undefined`
- 수정: try/catch로 감싸 실패 시 기본값 사용, 기본값과 병합해서 누락 필드 보완

### 8. "Game Started" 이벤트 중복 기록
- 문제: gameDate가 처음엔 `""`였다가 실제 날짜로 바뀌어 이벤트가 두 번 기록됨
- 수정: gameDate가 비어 있으면 로깅하지 않음

### 9. 포기 시 시도 횟수 불일치
- 문제: 정답 단어의 attempt는 `attempts + 1`, `solvedAttempts`는 `attempts` → `correctAttempts`와 1 차이
- 수정: 포기 시 기준을 하나로 정해 두 값을 맞춤

### 10. 초성 힌트 중복 호출 방어 없음
- 문제: 훅에서 `initialConsonantHintUsed`를 확인하지 않아 두 번 호출하면 두 번 추가됨 (현재는 UI에서만 막는 것으로 추정)
- 수정: 이미 사용했으면 바로 return

### 11. timeSpent가 새로고침 시 초기화됨
- 문제: 플레이 시간을 훅 마운트 시점부터 측정 → 중간에 새로고침하면 0부터 다시 시작
- 수정: 첫 제출 시각을 게임 상태에 저장하고 그 시각을 기준으로 계산
