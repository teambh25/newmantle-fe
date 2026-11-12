# 계획: 공지사항 페이지 분리 (classic)

출처: `docs/todo/notices.md`. 메인 하단의 공지 전체 목록을 `/notices` 페이지로 옮기고, 메인에는 안 읽은 새 공지를 알리는 작은 배너만 둔다.

- 범위: classic. excel 테마는 그대로 둔다 (`docs/todo/excel.md`)
- Amplitude 이벤트는 추가하지 않는다 (Amplitude 개편 때 함께)

## 1. `/notices` 페이지

- 전체 공지 목록, 최신순 (날짜 내림차순, 같은 날짜는 `id` 내림차순)
- `/rule`처럼 정적 페이지. 데이터는 `src/static/notifications.ts`
- 헤더: `/rule`과 같은 형태 (뒤로가기 + "공지사항")
- 테마와 상관없이 classic UI (선례: `/stats`, `/rule`)
- 카드 모양은 기존 classic `NotificationFeed`를 옮겨 쓴다. N 표시는 없앤다. 글씨 크기는 `plan.md` 2장(분리 후 재검토)을 여기서 함께 정한다
- 개별 공지 URL(`/notices/[id]`)은 보류
- 이 페이지에 들어오면 읽음 처리 (3장)

## 2. 메인: 공지 목록 제거, 새 공지 배너

- 메인(classic)에서 `ClassicNotificationFeed`를 뺀다
- 대신 페이지 맨 위(헤더 위)에 전체 폭 띠(announcement bar): `타입 라벨 │ 최신 공지 제목  ›`
  - 옅은 파란 배경 + 아래 경계선, 작은 글씨. 처음엔 헤더 아래 테두리 박스였는데 입력창과 너무 비슷해 보여 바꿈
  - 장애 공지면 빨간 띠, 라벨은 "안내". 색은 `color.md`, 종류는 `docs/spec/notices.md`
  - 누르면 `/notices`로 이동
  - 제목이 길면 한 줄 말줄임
  - 닫기(X) 버튼: 닫으면 읽음 처리
- 최신 공지를 안 읽었을 때만 보인다. 읽은 뒤에는 배너 자체가 없다
- 말풍선 순서(`plan.md` 7장)와는 별개로 보인다. 배너는 다른 요소 위에 겹치지 않음

## 3. 읽음 처리: 마지막으로 본 공지 `id`

기존 방식(공지 `date` vs 확인 시각)은 `date`가 날짜만이라 UTC 자정(KST 09:00)으로 비교되어, 같은 날 확인한 뒤 올라온 공지를 놓친다. 또 메인 방문만으로 읽음 처리돼서 배너가 한 번 뜨고 바로 사라진다. 그래서 시각 대신 공지 `id`로 비교한다.

- 새 키 `newmantle_last_seen_notification_id`: 마지막으로 본 공지의 `id`
  - `id`는 늘어나는 숫자 문자열. 숫자로 비교한다 (`"10" > "9"`)
- 안 읽음: 최신 공지 `id` > 저장된 `id`
- 읽음 처리(최신 공지 `id` 저장) 시점: `/notices` 방문, 배너 X. 배너 클릭은 `/notices`로 가므로 자동
- 메인은 읽기만 한다
- 저장값이 없을 때
  - 기존 키 `newmantle_last_notification_check`(확인 시각)가 있으면: 기존 규칙대로 그 시각 이전 날짜의 공지는 본 것으로 보고, 그중 가장 큰 `id`를 본 것으로 친다
  - 둘 다 없으면(처음 방문): 최신 공지가 최근 3일(KST 날짜 기준) 이내면 안 읽음, 아니면 읽음
- 기존 키는 excel 공지 목록이 계속 쓰므로 지우지 않는다. excel 쪽 동작은 그대로

## 4. 진입점: 설정 메뉴

헤더에 아이콘을 더하면 로그인 + 긴 닉네임 상태에서 375px 폭을 넘는다 (약 344px > 343px). 그래서 설정 메뉴 안에 "공지사항" 항목(링크)을 둔다.

- 위치: 피드백 남기기와 같은 영역
- `SettingsButton`은 excel과 같이 쓰므로 excel에서도 보이고, classic UI의 `/notices`로 이동한다 (`/stats`와 같은 상황)

## 5. 공통 로직

- 정렬, 타입 라벨/색상, 최신 공지, 안 읽음 판단을 `src/utils/notifications.ts`로 모은다
- excel `NotificationFeed`와 기존 `useNotifications`는 건드리지 않는다 (excel 전용으로 남음). 예외: 장애 종류 추가로 excel 라벨만 공통 `getTypeLabel` 사용

## 6. 공지 종류 정리

색 고민(`color.md`) 중에 정함. 규칙은 `docs/spec/notices.md`

- 업데이트 / 공지 / 장애(`incident`, 신규). 이벤트는 쓸 일이 없어 삭제
- 사과문(id 1)을 `notice` → `incident`

