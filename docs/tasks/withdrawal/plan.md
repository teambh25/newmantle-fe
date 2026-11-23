# 회원 탈퇴 (계획)

로그인한 유저가 직접 계정과 기록을 지울 수 있게 한다. 개인정보처리방침(`docs/todo/privacy-terms.md`)의 보유 기간·파기 방법이 이 결정을 따른다.

---

## 1. 현재 상태

- 탈퇴 UI·로직 없음. 로그아웃만 있음 (`src/components/AuthButton.tsx`, `supabase.auth.signOut()` 후 새로고침)
- `src/app/auth/actions.ts`에 서버 액션 `signOut`이 있지만 쓰는 곳 없음
- 백엔드 API(`docs/api/openapi.json`)에 사용자 삭제 엔드포인트 없음. DELETE는 관리자용 2개뿐
- `POST /admin/stats/flush`가 있음 → 통계가 버퍼(캐시)에 쌓였다가 DB로 옮겨지는 구조로 보임. 탈퇴 시 양쪽 다 지워야 함 (백엔드 확인)
- Supabase 프로젝트 쪽 SQL·마이그레이션은 이 저장소에 없음 → `profiles`의 FK·RLS는 대시보드에서 확인 필요

### 1-1. 유저 한 명에 대해 남아 있는 데이터

| 데이터 | 위치 | 키 |
| --- | --- | --- |
| Google 이름·사진·이메일 | Supabase `auth.users` (+ `auth.identities`) | user id |
| 닉네임 | Supabase `profiles` | `id` = user id |
| 게임 통계 | 백엔드 (버퍼 + DB) | user id. 일별 상세는 7일 후 자동 삭제, Overview(캘린더·요약)는 영구 → 탈퇴 시 지울 대상은 주로 Overview (`docs/api/stats.md`) |
| 로그인 전 기록 (연결된 게스트) | 백엔드 | `POST /v2/stats/link` 시 user id로 옮겨지고 guest id 기록은 즉시 삭제 (확인됨). 연동 안 된 게스트 기록은 7일 후 자동 삭제 |
| 추측한 단어 | 백엔드 서버 로그 | 보관 기간·키 확인 필요 |
| 피드백 | Supabase `feedback` (피드백 마이그레이션 이후) | `user_type = 'user'`, `subject_id` = user id. 게스트 id와 같은 컬럼이라 `auth.users` FK(cascade) 불가 → 탈퇴 로직에서 직접 처리 |
| 이용 행태 | Amplitude | `setUserId(user.id)` |
| 로그인 세션 | 브라우저 쿠키 | |
| 기기 데이터 | localStorage `newmantle_guest_id`, `newmantle_game_data`, `newmantle_pending_link` | |
| 기기 설정 (개인정보 아님) | localStorage `newmantle-ui-theme`, `newmantle_last_notification_check`, `login-tooltip-dismissed` | |
| 도전장 링크 | 이미 공유된 URL의 `sharer_id` = user id | 회수 불가. 탈퇴 후 조회 시 실패 처리만 |

---

## 2. Supabase Auth만으로 되나?

**계정 삭제는 Supabase로 하지만, 브라우저에서 바로는 못 한다.**

- 유저가 자기 계정을 지우는 클라이언트 API는 없음. `supabase.auth.admin.deleteUser(userId)`만 있고, 이건 **service_role 키**가 필요 → 서버에서만 호출 (키가 브라우저로 나가면 모든 유저를 지울 수 있음)
- `auth.users`를 지워도 **백엔드 게임 통계와 Amplitude 데이터는 안 지워짐**. `profiles`도 FK가 `on delete cascade`일 때만 같이 지워짐
- 그래서 "누가 service_role 키를 들고 전체 삭제를 순서대로 하느냐"를 정해야 함

### 2-1. 방법 비교

| | A. 백엔드 `DELETE /v2/users/me` (추천) | B. Next.js 서버 액션 | C. Supabase RPC (`security definer` 함수) |
| --- | --- | --- | --- |
| 흐름 | 프론트 → 백엔드(JWT 검증) → 통계 삭제 → Supabase admin으로 계정 삭제 | 서버 액션에서 세션 확인 → 백엔드에 통계 삭제 요청 → admin으로 계정 삭제 | 클라이언트가 `rpc('delete_user')` → DB 함수가 `auth.users` 삭제 |
| service_role 키 | 백엔드에만 | 프론트 배포 환경(Vercel 등)에 추가 | 필요 없음 |
| 백엔드 작업 | 엔드포인트 1개 (삭제 전부) | 통계 삭제 엔드포인트 1개 | 통계 삭제 엔드포인트 1개 |
| 순서·재시도 | 한 곳에서 관리 | 프론트 서버에서 관리 | 두 곳으로 나뉨 (통계 먼저 지우고 RPC) |
| 단점 | 백엔드가 Supabase admin SDK/API 사용 | 프론트에 비밀 키가 생김 | DB 함수로 auth 스키마를 직접 건드림, 통계는 따로 |

추천 A 이유: 백엔드가 이미 Supabase JWT를 검증하고 통계를 갖고 있음. 비밀 키를 한 곳에 두고, 삭제 순서를 한 곳에서 보장할 수 있음.

