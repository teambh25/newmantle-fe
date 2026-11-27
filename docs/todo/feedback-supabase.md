# 피드백 Supabase 이전 (보류)

피드백은 지금 Google 시트에 Apps Script로 적는다 (`docs/specs/feedback-migration`). Supabase 테이블로 옮기는 안은 보류했다 (2026-11-27).

## 보류한 이유

- Supabase가 메모리 부족으로 최적화 중이다 (`docs/specs/db-perf/plan.md`)
- 피드백을 어떻게 쓸지(유사도 평가 데이터 만들기 등)가 아직 구체적이지 않다. 쓰임새가 정해진 뒤 그에 맞는 스키마로 만든다

## 다시 꺼낼 때

- Supabase 메모리 문제가 정리됐는지 먼저 본다
- 시트에 쌓인 행은 CSV로 새 테이블에 옮긴다
- 브라우저에서 anon key로 직접 insert한다면 놓치기 쉬운 것
  - SQL로 만든 테이블은 RLS가 자동으로 켜지지 않는다
  - RLS는 컬럼을 막지 않는다. 클라이언트가 채우는 컬럼에만 insert 권한을 준다
  - Database Webhooks는 payload 형식이 고정이라 디스코드로 바로 보낼 수 없다
