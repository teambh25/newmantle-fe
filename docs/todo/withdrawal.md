# 회원 탈퇴 (향후 작업)

로그인한 유저가 직접 계정과 기록(계정·닉네임·게임 통계)을 지우는 탈퇴 기능을 만든다. 개인정보처리방침(`docs/todo/privacy-terms.md`)의 보유 기간, 파기 절차·방법, 탈퇴 방법을 이 기능에 맞춰 확정해야 하므로 처리방침보다 먼저 한다.

## 확정된 결정

- **탈퇴를 처리방침보다 먼저, 별도 작업으로 구현한다** (2026-11-11). 처리방침 문구가 탈퇴 구현(삭제 범위, 파기 시점, 진입점)에 달려 있기 때문이다. 처리방침을 먼저 공개하면 공개 직후 문구를 다시 고쳐야 한다.
- **검증 케이스는 이 문서 안에 둔다.** 별도 `verification.md`는 쓰지 않는다 (2026-11-13). 케이스 ID를 붙이는 방식은 구현 시작할 때 정한다.

## 배경

- 지금은 탈퇴 UI·로직이 없고 로그아웃만 있다 (`src/components/AuthButton.tsx`). `src/app/auth/actions.ts`의 서버 액션 `signOut`은 쓰는 곳이 없다.
- 백엔드 API(`docs/api/openapi.json`)에 유저 삭제 엔드포인트가 없다. DELETE는 관리자용 2개뿐이다.
- Supabase 클라이언트에는 유저가 자기 계정을 지우는 API가 없다. `auth.admin.deleteUser`는 service_role 키가 필요하므로 서버에서만 호출한다. 키가 브라우저로 나가면 안 된다.
- `auth.users`를 지워도 백엔드 게임 통계와 Amplitude 데이터는 지워지지 않는다. `profiles`는 FK가 `on delete cascade`일 때만 같이 지워진다.
- 탈퇴 후에도 이미 발급된 access token은 만료 전까지(기본 1시간) 유효하다. 삭제된 user id로 들어온 요청이 통계를 다시 만들면 안 된다.
- 이미 공유된 도전장 URL의 `sharer_id`(= user id)는 회수할 수 없다.
- 처리방침 초안은 "회원 정보·Overview 통계: 탈퇴 시 지체 없이 파기"로 되어 있다. 파기 시점을 바꾸면 처리방침 문구도 같이 바뀐다.
- 처리방침에 삭제 요청 창구 이메일을 적을 예정이므로, 이메일로 들어온 요청도 처리할 수 있어야 한다.
- 법률 검토를 받은 문서가 아니다. 처리방침 공개 전에 확인을 권장한다 (`privacy-terms.md` 2-2).

참고: 수집 정보 표 `docs/todo/privacy-terms.md` 1-1, 보관 기간 `docs/api/stats.md`, 테스트 하네스 `src/test/README.md`.

### 유저 한 명에 대해 남아 있는 데이터

| 데이터 | 위치 | 탈퇴 시 처리 |
| --- | --- | --- |
| Google 이름·사진·이메일 | Supabase `auth.users` (+ `auth.identities`) | 계정 삭제 |
| 닉네임 | Supabase `profiles` | 삭제 (cascade 여부 확인) |
| 게임 통계 | 백엔드 (버퍼 + DB) | 삭제. 일별 상세는 7일 후 자동 삭제되므로 주로 Overview가 대상 |
| 로그인 전 기록 (연결된 게스트) | 백엔드 | link 시 user id로 옮겨지고 guest id 기록은 즉시 삭제됨 (확인됨). 연동 안 된 게스트 기록은 7일 후 자동 삭제 |
| 추측한 단어 | 백엔드 서버 로그 | 보관 기간·키 확인 후 결정 |
| 이용 행태 | Amplitude (`setUserId(user.id)`) | 결정 대기 |
| 피드백 본문 | Amplitude `Feedback Submitted` 이벤트 | Amplitude 결정을 따름 |
| 피드백 본문 | Make.com 웹훅 (EU) → 이후 경로 미확인 | user id 포함 여부 확인, 결정 대기 |
| 로그인 세션 | 브라우저 쿠키 | `signOut()` |
| 기기 데이터 | localStorage `newmantle_guest_id`, `newmantle_game_data`, `newmantle_pending_link` | 삭제 |
| 기기 설정 (개인정보 아님) | localStorage `newmantle-ui-theme`, `newmantle_last_notification_check`, `login-tooltip-dismissed` | 유지 |
| 도전장 링크 | 공유된 URL의 `sharer_id` | 회수 불가. 탈퇴 후 조회 실패를 화면이 견디게만 한다 |

