# 검증: KST 날짜 처리

## 원칙

- 기준: `docs/tasks/kst-date-fix/problem.md`의 결정 사항
- 레벨: 로직 (vitest, 게임 상태 훅·날짜 유틸) + 화면 (통계 달력)
- 테스트 이름 앞에 케이스 ID를 붙인다 (예: `L-1: ...`)
- 기기 타임존(`TZ`)과 현재 시각을 고정해 실행 환경과 무관하게 같은 결과가 나오게 한다

## 기준 시각

| 이름 | UTC | KST | LA (기기 로컬) |
|---|---|---|---|
| `KST_AFTERNOON` | 2026-11-10 05:00 | 11/10 14:00 | 11/9 21:00 |
| `SAME_DAY` | 2026-11-10 10:00 | 11/10 19:00 | 11/10 02:00 |

## 저장된 기록의 날짜 판단 (P-2)

"이어받음" = 저장된 단어·시도 횟수가 유지되고 `lastPlayedDate`가 KST `YYYY-MM-DD`로 바뀌어 다시 저장됨
"초기화" = 빈 게임 상태로 시작

| ID | 기기 타임존 | 시각 | 저장된 `lastPlayedDate` | 결과 |
|---|---|---|---|---|
| L-1 | Asia/Seoul | `KST_AFTERNOON` | `2026-11-10` (새 형식, 오늘) | 그대로 유지 |
| L-2 | Asia/Seoul | `KST_AFTERNOON` | `2026-11-09` (새 형식, 어제) | 초기화 |
| L-3 | Asia/Seoul | `KST_AFTERNOON` | `Tue Nov 10 2026` (이전 형식, 오늘) | 이어받음 |
| L-4 | Asia/Seoul | `KST_AFTERNOON` | `Mon Nov 09 2026` (이전 형식, 어제) | 초기화 |
| L-5 | America/Los_Angeles | `KST_AFTERNOON` | `Mon Nov 09 2026` (이전 형식, 로컬 오늘 = KST 어제) | **초기화** (수정 전 코드는 이어받음) |
| L-6 | America/Los_Angeles | `SAME_DAY` | `Tue Nov 10 2026` (이전 형식, 로컬 오늘 = KST 오늘) | 이어받음 |
| L-7 | America/Los_Angeles | `KST_AFTERNOON` | `Tue Nov 10 2026` (이전 형식, KST 오늘 = 로컬 내일) | 이어받음 |

L-7은 실제로 생길 수 없는 저장값(로컬 미래 날짜)이지만, 판단 기준이 기기 로컬 날짜가 아니라 KST 날짜인지 확인하는 용도.

## 날짜 유틸 (P-1, P-2, P-3)

기기 타임존 Asia/Seoul, America/Los_Angeles 각각에서 `KST_AFTERNOON` 기준.

| ID | 대상 | 결과 |
|---|---|---|
| D-1 | KST 오늘 문자열 | `2026-11-10` |
| D-2 | `2026-11-10`의 이전 형식 | `Tue Nov 10 2026` |
| D-3 | KST 오늘(Date)을 로컬 기준으로 포맷 / 90일 전 | `2026-11-10` / `2026-08-12` (통계 조회 범위) |

## 통계 달력 (P-3)

| ID | 기기 타임존 | 시각 | 상태 | 결과 |
|---|---|---|---|---|
| S-1 | America/Los_Angeles | `KST_AFTERNOON` | 11/10 정답 기록 1개 | 11/10 칸이 정답 색으로 표시됨 (수정 전: 로컬 오늘 11/9까지만 그려져 칸 없음) |
