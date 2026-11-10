# 구현 계획: KST 날짜 처리

## Context

- 문제와 결정: `docs/tasks/kst-date-fix/problem.md` (P-1 ~ P-4)
- 검증: `docs/tasks/kst-date-fix/verification.md`
- 원칙: "오늘"은 항상 KST 달력 날짜로 만든다. 기기 로컬 날짜는 쓰지 않는다

## `src/utils/date.ts`

| 함수 | 역할 | 사용처 |
|---|---|---|
| `getKSTDateString(date?)` | KST 오늘 `YYYY-MM-DD` | `useGameDate`, `useGameState` (P-1) |
| `toLegacyDateString(dateString)` | `"2026-11-10"` → `"Tue Nov 10 2026"` (이전 `lastPlayedDate` 형식) | `useGameState` 이어받기 조건 (P-2) |
| `getKSTToday(date?)` | KST 오늘을 기기 로컬 자정의 Date로 반환. date-fns 로컬 계산·포맷에 넘겨도 KST 달력 날짜 그대로 | 통계 화면 (P-3) |
| ~~`formatDate`~~ | 제거 (P-4) | |

`toLegacyDateString`, `getKSTToday`는 Z 없는 날짜·시각 문자열(`"2026-11-10T00:00:00"`)이 로컬 자정으로 해석되는 점을 이용한다. 기기 타임존과 무관하게 같은 달력 날짜가 나온다.

## P-1. 퀴즈 날짜 (구현 완료, 커밋됨)

- `useGameDate`: `getKSTDateString()`으로 gameDate 생성
- `api.ts`의 `getHint`/`getRecentAnswer`: gameDate 문자열을 Date로 변환하지 않고 그대로 사용
- `useGameState`: `lastPlayedDate`를 KST `YYYY-MM-DD`로 저장·비교

## P-2. 이전 형식 이어받기 조건

`src/hooks/useGameState.ts`의 `getInitialGameState`

```ts
// 변경 전: 기기 로컬 오늘과 비교
if (parsedData.lastPlayedDate === new Date().toDateString()) {

// 변경 후: KST 오늘을 이전 형식으로 바꿔 비교
if (parsedData.lastPlayedDate === toLegacyDateString(today)) {
```

이전 버전은 `gameDate`와 `lastPlayedDate`를 둘 다 기기 로컬 날짜로 만들었으므로, 이전 `lastPlayedDate`의 날짜 = 그 기록의 퀴즈 날짜. 저장값만 보고 "KST 오늘 퀴즈의 기록인지" 판단할 수 있어 사용자의 위치·타임존을 알 필요가 없다.

| 사용자 | 저장값 | KST 오늘(이전 형식) | 결과 |
|---|---|---|---|
| 한국 | `Tue Nov 10 2026` | `Tue Nov 10 2026` | 이어받음 |
| LA, 로컬 11/9 21:00 (KST 11/10) | `Mon Nov 09 2026` | `Tue Nov 10 2026` | 초기화 (11/9 퀴즈 기록) |
| LA, 로컬·KST 모두 11/10일 때 플레이 | `Tue Nov 10 2026` | `Tue Nov 10 2026` | 이어받음 |

## P-3. 통계 화면의 "오늘"

- `src/app/stats/page.tsx`: 조회 범위 `endDate`/`startDate`를 `getKSTToday()` 기준으로 계산
- `src/components/stats/StatsCalendar.tsx`: 달력의 `today`를 `getKSTToday()`로 교체

## 테스트 도구

- `src/test/clock.ts`의 `setClock(timeZone, isoTime)`: 기기 타임존(`process.env.TZ`)과 현재 시각 고정
- `setup.ts`가 테스트마다 interval만 가짜로 설치해 두므로, 해제 후 `Date`까지 포함해 다시 설치한다 (그대로 `useFakeTimers`를 다시 부르면 `Date`가 고정되지 않음)

## 범위 밖

- 저장 스키마 변경 없음 (`GameData` 그대로)
- 이어받기 로직 제거 시점은 정하지 않음 (배포 후 하루가 지나면 더 이상 일치하는 데이터가 없어 무해)
- 알림(`useNotifications`), 설문 timestamp 등은 시각 비교·기록용이라 KST 달력 날짜와 무관
