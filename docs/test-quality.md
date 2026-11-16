# 테스트 품질 점검

- 처음 점검: 2026-11-16 (다른 에이전트)
- 다시 확인: 2026-11-16. 커밋 `f48af56` 기준으로 주장마다 코드를 열어 대조함
- 판단 기준: `CLAUDE.md` "What to test" (로직 테스트 우선, 앱 로직 없는 건 테스트하지 않음, 같은 규칙을 로직·화면 양쪽에서 확인하지 않음, 화면 테스트는 로직에서 확인한 규칙이 버튼에 반영되는지만 봄)

## 이미 정리한 것 (커밋 `e883c20`, `a94ce14`)

테스트 349개 → 305개, 전부 통과.

- 게임판 계산(날짜 제목, 방금 입력 칸, 기록 표, 게이지 최고 순위, 게임 끝 상태)을 `NewMantleForm/index.tsx`에서 `src/utils/board.ts`로 빼고, 화면 테스트를 `board.test.ts`로 옮김
- 포기 확인 창을 ESC·X·바깥 클릭으로 닫는 반복 테스트, 요청 실패 뒤 버튼이 다시 켜지는 화면 테스트(훅에서 이미 확인)를 지움
- 상태와 상관없이 항상 보이는 요소(규칙 페이지, 규칙·원작 링크, 결과창 구성, 통계 헤더, 피드백 창 구성 등)만 확인하던 테스트를 지움
- 쓰지 않는 순위 트랙 컴포넌트와 그 전용 계산·테스트를 지움

## 파일별 현황

개수는 `vitest` 실행 기준(`it.each` 펼친 개수 포함).

| 파일 | 개수 | 내용 |
| --- | --- | --- |
| `src/components/classic/NewMantleForm/NewMantleForm.test.tsx` | 50 | 힌트·포기 버튼 활성, 포기 확인 창 선택지와 포커스, 요청 중 잠금, 새로고침 후 상태, 없는 단어 임시 줄, 실패 알림·토스트, 진행 상황 카드 |
| `src/app/page.test.tsx` | 55 | 첫 방문 모달, 로그아웃 위치, 헤더 말풍선(로그인·통계·5초 자동 닫힘), 결과창 자동 표시·닫기·다시 보기, 입력창 말풍선 순서, 공지 배너 |
| `src/hooks/useGameState.test.ts` | 34 | 힌트 순위·막힘, 초성 힌트, 포기, 이미 낸 단어, 정답 후, 요청 중 잠금, 요청 실패, Amplitude |
| `src/utils/board.test.ts` | 31 | 게임판 계산 |
| `src/app/feedback.test.tsx` | 25 | 피드백 입력 규칙, 웹훅 본문, 하루 1회, 닫으면 연 곳으로, 실패, Amplitude |
| `src/utils/date.test.ts` | 14 | KST 날짜, 이전 형식 변환, 자정 경계, 게임 날짜 표시 (기기 타임존 2곳씩) |
| `src/utils/gameRules.test.ts` | 13 | 다음 일반 힌트 순위, 힌트 막힘 경계 |
| `src/hooks/useGameState.events.test.ts` | 12 | Game Started, 플레이 시간 계산 |
| `src/utils/rankTier.test.ts` | 12 | 순위 → 배지 단계 |
| `src/hooks/useGameState.lastPlayedDate.test.ts` | 10 | 저장된 기록의 날짜 판단 (새/이전 형식, 한국·LA) |
| `src/hooks/useGameState.storage.test.ts` | 8 | 깨진 저장값, 구버전 기록, 저장소 예외 |
| `src/utils/progressMarks.test.ts` | 8 | 진행 상황 카드의 지난 기록 말풍선 고르기 |
| `src/components/classic/NewMantleForm/WordList.test.tsx` | 5 | 기록 표 7줄과 더보기, 제목 안 초성, 힌트 표시 |
| `src/utils/korean.test.ts` | 4 | 은/는 조사, 단어 줄이기 |
| `src/utils/notifications.test.ts` | 4 | 최신 공지 안 읽음 판단 |
| `src/app/dev/faults.test.ts` | 3 | 개발용 실패 주입 |
| `src/hooks/useGameDate.test.ts` | 2 | LA 기기에서도 요청 경로가 KST 날짜 |
| `src/app/stats/page.test.tsx` | 2 | 통계 조회 범위(KST), 들어오면 통계 말풍선 닫힘 저장 |
| `src/utils/rankTrack.test.ts` | 2 | 순위 → 게이지 위치 |
| `src/app/notices/page.test.tsx` | 1 | 공지 목록 최신순, 들어오면 읽음 저장 |
| `src/components/stats/StatsCalendar.test.tsx` | 1 | LA 기기에서도 KST 오늘 칸 표시 |

## 남은 후보

### 1. 앱 로직이 없음 (정리함)

테스트 305개 → 296개.

- `page.test.tsx`: 결과창을 X·ESC·바깥 클릭으로 닫기 3개 삭제 (Radix 동작). 첫 방문 모달을 닫으면 확인 여부 저장, 닫으면 입력창으로 포커스가 가지 않음은 각각 3개 → X로 닫기 1개 (세 방법이 같은 `onOpenChange` 경로)
- `feedback.test.tsx`: 엔터 줄바꿈(textarea 기본 동작), 500자 제한(`maxLength` 속성뿐) 삭제

### 2. 로직으로 옮길 수 있음

