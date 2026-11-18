# 공지사항 (classic)

메인 하단의 공지 전체 목록을 `/notices` 페이지로 옮기고, 메인에는 안 읽은 새 공지를 알리는 띠만 둔다. 내력은 `decision.md`.

- 범위: classic. excel 테마는 그대로 (`docs/specs/excel-ui/plan.md`)
- Amplitude 이벤트는 추가하지 않는다 (Amplitude 개편 때 함께)

## 1. `/notices` 페이지

- 전체 공지 목록, 최신순 (날짜 내림차순, 같은 날짜는 `id` 내림차순)
- `/rule`처럼 정적 페이지. 데이터는 `src/static/notifications.ts`
- 헤더: `/rule`과 같은 형태 (뒤로가기 + "공지사항")
- 테마와 상관없이 classic UI (선례: `/stats`, `/rule`)
- 카드 모양은 기존 classic `NotificationFeed`를 옮겨 쓴다. N 표시는 없다
- 개별 공지 URL(`/notices/[id]`)은 보류
- 이 페이지에 들어오면 읽음 처리 (3)

## 2. 메인: 새 공지 띠

- 메인(classic)에 공지 목록은 없다
- 페이지 맨 위(헤더 위)에 전체 폭 띠(announcement bar): `타입 라벨 │ 최신 공지 제목  ›`
  - 옅은 파란 배경 + 아래 경계선, 작은 글씨
  - 장애 공지면 빨간 띠, 라벨은 "안내" (7, `docs/rules/notices.md`)
  - 누르면 `/notices`로 이동
  - 제목이 길면 한 줄 말줄임
  - 닫기(X) 버튼: 닫으면 읽음 처리
- 최신 공지를 안 읽었을 때만 보인다
- 말풍선 순서(`input/plan.md` 2)와는 별개. 띠는 다른 요소 위에 겹치지 않음

## 3. 읽음 처리: 마지막으로 본 공지 `id`

- 키 `newmantle_last_seen_notification_id`: 마지막으로 본 공지의 `id`
  - `id`는 늘어나는 숫자 문자열. 숫자로 비교한다 (`"10" > "9"`)
- 안 읽음: 최신 공지 `id` > 저장된 `id`. 최신은 정렬 1순위(`getLatestNotification`)
- 읽음 처리(최신 공지 `id` 저장) 시점: `/notices` 방문, 띠 X. 띠 클릭은 `/notices`로 가므로 자동
- 메인은 읽기만 한다
- 저장값이 없을 때
  - 기존 키 `newmantle_last_notification_check`(확인 시각)가 있으면: 그 시각 이전 날짜의 공지는 본 것으로 보고, 그중 가장 큰 `id`를 본 것으로 친다
  - 둘 다 없으면(처음 방문): 최신 공지가 최근 3일(KST 날짜 기준) 이내면 안 읽음, 아니면 읽음
- 기존 키는 excel 공지 목록이 계속 쓰므로 지우지 않는다. excel 쪽 동작은 그대로

## 4. 진입점: 설정 메뉴

- 설정 메뉴 안 "공지사항" 항목(링크). 위치: 피드백 남기기와 같은 영역
- `SettingsButton`은 excel과 같이 쓰므로 excel에서도 보이고, classic UI의 `/notices`로 이동 (`/stats`와 같은 상황)

## 5. 공통 로직

- 정렬, 타입 라벨/색상, 최신 공지, 안 읽음 판단을 `src/utils/notifications.ts`로 모은다
- excel `NotificationFeed`와 기존 `useNotifications`는 건드리지 않는다 (excel 전용). 예외: excel 라벨만 공통 `getTypeLabel`

## 6. 공지 종류

- 업데이트 / 기타 / 장애(`incident`). 규칙은 `docs/rules/notices.md`
- 사과문(id 1)은 `incident`

## 7. 색

원칙: 기본은 파랑과 무채색. 다른 색은 경고처럼 뜻이 있을 때만 쓴다. 공지 종류는 강조할 정보가 아니라 글자로 충분하고, 장애만 주의가 필요하다.

| 곳 | 평소 (업데이트·기타) | 장애 |
| --- | --- | --- |
| 메인 띠 배경 | 옅은 파랑 (`bg-blue-50`) | 옅은 빨강 (`bg-red-50`) |
| 메인 띠 라벨 | 굵은 검정 (`text-gray-900`) | 굵은 빨강 (`text-red-700`), 라벨은 "안내" |
| 메인 띠 제목 | 회색 (`text-gray-700`) | 진한 빨강 (`text-red-900`) |
| `/notices` 배지 | 업데이트: 파랑 (`bg-blue-50 text-blue-700`), 기타: 회색 (`bg-gray-100 text-gray-600`) | 옅은 빨강 (`bg-red-50 text-red-700`) |

- 색은 `src/utils/notifications.ts` 한 곳에서 정해서 띠와 `/notices`가 같이 바뀐다

## 코드

- `src/app/notices/page.tsx`: `/notices` (1)
- `src/app/page.tsx`: classic에서 공지 목록 제거, 띠 추가 (2)
- `src/components/classic/NoticeBanner.tsx`: 띠, `STYLES` (2, 7)
- `src/components/classic/NotificationFeed.tsx`: `/notices` 카드·배지 (1, 7)
- `src/components/classic/MarkNoticesSeen.tsx`, `src/hooks/useLastSeenNotice.ts`: 저장값 읽기, 읽음 처리 (3)
- `src/utils/notifications.ts`: 정렬, `getTypeLabel`, `getTypeColor`, `isIncident`, `getBannerLabel` (5, 7)
- `src/components/SettingsButton.tsx`: 공지사항 항목 (4)
- `src/static/notifications.ts`: 종류 (6)
- `src/components/excel/NotificationFeed.tsx`: 라벨만 공통 함수로
