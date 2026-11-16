# 모바일 UI 정리 (classic)

출처: `docs/todo/ui.md`. 범위는 classic 테마의 메인(`/`)·통계(`/stats`)·공지(`/notices`) 화면. excel 테마는 따로 적지 않으면 그대로.

## 폴더

기능마다 폴더 하나. 폴더 안 파일은 같은 역할을 한다.

| 파일 | 내용 |
| --- | --- |
| `plan.md` | **지금 규칙**. 이것만 읽으면 현재 동작을 안다. 테스트 케이스의 기준 |
| `decision.md` | 결정 기록: 왜 이렇게 됐나, 해 보고 버린 것. 같은 고민을 반복하지 않게 남김 |
| `verification.md` | 케이스 표, 결과 기록(날짜순) |

| 폴더 | 기능 | 케이스 ID |
| --- | --- | --- |
| `header/` | 헤더 계정 영역·닉네임·로그인 버튼 자리, 통계 유도 말풍선, 헤더 말풍선 자동 닫힘 | L, T, H-1 |
| `input/` | 입력창 버튼, 첫 입력 유도 말풍선·말풍선 순서, 제출 결과 안내(없는 단어·요청 실패·이미 낸 단어) | E, I, Y, K |
| `word-list/` | 단어 목록(방금 입력 칸·기록 표), 순위 단계, 힌트 단어, 날짜·정답 제목, 보이는 개수. 다음 단계 계획 `rank-track.md` | W, G |
| `progress-card/` | 진행 상황 카드 (방금 입력 칸을 카드 + 가로 게이지로) | PC |
| `result-box/` | 게임이 끝났을 때 결과창 모달, 메인 완료 표시, 결과창이 열린 동안 헤더 로그인 강조 | R, H-2 |
| `feedback/` | 피드백 창 (설정 메뉴·결과창 공통, classic·excel) | F |
| `notices/` | `/notices` 페이지, 새 공지 띠, 읽음 처리, 공지 색 | NT |
| `footer/` | 푸터 정리, 원작 출처 | (규칙 작업 N-4-1) |
| `giveup-dialog/` | 포기 확인 창 | (힌트·포기 작업 B-2) |
| `dev-page/` | 개발용 `/dev` 페이지 (가짜 단어 목록, 실패 주입) | DV |

수동 확인(모양·색·크기, 실제 폰에서만 볼 수 있는 키보드·보이는 높이)은 기능 구분 없이 `docs/manual-checks.md` 한 곳에 둔다.

케이스 ID는 테스트 이름 앞에 붙어 있어 폴더를 나눠도 바꾸지 않는다. 수동 확인 V 번호도 그대로 둔다 (빈 번호는 다른 곳으로 옮겼거나 합친 것).

## 공통 검증 원칙

- 기준: 각 폴더 `plan.md`의 지금 규칙. 구현을 보고 케이스를 만들거나 바꾸지 않는다
- 요소는 role과 접근 가능한 이름으로 찾는다. 문구는 검증하지 않는다
- 테스트 이름 앞에 케이스 ID를 붙인다
- 레이아웃·글씨 크기·색은 jsdom에서 확인할 수 없어 수동으로 본다 (헤드리스 크롬 측정은 참고, 사용자 확인이 기준)

| 레벨 | 도구 | 대상 |
| --- | --- | --- |
| **로직** | vitest | 순수 함수, 훅 반환값 |
| **화면** | vitest + React Testing Library + user-event | 보이는 요소, 보내는 요청, 저장값 |
| **수동** | 브라우저 개발자 도구(좁은 기기) + 사용자 개발 서버(localhost:3000) | 모양·색·크기 (`docs/manual-checks.md`) |
| **실제 폰** | iOS Safari, Android Chrome | `docs/manual-checks.md` 실제 폰 |

mock 정책은 `src/test/README.md`와 같다. Supabase는 가짜 클라이언트 (기본 비로그인, `L-*`는 로그인 세션). `signOut`은 spy로 호출만 확인한다.

## 테스트 파일

| 파일 | 케이스 |
| --- | --- |
| `src/app/page.test.tsx` | L, T, H, I, R, NT-5 ~ 8 |
| `src/app/feedback.test.tsx` | F |
| `src/app/stats/page.test.tsx` | T-2 |
| `src/app/notices/page.test.tsx` | NT-9 |
| `src/hooks/useGameState.test.ts` | R-3 |
| `src/components/classic/NewMantleForm/SubmitInput.test.tsx` | 엔터 제출, 없는 단어, 이미 낸 단어, 요청 실패 알림 |
| `src/components/classic/NewMantleForm/ProgressCard.test.tsx` | 진행 상황 카드 |
| `src/utils/board.test.ts` | 방금 입력 칸과 기록 표, 날짜 제목, 게이지 최고 순위 |
| `src/components/classic/NewMantleForm/WordList.test.tsx` | W-2 ~ W-4 |
| `src/utils/rankTier.test.ts` | W-1 |
| `src/utils/date.test.ts` | G |
| `src/utils/korean.test.ts` | K |
| `src/utils/notifications.test.ts` | NT-1 ~ NT-4 |
| `src/app/dev/faults.test.ts` | DV |

가짜 서버(`src/test/fakeGameServer.ts`)에는 없는 단어(404)를 이 작업에서 추가했다. 피드백 웹훅은 가짜 웹훅(`src/test/fakeFeedbackWebhook.ts`)으로 가로챈다.