## 범위

- 포함
  - 탈퇴 진입점, 확인 창, 탈퇴 요청과 성공·실패 처리 (classic 테마)
  - 탈퇴 성공 후 기기 정리: 로그아웃, localStorage 게임 데이터 삭제, Amplitude `reset()`
  - 백엔드에 삭제 엔드포인트와 삭제 순서를 요청하고, 받은 스펙을 `docs/api/`에 반영
  - 탈퇴한 유저의 도전장 링크로 들어와도 화면이 깨지지 않게 하기
  - 처리방침 작업에 넘길 값(보유 기간, 파기 방법, 탈퇴 경로) 정리
- 제외
  - 개인정보처리방침·이용약관 페이지 작성 (`docs/todo/privacy-terms.md`)
  - 로그인 화면 동의 문구, 푸터 링크 변경 (처리방침 작업 범위)
  - 백엔드 엔드포인트 구현 (백엔드에 요청만 한다)
  - `sharer_id` 노출 방식 변경 (`docs/todo/share.md`)
  - 탈퇴 사유 설문
  - 로그아웃 동작 변경, 안 쓰는 `signOut` 서버 액션 정리

## 정해야 할 것

1. **삭제 방식** (추천: A)
   - A. 백엔드 `DELETE /v2/users/me`: 프론트 → 백엔드(JWT 검증) → 통계 삭제 → Supabase admin으로 계정 삭제. service_role 키는 백엔드에만 있고, 순서·재시도를 한 곳에서 관리한다. 백엔드 작업은 엔드포인트 1개다. 단점은 백엔드가 Supabase admin을 쓴다는 점.
   - B. Next.js 서버 액션: 세션 확인 → 백엔드에 통계 삭제 요청 → admin으로 계정 삭제. 프론트 배포 환경에 비밀 키가 생긴다.
   - C. Supabase RPC (`security definer` 함수): 클라이언트가 `rpc('delete_user')`로 호출. 키는 필요 없지만 auth 스키마를 DB 함수로 직접 건드리고, 통계 삭제는 따로 두어야 해서 순서·재시도가 두 곳으로 나뉜다.
   - A를 고르면 삭제 순서: ① JWT 검증 → user id 확정 ② 게임 통계 삭제(버퍼 + DB, Overview 포함) ③ `profiles` 삭제 (cascade면 생략) ④ `auth.admin.deleteUser` — **마지막**. 앞 단계가 실패하면 계정이 남아 다시 시도할 수 있다 ⑤ 204. 이미 없는 유저도 204 (멱등).
2. **파기 시점**: 즉시 삭제 (추천) / 유예 기간 (예: 30일, 그 사이 로그인하면 복구). 무료 게임이고 법정 보관 의무가 있는 거래 기록이 없다. 처리방침 초안과도 맞는다.
3. **Amplitude**: 삭제 요청(User Privacy API)까지 / `reset()`만 하고 처리방침에 "분석 데이터는 가명 상태로 보관 기간 후 삭제"로 쓴다. 피드백 본문이 이벤트에 들어 있다는 점도 함께 본다.
4. **진입점**: 로그아웃 옆 (헤더가 좁음) / 설정 메뉴 / `/stats` 하단. 추천: 설정 메뉴 하단에 작게. 처리방침의 "탈퇴 방법" 문구가 이 위치를 따른다.
5. **확인 단계**: 확인 창 1번 / 닉네임 입력 후 확인. 추천: 확인 창 1번 (되돌릴 수 없음을 명시).
6. **탈퇴 이벤트**: Amplitude에 남길지 (예: `Account Deleted`, user id 제외). `docs/specs/amplitude-migration`의 예산(1인 하루 약 7개) 안이다.
7. **테마**: classic만 (처리방침 작업과 동일) / excel도 같이.
8. **이메일 삭제 요청 처리**: 운영자가 특정 유저를 지울 경로가 필요하다. 관리자용 삭제 엔드포인트를 같이 요청 / 당분간 수동(DB·대시보드)으로 처리.

## 백엔드·Supabase에서 확인할 것

백엔드에 요청·확인
- [ ] 삭제 엔드포인트 (결정 1에 따라 형태가 정해짐. A면 `DELETE /v2/users/me`, Bearer 필수, 게스트 불가, 204, 멱등)
- [x] link 이후 게스트 기록 위치: user id로 옮겨지고 guest 기록은 즉시 삭제
- [ ] flush 전 통계 버퍼도 지우는지 (`POST /admin/stats/flush`가 있어 버퍼 → DB 구조로 보임)
- [ ] 삭제된 user id의 이후 요청 처리 (거부 / 기록 안 함)
- [ ] 서버 로그(추측한 단어 포함)·백업의 보관 기간, 로그에 user id·IP가 남는지
- [ ] 백엔드 서버 업체·위치 (처리방침 위탁·국외 이전 기재용, `privacy-terms.md`와 공유)

