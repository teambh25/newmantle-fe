# useGameState 버그 정리

대상: `src/hooks/useGameState.ts`

상태 표기: ✅ 수정됨(미커밋) / 🔧 수정 예정 / ❓ 설계 검토 중 / ⏸ 미착수

힌트 / 포기 관련 항목(#1~#4, #6, 2-1, #9, #10)은 `docs/tasks/hint-giveup-fix/problem.md`로 옮김.

날짜 관련 항목(#5, 2-2, #12, #13)은 `docs/tasks/kst-date-fix/problem.md`로 옮김.

## Claude가 추가로 찾은 문제

### 7. localStorage 파싱 실패 시 게임이 뜨지 않음 — 🔧
- 문제: `JSON.parse`에 예외 처리가 없어 데이터가 손상되면 초기화 단계에서 크래시. 구버전 데이터는 새 필드가 `undefined`
- 수정: try/catch로 감싸 실패 시 기본값 사용, 기본값과 병합해서 누락 필드 보완

### 8. "Game Started" 이벤트 중복 기록 — 🔧
- 문제: gameDate가 처음엔 `""`였다가 실제 날짜로 바뀌어 이벤트가 두 번 기록됨
- 수정: gameDate가 비어 있으면 로깅하지 않음

### 11. timeSpent가 새로고침 시 초기화됨 — 🔧
- 문제: 플레이 시간을 훅 마운트 시점부터 측정 (`startTimeRef = useRef(Date.now())`) → 중간에 새로고침하면 0부터 다시 시작
- 수정: 첫 제출 시각을 게임 상태에 저장하고 그 시각을 기준으로 계산
