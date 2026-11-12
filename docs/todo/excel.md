# excel 테마 정리 (모음)

classic 위주로 진행하면서 excel에 미룬 것들. 나중에 한 번에 손댈 때 이 목록부터 본다.

## 공지사항 (`docs/tasks/ui/notices.md`)

- 메인에 아직 공지 전체 목록(`ExcelNotificationFeed`, 30행~)이 그대로 있음 → classic처럼 목록 제거 + 새 공지 알림
- `/notices` excel 버전 여부. 지원하면 하단 탭 바(현재 "게임"만)에 "공지사항" 탭이 자연스러움
- 읽음 처리: excel 공지 목록은 기존 `useNotifications`(메인 마운트 시 읽음 처리)를 그대로 씀 → classic의 새 읽음 로직으로 맞추기
- 정렬, 타입 색상이 classic과 중복이고 정렬 방식도 다름 (`Date` 비교 vs 문자열 비교) → 공통 유틸 사용. 라벨은 공통 `getTypeLabel`로 바꿈
- 장애(`incident`) 종류 색: excel 배지 색에 없어 기본 회색으로 보임. classic은 장애만 빨강 (`docs/tasks/ui/color.md`)

## 규칙 (`docs/tasks/rule/plan.md`)

- 하단 탭에 "규칙" 탭 추가
- excel 도움말(`ExcelHelpSection`) 정리. 정리되면 `src/static/faq.ts` 삭제
- 첫 방문 안내 모달 적용 여부 (현재 excel은 안 열림, M-5)
- 이용약관 / 개인정보처리방침 진입점 (`docs/todo/rules-terms.md`): excel 푸터는 렌더링 안 됨 → 푸터 / 하단 탭 / 헤더 메뉴 중 어디에 둘지

## 메인 UI (`docs/tasks/ui/plan.md`)

- 3장 게임 날짜 요일: excel 시트 이름(`Sheet: 11월 11일`)은 그대로
- 4장 힌트·포기 글씨 버튼, 엔터 아이콘, placeholder: classic만
- 5장 통계 유도 말풍선: excel 헤더는 일반 `Link`라 없음
- 7장 첫 입력 유도 말풍선: excel 없음

## 기타

- 공유 링크 생성 / 진입 처리가 classic, excel에 복제돼 있음 → 훅으로 분리 (`docs/todo/share.md`)
- 첫 추측 관련 excel 적용 여부 (`docs/todo/first-guess.md`)