Supabase 대시보드에서 확인 (SQL·마이그레이션이 이 저장소에 없음)
- [ ] `profiles.id` → `auth.users.id` FK와 `on delete cascade` 여부
- [ ] 닉네임 unique 제약: 탈퇴 후 같은 닉네임을 다른 사람이 쓸 수 있게 되는데 괜찮은지

기타
- [ ] Make.com 시나리오가 피드백을 어디로 넘기는지, user id가 같이 가는지

## 검증 케이스 후보

프론트는 서버에 보낸 요청, 화면에 보이는 것, localStorage 값, Amplitude 호출로 확인한다. 백엔드의 실제 삭제는 배포 후 확인한다.

- 로그인 상태에서만 탈퇴 버튼이 보인다
- 확인 창에서 취소하면 요청이 가지 않는다
- 확인하면 삭제 요청이 Bearer 헤더로 전송된다 (게스트 헤더 없음)
- 성공 시: 로그아웃 호출, `newmantle_guest_id`·`newmantle_game_data`·`newmantle_pending_link` 삭제, 테마 설정은 유지, Amplitude `reset()` 호출
- 실패 시: 로그아웃 안 함, localStorage 유지, 에러 안내가 보이고 다시 시도할 수 있다
- 탈퇴한 유저의 도전장 링크(`GET /v2/stats/user/{id}/{date}` 실패)로 들어와도 메인 게임이 정상 렌더링된다
- 화면 확인 (수동): 진입점 위치, 확인 창 모양, 실제 기기에서의 동작

## 진행 단계

1. **남은 결정 확정**: 위 "정해야 할 것"을 결정하고 결정 기록을 남긴다. [ ] 대기
2. **백엔드·Supabase 확인과 요청**: 위 확인 항목에 결과를 적고, 삭제 엔드포인트 스펙(경로, 인증, 응답 코드, 멱등 여부)을 `docs/api/`에 반영한다. [ ] 대기
3. **검증 케이스 작성과 실패 확인 (TDD)**: 케이스를 확정하고, fake 서버에 삭제 엔드포인트를 추가한 뒤, 기능 부재 때문에 테스트가 실패하는 것을 확인한다. [ ] 대기
4. **프론트 구현**: 케이스와 기존 테스트 통과, `npm run lint`, `npm run build` 통과. [ ] 대기
5. **배포 후 확인**: 테스트 계정으로 탈퇴한 뒤 Supabase `auth.users`·`profiles`에 행이 없고 백엔드 통계 조회 결과가 비어 있는지 본다. 같은 Google 계정으로 다시 로그인하면 새 계정으로 시작하는지(닉네임 설정 창), 탈퇴한 계정의 도전장 링크로 들어가도 메인 게임이 보이는지 확인한다. [ ] 대기
6. **처리방침 작업에 넘기기**: `docs/todo/privacy-terms.md` 2-1의 보유 기간, 파기 절차·방법, 탈퇴 방법에 채울 값을 이 문서에 정리한다 (서버 로그 보관 기간 포함). [ ] 대기

## 용어

- **service_role 키**: Supabase의 관리자 키. RLS를 무시하고 모든 유저를 지울 수 있어 서버에만 둔다.
- **Overview**: 회원의 캘린더·요약 통계. 일별 상세(7일 후 자동 삭제)와 달리 영구 보관된다 (`docs/api/stats.md`).
- **link (게스트 연결)**: 로그인 전 게스트 기록을 `POST /v2/stats/link`로 회원 기록에 옮기는 것.
- **버퍼 / flush**: 통계가 먼저 캐시에 쌓였다가 DB로 옮겨지는 구조. `POST /admin/stats/flush`로 옮긴다.
- **도전장 링크 / `sharer_id`**: 공유 URL에 들어가는 공유자 id. 로그인 유저면 Supabase user id다.
- **멱등**: 같은 요청을 여러 번 보내도 결과가 같다. 이미 지워진 유저의 삭제 요청도 성공(204)으로 응답한다.
- **파기**: 개인정보를 복구할 수 없게 지우는 것. 처리방침에 절차·방법을 적어야 한다.

## 나중에 할 것 (백로그)

- excel 테마 탈퇴 진입점 (결정 7에서 classic만으로 정하면 이동)
- 관리자용 특정 유저 삭제 경로 (결정 8에서 수동 처리로 정하면 이동)
- 서버 로그의 user id 기록 삭제 (확인 결과에 따라)
