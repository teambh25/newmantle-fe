import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { gameServer } from "./fakeGameServer";

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

// 축하 효과 라이브러리: 호출 여부만 기록
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Supabase: 로그인하지 않은 게스트
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
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
  vi.stubGlobal("fetch", vi.fn(gameServer.fetch));
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