| 화면 테스트 | 옮길 곳 | 확인한 사실 |
| --- | --- | --- |
| `notices/page.test.tsx` 공지 목록 최신순 | `notifications.test.ts`에서 `sortNotifications` 확인 | `sortNotifications`는 테스트가 없고, 화면 테스트가 같은 정렬을 테스트 안에서 다시 구현해 기대값으로 씀 |
| `page.test.tsx` 말풍선 순서 (모달 → 입력창 말풍선 → 헤더 말풍선, 로그인/비로그인, 기존 유저) | 표시 판단을 순수 함수로 빼서 확인 | 판단이 `page.tsx`(두 줄), `useInputTooltip`(기존 유저 판단), `AuthButton`·`StatsLink`(각자 조건)에 흩어져 있어 리팩터링이 필요함 |
| `page.test.tsx` 결과창이 열리면 헤더 로그인 강조, 기존 로그인 말풍선은 숨김 | 위 함수에 포함 | 조건은 `AuthButton`의 `tooltipVisible`·`spotlightVisible` 두 줄 |

### 3. 같은 규칙을 여러 곳에서 확인

| 규칙 | 확인하는 곳 | 판단 |
| --- | --- | --- |
| 최고 순위 20 이내면 일반 힌트 막힘 | `gameRules.test.ts`(판단 함수), `useGameState.test.ts`(요청 안 감), `NewMantleForm.test.tsx`(버튼 비활성) | 화면은 "버튼에 반영"이라 규칙상 유지. 겹치는 건 utils와 훅인데, 훅은 "요청이 안 간다"는 다른 결과를 확인하므로 둘 다 둬도 됨 |
| 힌트 응답 전 다시 눌러도 요청 1회 | `useGameState.test.ts`, `NewMantleForm.test.tsx`(버튼 비활성 + 요청 횟수) | 화면 테스트에서 요청 횟수 확인은 빼고 버튼 비활성·재활성만 보면 됨 |
| 최신 공지 안 읽음이면 배너 | `notifications.test.ts`(판단 4개), `page.test.tsx`(배너 있음/없음 2개) | 화면은 연결 확인 1개면 충분. "들어오기만 해서는 읽음 저장 안 함", "X로 닫으면 저장"은 화면에만 있으므로 유지 |
| 기기가 LA여도 KST 오늘 기준 | `date.test.ts`(`getKSTToday`), `stats/page.test.tsx`(조회 범위), `StatsCalendar.test.tsx`(오늘 칸) | 유지하기로 함. 화면 두 곳은 컴포넌트가 `getKSTToday`를 쓰는지 확인하는 역할 (지우면 다른 날짜 함수로 바꿔도 못 잡음) |

### 4. 가치가 낮음

| 위치 | 테스트 | 확인한 사실 |
| --- | --- | --- |
| `rankTier.test.ts` | 1단계 경계가 힌트 한계 순위와 같음 | 같은 파일의 20위·21위 경계 확인과 겹침. 두 상수가 같이 움직여야 한다는 의도를 남기는 정도 |
| `dev/faults.test.ts` | 개발용 실패 주입 3개 | 실서비스 기능이 아님. 개발 도구를 계속 쓸 거면 유지 |

### 5. 구조 메모

- `src/utils/rankTrack.ts` 머리 주석은 "끝점 계산은 뺐다"고 하지만 `TRACK_END_POSITION`(끝점 위치)은 남아 있고 `ProgressCard`가 정답 자리에 씀. 주석을 "끝점 표시"로 고쳐야 함. 테스트 제목은 현재 코드와 맞음
- `NewMantleForm.test.tsx`(50개)는 버튼·확인 창·임시 줄·실패 알림·진행 상황 카드가 한 파일에 섞여 있음. 나누면 중복을 찾기 쉬움

## 처음 점검에서 사실과 달랐던 것

- **게임 날짜 표시 테스트를 "로직 한 줄"이라 함:** 실제로는 기기 타임존(서울·LA)마다 요일이 밀리지 않는지 확인하는 테스트. 구현이 UTC 기준으로 요일을 구하는 이유가 이것이라 유지
- **500자 제한을 "한 줄 로직, 로직 테스트로 충분"이라 함:** 잘라내는 코드가 없고 `maxLength` 속성뿐이라 확인할 앱 로직이 없음
- **공백만이면 보내기 비활성을 "입력 컴포넌트 기본 동작"이라 함:** `useFeedback`이 `trim()`으로 판단하는 앱 로직. 유지
- **공지 페이지 테스트를 "읽음 판단 중복"이라 함:** 실제로는 정렬과 읽음 저장을 확인하고, 읽음 판단은 확인하지 않음
- **결과창 자동 표시가 훅에서도 확인된다고 함:** 훅 테스트는 토스트 없음·축하 효과만 확인. 자동 표시(0.7초 뒤 열기)는 `NewMantleForm/index.tsx`에 있고 화면 테스트에서만 확인하므로 중복 아님
- **포기 후 정답 제출이 화면에서도 확인된다고 함:** 화면 테스트에 그런 테스트가 없었음 (정리 전에도 없음)
- **진행 상황 카드의 지난 기록 말풍선이 화면에서도 확인된다고 함:** 화면 테스트에 없었음. `progressMarks.test.ts`에서만 확인
- **일반 힌트 막힘 화면 테스트를 지우라고 함:** 버튼 비활성 확인은 CLAUDE.md가 허용하는 "버튼에 반영" 확인이라 유지
- **훅의 요청 중 잠금 테스트를 9개처럼 적음:** 실제 4개
- **개수를 `it` 줄 수로 셈:** `it.each`를 펼치면 개수가 다름 (예: `date.test.ts` 7 → 14, `gameRules.test.ts` 5 → 13)
