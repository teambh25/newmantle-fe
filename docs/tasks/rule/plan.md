# 규칙 페이지 / 첫 방문 모달 (계획)

메인 하단 "도움말"을 없애고, 첫 방문 모달로 짧게 안내하며, 자세한 설명은 `/rule`에 둔다. 내용 기준은 `docs/spec/rules.md`. 이번 범위는 classic 테마만.

## 1. 현재 상태

| 위치 | 내용 | 코드 |
| --- | --- | --- |
| 메인 "도움말" (아코디언) | FAQ 2개<br>① 어떻게 플레이하나요? → 단어 입력, 유사도 확인, 더 높은 단어 추측<br>② 다른 단어를 맞히고 싶어요 → 매일 00시에 정답이 바뀜 | `src/static/faq.ts`<br>classic: `src/components/HelpSection.tsx`<br>excel: `src/components/excel/HelpSection.tsx` |
| 메인 최하단 | "이 게임은 원작인 꼬맨틀의 개선된 버전입니다" + 꼬맨틀 링크 버튼 | `src/components/{classic,excel}/GameDescription.tsx` |
| 로그인 말풍선 | 비로그인 시 "비로그인은 기록이 날아가요", 닫으면 localStorage `login-tooltip-dismissed` | `src/components/AuthButton.tsx` (`z-[9999]`) |
| 힌트 버튼 | hover 시 "힌트" 툴팁 | `src/components/classic/HintButton.tsx` |
| 힌트 상수 | `FIRST_HINT_RANK=999`, `HINT_LIMIT_RANK=20`, `HINT_RATIO=0.75` | `src/utils/gameRules.ts` |

## 2. 첫 방문 안내 모달

**툴팁이 아니라 모달로 한다.** 툴팁은 마우스를 올려야 보이는데 모바일에는 hover가 없어 처음 온 사람이 볼 수 없다.

| # | 항목 | 규칙 |
| --- | --- | --- |
| M-1 | 언제 열리나 | 메인 첫 방문 시 자동으로. 한 번 닫으면 다시 자동으로 열리지 않음 (localStorage에 확인 여부 저장) |
| M-2 | 기존 유저 | 저장된 확인 여부가 없으므로 한 번 보게 됨 (도움말을 없애는 대신) |
| M-3 | 내용 | `docs/spec/rules.md` "첫 방문 모달 요약" + `/rule`로 가는 링크 |
| M-4 | 닫기 | X / 바깥 클릭 / ESC |
| M-5 | 테마 | classic만 (excel은 기존 도움말 유지, 아래 todo) |
| M-6 | 로그인 말풍선과의 순서 | 비로그인 첫 방문 시 로그인 말풍선도 같이 뜸 → 모달을 닫은 뒤에 말풍선이 보이도록 |
| M-7 | 버튼 (2026-11-12 수정) | "시작하기"(꽉 찬 파랑) 아래 "자세한 규칙 보기"를 회색 테두리 버튼으로. 회색 글씨 링크가 버튼도 링크도 아닌 크기라 어색했음. 포기 확인 창과 같은 규칙 (`docs/tasks/ui/giveup-dialog.md`). 정답 교체 안내는 괄호 빼고 "정답은 매일 밤 12시에 바뀌어요.", 본문은 단어 단위 줄바꿈 |

## 3. 진입점 / 메인 변경

| 위치 | 현재 | 변경 |
| --- | --- | --- |
| 메인 도움말 (classic) | 하단 아코디언 | 제거. `src/static/faq.ts`도 삭제 (excel 도움말이 아직 쓰면 excel 정리 때 삭제) |
| 헤더 | 통계 / 설정 / 로그인 | `?` 버튼 추가 → **바로 `/rule`로 이동** (모달을 다시 열지 않음) |
| classic 푸터 | 이용약관 / 개인정보처리방침 / 문의하기 (`#`) | "규칙" → `/rule` 추가. 나머지는 그대로 |
| 메인 원작 표기 | `GameDescription` | 그대로 |
| 입력창 placeholder | "단어 입력" | **완료**: 입력한 단어가 없으면 "아무 단어나 입력해보세요", 있으면 "단어 입력", 에러 시 에러 문구 (`GameForm.tsx`). 첫 단어 입력 유도는 `docs/tasks/ui/plan.md` 7장 (입력창 말풍선) |

## 4. 구현 메모

- `/rule`은 정적 페이지라 서버 컴포넌트 + 정적 생성. 페이지 `metadata`(title/description) 추가
- `/rule`에서 메인으로 돌아가는 방법 (헤더 로고 / 뒤로가기 링크)
- 테스트 케이스: `verification.md`

### 구현 결과 (2026-11-11)

| 항목 | 위치 |
| --- | --- |
| `/rule` 페이지 (정적, `metadata`) | `src/app/rule/page.tsx`. 상단 뒤로가기(`/`) + 하단 "게임하러 가기" |
| 첫 방문 모달 | `src/components/classic/RuleIntroModal.tsx`. X / ESC / 바깥 클릭 / "시작하기" / "자세한 규칙 보기" 모두 확인 처리 |
| 모달 상태 | `src/hooks/useRuleIntroModal.ts`, localStorage `newmantle_rule_modal_seen` |
| 로그인 말풍선 순서 (M-6) | `AuthButton`에 `hideTooltip` 추가, 메인에서 모달이 닫히기 전까지 숨김. 말풍선 X 버튼에 접근 가능한 이름 "로그인 안내 닫기" 추가 |
| 헤더 `?` | `src/app/page.tsx` (classic), 아이콘 `CircleHelp`, 이름 "게임 규칙" |
| 푸터 "규칙" | `src/components/classic/Footer.tsx` |
| 도움말 제거 | `src/components/HelpSection.tsx` 삭제. `src/static/faq.ts`는 excel 도움말이 쓰므로 유지 |

## 5. TODO / 검토

- [ ] excel 테마: 하단 탭에 "규칙" 탭 추가, excel 도움말(`ExcelHelpSection`) 정리, 모달 적용 여부
- [ ] 메인 상시 안내 보강 (모달 이후에도 메인만 보고 알 수 있게). 모바일에서도 보이는 방식 우선
  - 힌트 / 포기 버튼 툴팁 문구를 짧은 설명으로 (예: "더 가까운 단어 보기"). hover라 데스크톱 보조용
  - 힌트 버튼이 20위 도달로 막혔을 때 이유를 알 수 있게 (비활성 버튼은 탭/hover가 안 먹으므로 별도 방식 필요)
- [ ] 공유 링크로 처음 들어온 사람에게도 모달을 띄울지 (비교 바를 가릴 수 있음)
