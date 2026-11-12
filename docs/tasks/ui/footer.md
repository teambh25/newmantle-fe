# 계획: 푸터 정리와 원작 출처 표기 (classic)

공지 페이지 분리(`notices.md`)와 같이 진행. 메인 본문 가운데 하단의 원작 소개를 없애고, 푸터를 단순하게 정리하면서 맨 아래에 원작 출처 한 줄을 둔다.

- 범위: classic. excel 푸터·`GameDescription`은 그대로 (`docs/todo/excel.md`)

## 1. 원작 출처: 본문 → 푸터

- 메인 본문 가운데 하단의 원작 소개(`classic/GameDescription`: 문구 두 줄 + 꼬맨틀 링크 버튼) 삭제
  - 본문 가운데 하단은 위치가 애매하고 글씨가 컸음
  - `classic/GameDescription.tsx`는 쓰는 곳이 없어 파일 삭제 (excel은 자체 컴포넌트)
- 푸터 맨 아래에 출처 한 줄: "뉴맨틀은 꼬맨틀에서 영감을 받아 만들었어요."
  - "꼬맨틀"이 원작 외부 링크 (`https://semantle-ko.newsjel.ly/`, 새 탭)
  - `text-xs text-gray-400`, 가운데 정렬
  - "개선된 버전"은 원작을 낮추는 느낌이라 "영감을 받아"만 남김
  - 말투는 화면 전체의 해요체에 맞춤 ("~입니다"는 푸터만 딱딱해 보임)

## 2. 푸터 정리

- `© 2026 뉴맨틀. All rights reserved.` 삭제: 저작권은 표시 없이도 생기고 "All rights reserved"는 법적 의미가 거의 없음. 맨 아래는 출처 한 줄만
- 왼쪽 "뉴맨틀" 제목 삭제: 로고는 헤더에 있고, 모바일에서는 링크 줄 위로 쌓여 어색했음
- 출처 위 구분선(`Separator`) 삭제, 간격(`gap-4`)만 둠. 아래에 작은 한 줄뿐이라 선이 과함
- 폭: 배경(`bg-gray-100`)은 전체 폭 그대로, 내용 폭은 `container`(화면에 따라 최대 1536px) → 게임 화면과 같은 `max-w-2xl mx-auto`
  - 전에는 넓은 화면에서 제목은 왼쪽 끝, 링크는 오른쪽 끝에 붙어 게임 영역과 줄이 안 맞았음
  - 링크·출처 모두 가운데 정렬 → PC·모바일 같은 모양
- 링크(규칙 / 이용약관 / 개인정보처리방침 / 문의하기)는 그대로. 이용약관·처리방침·문의하기 연결은 개인정보처리방침 작업에서 (`docs/todo/privacy-terms.md` 4장, 문의하기 메일 주소도 거기 정해 둠)

## 코드

- `src/components/classic/Footer.tsx`
- `src/app/page.tsx`: `ClassicGameDescription` 제거
- `src/components/classic/GameDescription.tsx`: 삭제

## 테스트

- 규칙 작업 N-4-1을 "원작(꼬맨틀) 외부 링크가 푸터에 있음, 본문 버튼은 없음"으로 변경 (`docs/tasks/rule/verification.md`, `src/app/page.test.tsx`)
- 나머지(문구, 폭, 모바일 숨김)는 시각적 스타일이라 수동 확인: PC·375px에서 푸터 모양, 게임 영역과 줄 맞음

### 결과 기록

| 날짜 | 내용 |
| --- | --- |
| 2026-11-12 | N-4-1 변경 후 구현 전 실행: 푸터에 꼬맨틀 링크 없음으로 실패 확인. 구현 후 통과, 메인 화면 테스트 43개·lint 통과. 수동 확인은 아직 |
| 2026-11-12 | 수동 확인 (360px, PC): 푸터 모양, 게임 영역과 폭 맞음 확인 |

## 주의

- 푸터는 `feat/rules-terms`에서도 손볼 수 있는 파일이라 합칠 때 충돌 주의 (`docs/todo/privacy-terms.md` 4장에 메모)
- `/rule`의 "꼬맨틀과는 어떤 관계예요?" 답변에 아직 "개선된 버전이에요" 표현이 남아 있음. `docs/spec/rules.md` 범위라 이번엔 안 고침
