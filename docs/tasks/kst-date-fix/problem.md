# 문제: 기기 로컬 날짜 사용으로 인한 날짜 어긋남

`docs/tasks/bug.md`에서 날짜 관련 항목만 옮겨 옴 (괄호는 bug.md의 원래 번호)

상태 표기: ✅ 수정됨(미커밋) / 🔧 수정 예정 / ❓ 설계 검토 중 / ⏸ 미착수

- 구현: `implementation.md`
- 검증: `verification.md`

## 배경

퀴즈 날짜는 KST 기준이다 (API `{date}`는 KST `YYYY-MM-DD`, 오늘·어제만 접근 가능). 그런데 이전 버전(main)은 "오늘"을 기기 로컬 날짜로 만들어서, 기기 로컬 날짜 ≠ KST 날짜인 사용자(해외, 또는 기기 타임존이 KST가 아닌 사용자)는 여러 곳에서 날짜가 어긋났다.

예시 시각: UTC 2026-11-10 05:00 = KST 11/10 14:00 = LA 11/9 21:00

## P-1. 해외 접속 시 다른 날짜의 퀴즈가 로드됨 (#5) — ✅
- 문제:
  - `useGameDate`가 KST가 아닌 기기 로컬 날짜를 사용
  - 힌트/포기에서 `new Date(gameDate)`(UTC 자정) → 로컬 getter로 포맷하면서 UTC- 지역은 하루 더 밀림
  - 저장 데이터 리셋 기준(`lastPlayedDate`)도 로컬 `toDateString()`
- 수정: `getKSTDateString` 추가 후 gameDate를 KST 기준으로 생성, `getHint`/`getRecentAnswer`는 문자열을 그대로 받도록 변경, `lastPlayedDate`도 KST `YYYY-MM-DD`로 저장

## P-2. `lastPlayedDate` 형식 변경으로 다른 날짜 퀴즈의 기록을 이어받음 (2-2) — ✅
- 변경: `"Wed Nov 04 2026"`(로컬 `toDateString()`) → `"2026-11-04"`(KST). P-1 수정의 부작용
- 영향 범위: `lastPlayedDate`와 저장 키 `newmantle_game_data`는 `useGameState.ts` 안에서만 사용. API 호출은 별도 값인 `gameDate`를 쓰므로 영향 없음
- 이전 버전(main) 동작: `gameDate`(`formatDate(new Date())`)와 `lastPlayedDate`(`toDateString()`) 모두 **기기 로컬 날짜**로 생성
  → 이전 `lastPlayedDate`가 가리키는 날짜 = 그 기록의 퀴즈 날짜
- 문제:
  - 배포 당일 진행 중인 기록을 지키려고 이전 형식을 한 번 이어받는 로직을 넣었는데, 조건이 `저장값 === 기기 로컬 오늘(toDateString())`이었음
  - 기기 로컬 날짜 ≠ KST 날짜인 사용자는 **다른 날짜 퀴즈의 기록을 이어받음**
    - 예: LA 로컬 11/9 21:00, 저장값 `"Mon Nov 09 2026"` → 로컬 오늘과 일치 → 11/9 퀴즈 기록(단어·순위·완료 여부)이 11/10 퀴즈에 표시됨
  - 처음에 적었던 "해외 사용자는 기록이 초기화될 수 있음"은 틀린 분석이었음
  - 한국 사용자는 로컬 날짜 = KST 날짜라 문제 없음
- 결정: 저장 기준은 **KST 오늘 날짜(`YYYY-MM-DD`) 유지**, 이어받기 로직 유지하되 조건 수정
  - 이어받기 조건: `저장값 === KST 오늘을 toDateString() 모양으로 바꾼 값` (사용자 위치·타임존 구분 불필요)
  - 저장된 날짜가 KST 오늘이 아니면 다른 날짜 퀴즈의 기록이므로 초기화 (데이터 손실 아님)
- 남은 위험: 롤백 시 이전 코드가 새 형식을 인식하지 못해 그날 기록이 초기화됨 (허용)

## P-3. 통계 화면이 기기 로컬 날짜를 사용 (#12) — ✅
- 문제: P-1과 같은 원인. 기기 로컬 날짜가 KST보다 늦은 사용자는
  - `src/app/stats/page.tsx`: 조회 범위(`endDate`/`startDate`)가 하루 앞당겨져 KST 오늘 기록이 조회되지 않음
  - `src/components/stats/StatsCalendar.tsx`: 달력이 로컬 오늘까지만 그려져 KST 오늘 칸이 없음
- 수정: `getKSTToday`(KST 오늘을 로컬 자정 Date로 반환) 추가 후 두 곳의 "오늘"을 교체. date-fns 계산·포맷은 그대로 사용

## P-4. 사용하지 않는 `formatDate` (#13) — ✅
- `src/utils/date.ts`의 `formatDate`(기기 로컬 날짜 포맷)는 P-1 수정 이후 사용처 없음 → 제거