푸터 정리와 원작 출처 표기는 같이 진행했지만 별도 문서로 분리: `footer.md`

## 코드 (예상)

- `src/app/notices/page.tsx` (신규)
- `src/app/page.tsx`: classic에서 공지 목록 제거, 배너 추가
- `src/components/classic/NoticeBanner.tsx` (신규)
- `src/components/classic/NotificationFeed.tsx`: `/notices`용으로 정리 (N 표시 제거)
- `src/hooks/useLastSeenNotice.ts` (신규): 저장값 읽기, 읽음 처리
- `src/utils/notifications.ts` (신규)
- `src/components/SettingsButton.tsx`: 공지사항 항목
- `src/static/notifications.ts`: 종류 정리 (6장)
- `src/components/excel/NotificationFeed.tsx`: 라벨만 공통 함수로

## 테스트

복잡한 건 없다. 판단 로직은 순수 함수로 두고, 화면은 메인·`/notices`·설정 메뉴만 본다. 로직 테스트는 공지 목록·현재 시각을 인자로 넘긴다. 화면 테스트는 실제 `notifications.ts`를 쓰고, 최신 공지 `id`를 기준으로 저장값을 정한다 (공지가 추가돼도 그대로 동작). 테스트 ID는 규칙 작업의 `N-*`와 겹치지 않게 `NT-*`.

| ID | 수준 | 전제 | 동작 | 기대 |
| --- | --- | --- | --- | --- |
| NT-1 | 로직 | 저장 `id` < 최신 `id` / = 최신 `id` | 안 읽음 판단 | 안 읽음 / 읽음 |
| NT-2 | 로직 | `"9"` 저장, 최신 `"10"` | 안 읽음 판단 | 안 읽음 (문자열이 아닌 숫자 비교) |
| NT-3 | 로직 | 새 키 없음, 기존 확인 시각이 최신 공지 날짜 이후 / 이전 | 안 읽음 판단 | 읽음 / 안 읽음 |
| NT-4 | 로직 | 저장값 없음, 오늘(KST)이 최신 공지 + 2일 / + 4일 | 안 읽음 판단 | 안 읽음 / 읽음 |
| NT-5 | 화면 | 메인 classic, 안 읽음 | 진입 | 배너가 보이고 `/notices` 링크. 공지 목록은 없음 |
| NT-6 | 화면 | 메인 classic, 읽음 | 진입 | 배너 없음 |
| NT-7 | 화면 | 메인 classic, 안 읽음 + 기존 키 있음 | 진입만 | 새 키·기존 키 저장값 모두 바뀌지 않음 (기존 공지 목록은 마운트 시 기존 키를 덮어썼음) |
| NT-8 | 화면 | 메인 classic, 안 읽음 | 배너 X | 배너 사라짐, 새 키 = 최신 `id` |
| NT-9 | 화면 | `/notices` | 진입 | 전체 공지가 최신순, 새 키 = 최신 `id` |
| NT-10 | 화면 | 메인 classic | 설정 열기 | "공지사항" 링크가 `/notices`를 가리킴 |

- 수동 확인: 375px에서 배너 한 줄·말줄임, 배너 클릭 → `/notices` → 뒤로가기 시 배너 없음

### 결과 기록

| 날짜 | 내용 |
| --- | --- |
| 2026-11-12 | 구현 전 실행: NT-5·7·8·10 실패(배너·링크 없음, 기존 키 덮어씀), NT-1~4·9 모듈 없음. NT-6은 "배너 없음" 확인이라 구현 전에도 통과 (NT-5의 반대 짝으로 유지) |
| 2026-11-12 | 구현 후 전체 184개 통과, `tsc`·lint 통과. 수동 확인은 아직 |
| 2026-11-12 | 수동 확인 (360px, PC): 띠, `/notices` 이상 없음. 띠 라벨·배지 색만 남음 (`color.md`) |
| 2026-11-12 | 색 결정·장애 종류 추가 후 전체 184개 통과, `tsc`·lint 통과. 장애 띠는 임시 공지로 화면 확인 후 임시 공지 삭제 |
| 2026-11-12 | 10월 29~30일 장애 사과문(id 7, `date` 10-30, 기록용) 추가 후 NT-5·8 실패: 테스트가 "가장 큰 id = 최신"으로 가정해서. 최신을 정렬 1순위(`getLatestNotification`)로 고친 뒤 184개 통과 |

## 결정 기록

- D-1 진입점: 설정 메뉴 안
- D-2 배너: 최신 공지를 안 읽었을 때만
- D-3 읽음 비교: 마지막으로 본 공지 `id` (새 키, 기존 키에서 한 번 이전)
- D-4 `/notices`의 N 표시: 없앰
- D-5 Amplitude: 이번엔 안 함 (개편 때)
- D-6 색: 장애만 빨강, 나머지는 무채색 배지 + 파란 띠 (`color.md`)
- D-7 종류: 업데이트 / 공지 / 장애, 이벤트 삭제. 장애는 띠에서만 "안내" (`docs/spec/notices.md`)