### 2-2. 삭제 순서 (A 기준)

1. JWT 검증 → user id 확정
2. 게임 통계 삭제: user id 기준, 버퍼와 DB(Overview 포함) 모두. 연결됐던 guest id 기록은 link 시 이미 삭제됨
3. `profiles` 행 삭제 (cascade면 생략)
4. `auth.admin.deleteUser(userId)` — **마지막**. 앞 단계가 실패하면 계정이 남아 있어 유저가 다시 시도할 수 있음
5. 204 응답. 이미 없는 유저면 204 (멱등)

- 탈퇴 후에도 이미 발급된 access token은 만료 전까지(기본 1시간) 서명상 유효함 → 백엔드는 삭제된 user id의 요청을 거부하거나 통계를 새로 만들지 않아야 함. 프론트는 탈퇴 직후 바로 로그아웃
- 진행 중인 게임 요청과 겹치면 통계가 다시 생길 수 있음 → 위 거부 처리로 막음

---

## 3. 프론트 동작

1. 진입점에서 "회원 탈퇴" 클릭
2. 확인 창: 지워지는 것(계정, 닉네임, 모든 게임 기록), 되돌릴 수 없음, 같은 Google 계정으로 다시 가입하면 새 계정으로 시작
3. 확인 → `DELETE /v2/users/me` (Bearer)
4. 성공 시
   - `supabase.auth.signOut()`
   - localStorage `newmantle_guest_id`, `newmantle_game_data`, `newmantle_pending_link` 삭제 (게스트 id가 남으면 탈퇴 후 플레이가 옛 기록과 이어짐)
   - Amplitude `reset()` (user id·device id 초기화)
   - 메인으로 이동 + 완료 안내
5. 실패 시 계정 유지, 에러 안내, 다시 시도 가능

- 도전장: 탈퇴한 유저의 링크로 `GET /v2/stats/user/{id}/{date}` 조회가 실패해도 화면이 깨지지 않는지 확인

---

## 4. 백엔드에 요청할 것

- [ ] `DELETE /v2/users/me` (Bearer 필수, 게스트 불가, 204, 멱등) — 2-2 순서대로
- [x] link 이후 게스트 기록이 어디에 남는지 → user id로 옮겨지고 guest 기록은 즉시 삭제
- [ ] 통계 버퍼(flush 전)도 지우는지
- [ ] 삭제된 user id의 이후 요청 처리 (거부 / 기록 안 함)
- [ ] 서버 로그(추측한 단어 포함)·백업에 남는 기간, 로그에 user id가 남는지 (처리방침 기재용, 탈퇴 시 로그도 지울지)
- [ ] (선택) Amplitude User Privacy API로 해당 user id 삭제 요청

## 5. Supabase에서 확인할 것

- [ ] `profiles.id` → `auth.users.id` FK와 `on delete cascade` 여부
- [ ] 닉네임 unique 제약: 탈퇴 후 같은 닉네임을 다른 사람이 쓸 수 있게 됨 (괜찮은지)

---

## 6. 결정 필요

- [ ] 삭제 방식: **A 백엔드 엔드포인트(추천)** / B 서버 액션 / C RPC
- [ ] 파기 시점: **즉시 삭제(추천)** vs 유예 기간(예: 30일 후 삭제, 그 사이 로그인하면 복구). 무료 게임이고 법정 보관 의무가 있는 거래 기록이 없어서 즉시 삭제가 단순함
- [ ] Amplitude: 삭제 요청까지 할지 / `reset()`만 하고 처리방침에 "분석 데이터는 가명 상태로 보관 기간 후 삭제"로 쓸지
- [ ] 진입점: 로그아웃 옆(헤더가 좁음) / 설정 메뉴 / `/stats` 하단. 추천: 설정 메뉴 하단에 작게
- [ ] 확인 단계: 확인 창 1번 / 닉네임 입력 후 확인. 추천: 확인 창 1번 (되돌릴 수 없음을 명시)
- [ ] 피드백(Supabase `feedback`) 처리: 행 삭제 / `subject_id`만 `null`로 익명화(본문 유지) / 그대로 둠. 그대로 두면 탈퇴 후에도 식별자가 남아 처리방침과 맞춰야 함
- [ ] 탈퇴 이벤트를 Amplitude에 남길지 (예: `Account Deleted`, user id 제외)
- [ ] excel 테마: 이번엔 classic만 (다른 문서와 동일)

## 7. 검증 후보

`docs/tasks/<task>/verification.md`에 케이스부터 작성 (CLAUDE.md 워크플로)

- 로그인 상태에서만 탈퇴 버튼이 보임
- 확인 창에서 취소하면 요청이 가지 않음
- 확인하면 `DELETE /v2/users/me`가 Bearer 헤더로 전송됨
- 성공 시: 로그아웃 호출, `newmantle_guest_id`·`newmantle_game_data`·`newmantle_pending_link` 삭제, 테마 설정은 유지, Amplitude reset 호출
- 실패 시: 로그아웃 안 함, localStorage 유지, 에러 안내가 보임
- 탈퇴한 유저의 도전장 링크로 들어와도 메인 게임이 정상 렌더링됨
- (fake 서버에 `DELETE /v2/users/me` 추가 필요)
