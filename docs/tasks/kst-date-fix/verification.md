# 검증: KST 날짜 처리

## 원칙

- 기준: `docs/tasks/kst-date-fix/problem.md`의 결정 사항
- 레벨: 로직 (vitest, 게임 상태 훅·날짜 유틸) + 화면 (통계 달력, 통계 화면)
- 테스트 이름 앞에 케이스 ID를 붙인다 (예: `L-1: ...`)
- 기기 타임존(`TZ`)과 현재 시각을 고정해 실행 환경과 무관하게 같은 결과가 나오게 한다

## 기준 시각

| 이름 | UTC | KST | LA (기기 로컬) |
|---|---|---|---|
| `KST_AFTERNOON` | 2026-11-10 05:00 | 11/10 14:00 | 11/9 21:00 |
| `SAME_DAY` | 2026-11-10 10:00 | 11/10 19:00 | 11/10 02:00 |
| `KST_BEFORE_MIDNIGHT` | 2026-11-10 14:59:59 | 11/10 23:59:59 | 11/10 06:59:59 |
| `KST_MIDNIGHT` | 2026-11-10 15:00 | 11/11 00:00 | 11/10 07:00 |

`KST_AFTERNOON`만으로는 "현재 시각 + 9시간 후 로컬 getter로 읽기" 같은 잘못된 계산이 두 타임존 모두에서 우연히 맞는다. 경계 시각은 이런 계산을 잡기 위한 것이다.

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
| L-8 | America/Los_Angeles | `KST_AFTERNOON` | `2026-11-10` (새 형식, KST 오늘 = 로컬 내일) | 그대로 유지 |
| L-9 | America/Los_Angeles | `KST_AFTERNOON` | `2026-11-09` (새 형식, KST 어제 = 로컬 오늘) | 초기화 |

L-7은 실제로 생길 수 없는 저장값(로컬 미래 날짜)이지만, 판단 기준이 기기 로컬 날짜가 아니라 KST 날짜인지 확인하는 용도.
L-8, L-9는 새 형식도 기기 로컬 날짜가 아니라 KST 날짜로 비교하는지 확인한다 (Asia/Seoul에서는 두 날짜가 같아 L-1, L-2로는 구분되지 않음).

## 퀴즈 날짜 (P-1)

게임 날짜 훅으로 정한 날짜를 게임 상태 훅에 넘겨 실제로 요청한다.

| ID | 기기 타임존 | 시각 | 행동 | 결과 |
|---|---|---|---|---|
| Q-1 | America/Los_Angeles | `KST_AFTERNOON` | 마운트 | 게임 날짜 `2026-11-10` |
| Q-2 | America/Los_Angeles | `KST_AFTERNOON` | 단어 제출, 일반 힌트, 초성 힌트, 포기 | 모든 요청 경로의 날짜가 `2026-11-10` (수정 전: 힌트·포기가 `2026-11-09`) |

## 날짜 유틸 (P-1, P-2, P-3)

기기 타임존 Asia/Seoul, America/Los_Angeles 각각에서 `KST_AFTERNOON` 기준.

| ID | 대상 | 결과 |
|---|---|---|
| D-1 | KST 오늘 문자열 | `2026-11-10` |
| D-2 | `2026-11-10`의 이전 형식 | `Tue Nov 10 2026` |
| D-3 | KST 오늘(Date)을 로컬 기준으로 포맷 / 90일 전 | `2026-11-10` / `2026-08-12` (통계 조회 범위) |

기기 타임존 Asia/Seoul, America/Los_Angeles 각각에서 KST 자정 경계.

| ID | 시각 | 대상 | 결과 |
|---|---|---|---|
| D-4 | `KST_BEFORE_MIDNIGHT` | KST 오늘 문자열 / KST 오늘(Date)을 로컬 기준으로 포맷 | `2026-11-10` / `2026-11-10` |
| D-5 | `KST_MIDNIGHT` | KST 오늘 문자열 / KST 오늘(Date)을 로컬 기준으로 포맷 | `2026-11-11` / `2026-11-11` |

## 통계 달력 (P-3)

| ID | 기기 타임존 | 시각 | 상태 | 결과 |
|---|---|---|---|---|
| S-1 | America/Los_Angeles | `KST_AFTERNOON` | 11/10 정답 기록 1개 | 11/10 칸이 정답 색으로 표시됨 (수정 전: 로컬 오늘 11/9까지만 그려져 칸 없음) |
| S-2 | America/Los_Angeles | `KST_AFTERNOON` | 로그인 상태로 통계 화면 진입 | 통계 조회 범위가 `2026-08-12` ~ `2026-11-10` (수정 전: ~ `2026-11-09`) |
