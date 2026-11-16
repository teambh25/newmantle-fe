# 푸터와 원작 출처 (classic)

공지 페이지 분리(`notices/`)와 같이 진행. 내력은 `decision.md`.

- 범위: classic. excel 푸터·`GameDescription`은 그대로 (`specs/excel-ui/plan.md`)

## 1. 원작 출처: 푸터 맨 아래 한 줄

- 메인 본문에 원작 소개가 없다 (`classic/GameDescription.tsx`는 삭제, excel은 자체 컴포넌트)
- 푸터 맨 아래에 출처 한 줄: 원작에서 영감을 받아 만들었다는 내용
  - 원작 이름이 외부 링크 (`https://semantle-ko.newsjel.ly/`, 새 탭)
  - `text-xs text-gray-400`, 가운데 정렬
  - 원작을 낮추는 표현("개선된 버전")은 쓰지 않는다
  - 말투는 화면 전체의 해요체

## 2. 푸터 모양

- 맨 아래는 출처 한 줄만 (저작권 문구 없음)
- 왼쪽 "뉴맨틀" 제목 없음 (로고는 헤더에 있음)
- 출처 위 구분선 없이 간격(`gap-2`)만. 위아래 여백 `py-4` (2026-11-16, 사용자: 글 두 줄에 회색 공백이 너무 많음. `py-6`·`gap-4` 100px → `py-3`·`gap-1` 64px는 너무 작음 → 76px)
- 폭: 배경(`bg-gray-100`)은 전체 폭, 내용 폭은 게임 화면과 같은 `max-w-2xl mx-auto`. 링크·출처 모두 가운데 정렬 → PC·모바일 같은 모양
- 링크(규칙 / 이용약관 / 개인정보처리방침 / 문의하기)는 그대로. 이용약관·처리방침·문의하기 연결은 개인정보처리방침 작업에서 (`docs/todo/privacy-terms.md` 4장)
- 푸터 위 여백 `mt-6` (`word-list/plan.md` 5)

## 주의

- 푸터는 `feat/rules-terms`에서도 손볼 수 있는 파일이라 합칠 때 충돌 주의 (`docs/todo/privacy-terms.md` 4장에 메모)
- `/rule`의 "꼬맨틀과는 어떤 관계예요?" 답변에 아직 "개선된 버전이에요" 표현이 남아 있음. `docs/spec/rules.md` 범위라 이번엔 안 고침

## 코드

- `src/components/classic/Footer.tsx`
- `src/app/page.tsx`: `ClassicGameDescription` 제거
