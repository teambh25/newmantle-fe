// 화면 레벨: 통계 화면의 조회 범위가 KST 오늘 기준인지 (docs/tasks/kst-date-fix/problem.md)
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KST_AFTERNOON, setClock } from "@/test/clock";
import type { StatOverviewResp } from "@/types/stats";
import { amplitudeEvents } from "@/test/gameHarness";
import StatsPage from "./page";

const signOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));

// 통계 화면은 로그인한 사용자만 조회한다. setup.ts의 게스트 대신 로그인 세션을 준다
vi.mock("@/utils/supabase/client", () => {
  const session = { access_token: "test-token", user: { id: "user-1" } };
  return {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session } }),
        getUser: async () => ({ data: { user: session.user } }),
        signOut,
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      // 헤더의 계정 영역이 닉네임을 조회한다
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: { nickname: "tester" } }) }) }),
      }),
    }),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

const OVERVIEW: StatOverviewResp = {
  calendar: [],
  summary: {
    total_success_days: 0,
    current_streak: 0,
    max_streak: 0,
    avg_guess_when_correct: 0,
    avg_hints_when_correct: 0,
  },
};

describe("통계 화면", () => {
  it("기기 로컬 날짜가 KST보다 하루 늦어도(LA 11/9) 조회 범위는 2026-08-12 ~ 2026-11-10", async () => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    const statsUrls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        statsUrls.push(String(input));
        return { ok: true, status: 200, json: async () => OVERVIEW } as Response;
      })
    );

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <StatsPage />
      </QueryClientProvider>
    );

    await waitFor(() => expect(statsUrls.some((u) => u.includes("/v2/stats"))).toBe(true));
    const url = new URL(statsUrls.find((u) => u.includes("/v2/stats"))!, "http://localhost");
    expect(url.searchParams.get("start_date")).toBe("2026-08-12");
    expect(url.searchParams.get("end_date")).toBe("2026-11-10");
  });
});

describe("통계 유도 말풍선", () => {
  it("통계 페이지에 들어가면 stats-tooltip-dismissed 저장", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => OVERVIEW }) as Response)
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <StatsPage />
      </QueryClientProvider>
    );
    await waitFor(() => expect(localStorage.getItem("stats-tooltip-dismissed")).not.toBeNull());
  });
});

describe("통계 페이지 방문", () => {
  it("오늘 보낸 기록이 없을 때 → 통계 페이지를 열고 닫았다 다시 열면 → Stats Page Visited 1회", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => OVERVIEW }) as Response)
    );
    const open = () =>
      render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <StatsPage />
        </QueryClientProvider>
      );

    open().unmount();
    open();
    expect(amplitudeEvents("Stats Page Visited")).toHaveLength(1);
  });
});
