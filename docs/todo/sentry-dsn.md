# Sentry DSN을 `.env`로 옮기기

Sentry DSN이 코드 세 곳에 직접 들어가 있다. 다른 공개 설정(게임 API 주소, Supabase URL, Amplitude 키, 피드백 웹앱 주소)처럼 커밋된 `.env`로 모은다.

## 지금 상태 (2026-11-27)

- `src/instrumentation-client.ts` (브라우저), `sentry.server.config.ts` (서버), `sentry.edge.config.ts` (edge)의 `Sentry.init({ dsn })`에 같은 DSN 문자열
- 세 곳 모두 `sendDefaultPii: true`
- `.env.sentry-build-plugin`(빌드용 인증 토큰)은 git이 추적하지 않는다. 계속 커밋하지 않는다

## 할 일

- [ ] `.env`에 `NEXT_PUBLIC_SENTRY_DSN` 추가, 세 파일이 그 값을 읽게 바꾸기
- [ ] 서버·edge 설정이 빌드·실행 시 값을 읽는지 확인 (`npm run build` 뒤 서버 오류가 Sentry에 들어오는지)
- [ ] 값이 없을 때 동작 정하기 (개발 중 Sentry를 끄고 싶으면 `.env.local`에서 비우기 등)

## 참고

- DSN은 브라우저 번들에 들어가는 공개 값이라 보안 문제는 아니다. 관리 위치를 한곳으로 모으는 정리다
- 피드백 전송 실패는 `FeedbackSendError`, `feature: feedback` 태그로 보고된다 (`src/hooks/useFeedback.ts`, `docs/specs/feedback-migration` Dec-4)
