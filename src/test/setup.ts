import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { gameServer } from "./fakeGameServer";
import { feedbackScript } from "./fakeFeedbackScript";

// ---- 외부 의존성 mock ----

// Amplitude SDK: 이벤트 기록만 남긴다
vi.mock("@amplitude/analytics-browser", () => ({
  init: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  setUserId: vi.fn(),
  reset: vi.fn(),
  Identify: class {
    set() {
      return this;
    }
  },
}));

// Sentry SDK: 직접 보고(captureException) 호출만 기록
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

// 축하 효과 라이브러리: 호출 여부만 기록
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Supabase: 로그인하지 않은 게스트
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      // 헤더 로그인 버튼(AuthButton)이 로그인 여부를 본다 (useAuthUser)
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: (table: string) => {
      throw new Error(`setup.ts Supabase mock: ${table} 테이블은 테스트 파일에서 mock한다`);
    },
  }),
}));

// ---- jsdom에 없는 브라우저 API (Radix UI용) ----

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// ---- 테스트마다 초기화 ----

beforeEach(() => {
  // 축하 효과는 setInterval로 3초간 그려진다. 다른 테스트로 새지 않도록 interval만 가짜로 돌린다
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  gameServer.reset();
  feedbackScript.reset();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      return feedbackScript.matches(url) ? feedbackScript.fetch(url, init) : gameServer.fetch(input);
    })
  );
  // 요청 실패 케이스의 console.error 출력 억제
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
