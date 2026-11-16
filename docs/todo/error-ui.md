# 예외 처리 UI 정리 (나중에)

실패·오류를 알리는 방식이 토스트, 입력창 placeholder, 브라우저 `alert`로 섞여 있다. 한 번에 정리한다.

## 지금 상태

| 상황 | 방식 | 문구 | 코드 |
| --- | --- | --- | --- |
| 힌트 요청 실패 | 실패 토스트 | 힌트 요청 실패 / 힌트를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요. | `src/hooks/useGameState.ts` |
| 초성 힌트 요청 실패 | 실패 토스트 | 초성 힌트 요청 실패 / … 다시 시도해주세요. | `src/hooks/useGameState.ts` |
| 포기(정답 가져오기) 실패 | 실패 토스트 | 정답 가져오기 실패 / … 다시 시도해주세요. | `src/hooks/useGameState.ts` |
| 단어 제출: 없는 단어 / 오류 | 입력창 placeholder | 없는 단어입니다 / 오류가 발생했습니다 | `useGameState.ts`, `classic/NewMantleForm/GameForm.tsx` |
| 공유 링크 복사 실패 | 실패 토스트 | 링크 복사 실패 | `classic/NewMantleForm/index.tsx` (excel도 같음) |
| 피드백 제출 실패 | 브라우저 `alert` | 피드백 제출 중 오류가 발생했습니다. 다시 시도해 주세요. | `classic/SurveyForm.tsx` (excel도 같음) |
| 닉네임 설정 실패 | 브라우저 `alert` | 오류가 발생했습니다: (Supabase 오류 메시지 그대로) | `src/components/NicknameSetupModal.tsx` |

참고: 성공 토스트도 남아 있음 (정답 축하, 링크 복사 완료). 초성 힌트 성공 토스트는 제거함 (`docs/tasks/ui/giveup-dialog.md` 6장)

## 문제

- 토스트 위치가 모바일은 화면 위라 게임(헤더·입력창 근처)을 가림. PC는 오른쪽 아래 (`src/components/ui/toast.tsx`, 공통 설정)
- 실패 토스트가 빨간 배경(`destructive`)이라 강함. 색 원칙(빨강은 주의가 필요할 때만, `docs/tasks/ui/color.md`)과 맞는지 볼 것
- 문구 말투가 합니다체라 최근 UI(해요체)와 다름. "오류가 발생했습니다"처럼 무엇을 하면 되는지 안 알려주는 문구도 있음
- `alert`는 디자인이 따로 놀고, 닉네임 설정은 내부 오류 메시지를 그대로 보여줌
- 3초 타임아웃은 서버에서 처리됐을 수도 있음 (스펙 D-3 참고). 안내 문구에 반영할지

## 정할 것

- 실패를 어디에 보여줄지: 토스트 유지(위치만 조정) / 버튼·입력창 근처 인라인 안내 / 상황별로 다르게
- 토스트를 유지하면 모바일 위치 (아래로 옮기면 키보드에 가릴 수 있음)
- 실패 표시 색 (빨강 유지 / 덜 강하게)
- 문구 통일 (해요체, 다음 행동 안내: "잠시 후 다시 눌러주세요" 등)
- `alert` 대체

## 관련 규칙

- 스펙 `docs/spec/hint-giveup.md` D-3: 힌트·포기 실패 시 실패 토스트, 상태 변경 없음, 버튼으로 재시도
- 테스트 하네스 `h.failureToastShown()`이 실패 토스트를 확인함 (`src/test/README.md`). 방식을 바꾸면 하네스와 테스트도 같이
