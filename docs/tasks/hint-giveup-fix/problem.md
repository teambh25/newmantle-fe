# 문제: 힌트 / 포기 로직 버그

`docs/tasks/bug.md`에서 힌트 / 포기 관련 항목만 옮겨 옴 (괄호는 bug.md의 원래 번호)

상태 표기: ✅ 수정됨(미커밋) / 🔧 수정 예정 / ❓ 설계 검토 중 / ⏸ 미착수

- 정책: `docs/spec/hint-giveup.md` (이하 spec). 정책을 확정한 뒤 그에 맞춰 구현함
- 구현: `implementation.md`
- 검증: `verification.md`

대상: `src/hooks/useGameState.ts`, `src/utils/gameRules.ts`

## 사용자가 찾은 버그

### P-1. 21~100위 구간에서 hintRank가 음수/0이 됨 (#1) — ✅ (spec A-5)
- 문제: 항상 `rank - 100`으로 계산 → rank 50이면 -50, rank 100이면 0(초성 힌트 API 호출)
- 1차 수정: rank > 100이면 -100, 이하면 -20, 최솟값 20 보장 → P-6 문제 발생
- 최종 수정: 비율 방식 `max(20, round(최고 순위 × 0.75))`, 순위권 단어가 없으면 999위 (`gameRules.ts`의 `getNextHintRank`)

### P-2. 힌트 비활성 기준이 15위 (#2) — ✅ (spec A-6)
- 문제: `hintDisabled`, `requestHint` 두 곳 모두 `<= 15`
- 수정: 기준을 20위로 변경, 상수(`HINT_LIMIT_RANK`)로 관리. 힌트 한계 순위와 비활성 기준을 하나의 값으로 통일 (`isHintDisabled`)

### P-3. 초성 힌트(rank 0) 사용 후 일반 힌트 버튼이 막힘 (#3) — ✅ (spec 용어 정의, B-3)
- 문제: 최고 순위 계산에서 rank 0을 제외하지 않아 초성 힌트 단어가 1위로 잡힘 → `hintDisabled` 고정
- 수정: 최고 순위 계산 시 순위 밖(-1), 초성 힌트(0), 정답 행 제외

### P-4. topRankedWord reduce 중복 (#4) — ✅
- 문제: `hintDisabled`와 `requestHint`에 동일한 reduce가 두 번 있음
- 수정: `gameRules.ts`의 `getTopRank`로 추출해 두 곳에서 공유

### P-5. requestHint 안의 중복 조건 확인 (#6) — ✅ (spec A-7)
- 문제: `hintDisabled`로 이미 막는 `rank <= 15 → return` 분기가 requestHint 안에 한 번 더 있음
- 수정: 해당 분기 제거 (이전 버전과 동일)
- Claude가 잘못 추가했던 힌트 단어 중복 방지 로직도 제거함. 힌트는 항상 현재 최고 순위보다 높은 순위를 요청하므로 이미 목록에 있는 단어가 올 수 없음 (`findWordIndex`/`moveWordToTop`은 submitWordAction에서만 사용)

## 설계 검토 항목

### P-6. 101~120위에서 다음 힌트가 바로 20위로 감 (2-1) — ✅ (spec A-5)
- 문제: 100위를 기준으로 빼는 값이 100 → 20으로 바뀌어서, 순위가 낮은데 필요한 힌트 수가 더 적어짐
  - 20위까지 필요한 힌트 수: 150위 3번 / 101위 **1번** / 100위 4번
- 결정: 비례 방식, 계수 **0.75**. 999위에서 20위까지 총 15회
  - 999→749→562→422→317→238→179→134→101→76→57→43→32→24→20

## Claude가 추가로 찾은 문제

### P-7. 포기 시 시도 횟수 불일치 (#9) — ✅ (spec C-4)
- 문제: 정답 단어의 attempt는 `attempts + 1`, `solvedAttempts`는 `attempts` → `correctAttempts`와 1 차이
- 수정: 입력 횟수 그대로(N)로 통일. 포기 시 추가되는 정답 행 attempt도 N

### P-8. 초성 힌트 중복 호출 방어 없음 (#10) — ✅ (spec B-5, D-2)
- 문제: 훅에서 `initialConsonantHintUsed`를 확인하지 않아 두 번 호출하면 두 번 추가됨
- 수정: 이미 사용했으면 바로 return. 요청 중에는 포기와 공유하는 잠금으로 연속 클릭 방어
