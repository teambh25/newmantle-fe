# Next 15 업그레이드

현재 `next` 14.2.4, `react` 18. Dependabot 알림(GHSA-pc58-hwjq-p385, medium)을 없애려면 Next 15.5.29 이상이 필요하다. 14.x 패치는 없다.

## 왜 급하지 않은가 (2026-11-26 판단)

- 취약점은 self-hosted 앱의 route handler가 외부 응답을 그대로 돌려주고, HTTP/1.1 리버스 프록시 뒤에 있을 때만 해당한다
- route handler는 `src/app/auth/callback/route.ts` 하나뿐이고 redirect만 한다. 게임 API는 브라우저에서 백엔드로 직접 호출한다
- 배포는 Vercel로 추정 (`.github/workflows`, `vercel.json` 없음). self-hosted로 바뀌면 다시 판단한다
- db-perf, feedback migration이 끝난 뒤 별도 브랜치에서 진행한다

## 코드 수정

- [ ] `src/utils/supabase/server.ts`: `cookies()`가 비동기로 바뀜 → `await cookies()`, `createClient`를 async로
- [ ] `createClient` 호출처에 `await` (`src/app/auth/actions.ts`, `src/app/auth/callback/route.ts`)
- [ ] 공식 codemod로 먼저 돌리고 남은 부분 수정 (`npx @next/codemod upgrade`)
- 해당 없음: 서버 컴포넌트의 `params`·`searchParams` 사용 없음, `fetch` 캐시 기본값 변경은 브라우저 호출이라 영향 없음

## 의존성

- [ ] `react`, `react-dom` 19
- [ ] `@types/react`, `@types/react-dom` 19 (`useRef()` 인자 필수 등 타입 에러 정리)
- [ ] `eslint-config-next`를 `next`와 같은 버전으로
- [ ] `lucide-react` 0.400 → React 19 지원 버전으로 (peer 경고)
- [ ] `@sentry/nextjs` 10: Next 15 지원. `instrumentation.ts`가 없어서 서버·edge 설정(`sentry.server.config.ts`, `sentry.edge.config.ts`)이 로드되는지 확인
- 그대로 사용 가능 (React 19 지원): Radix, framer-motion 12, TanStack Query 5, Testing Library 16, `@supabase/ssr`

## 확인할 것

- [ ] `npm test`, `npm run build`, `npm run lint`
- [ ] 로그인 흐름: OAuth callback → 세션 생성 → middleware 세션 갱신 (테스트에서는 Supabase를 mock하므로 직접 확인)
- [ ] Sentry 서버 에러 수집, 소스맵 업로드
- [ ] Vercel preview 배포

## 정할 것

- [ ] 15.5.29에서 멈출지, 그 다음 메이저까지 한 번에 갈지 (진행 시점의 최신 버전과 마이그레이션 내용 확인)
