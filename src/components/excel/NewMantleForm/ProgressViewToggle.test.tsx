// 화면 레벨: excel 방금 입력 자리를 순위 그래프 / 상단바로 전환 (docs/specs/progress-view-toggle Phase 2)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { ANSWER, gameServer } from "@/test/fakeGameServer";

// 메인 화면 헤더·설정 메뉴가 쓰는 Supabase (비로그인)
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

const EXCEL_KEY = "newmantle-excel-progress-view";
const CLASSIC_KEY = "newmantle-progress-view";

const gameInput = () => screen.getByRole("textbox");
const graphSwitch = () => screen.getByRole("switch", { name: "그래프 보기" });
const chart = () => screen.queryByRole("img", { name: "순위 그래프" });
const topBar = () => screen.queryByRole("table", { name: "방금 입력" });
const shareButton = () => screen.queryByRole("button", { name: /링크 복사/ });

beforeEach(() => {
  localStorage.setItem("newmantle-ui-theme", "excel");
});

async function renderExcelHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  await waitFor(() => expect(gameInput()).toBeEnabled());
  await waitFor(() => expect(screen.getByRole("switch", { name: "그래프 보기" })).toBeInTheDocument());
  return { user, ...view };
}

async function submitWord(user: ReturnType<typeof userEvent.setup>, word: string, rank: number) {
  gameServer.setRank(word, rank);
  const before = gameServer.count("guess");
  await user.type(gameInput(), `${word}{Enter}`);
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  await waitFor(() => expect(gameInput()).toBeEnabled());
}

describe("excel 순위 그래프 / 상단바 전환", () => {
  it("처음 들어오면(단어 없음) 그래프와 켜진 스위치 → 끄면 상단바, 다시 켜면 그래프로 돌아오고 매번 저장됨", async () => {
    const { user } = await renderExcelHome();
    expect(chart()).toBeInTheDocument();
    expect(topBar()).not.toBeInTheDocument();
    expect(graphSwitch()).toHaveAttribute("aria-checked", "true");

    await user.click(graphSwitch());

    expect(topBar()).toBeInTheDocument();
    expect(chart()).not.toBeInTheDocument();
    expect(graphSwitch()).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem(EXCEL_KEY)).toBe("bar");

    await user.click(graphSwitch());

    expect(chart()).toBeInTheDocument();
    expect(topBar()).not.toBeInTheDocument();
    expect(graphSwitch()).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(EXCEL_KEY)).toBe("chart");
  });

  it("classic 저장값만 상단바 → excel로 들어오면 그래프", async () => {
    localStorage.setItem(CLASSIC_KEY, "bar");
    await renderExcelHome();
    expect(chart()).toBeInTheDocument();
    expect(topBar()).not.toBeInTheDocument();
    expect(graphSwitch()).toHaveAttribute("aria-checked", "true");
  });

  it("excel 저장값이 상단바 → 처음부터 상단바, 그래프 없음, 스위치 꺼짐", async () => {
    localStorage.setItem(EXCEL_KEY, "bar");
    await renderExcelHome();
    expect(topBar()).toBeInTheDocument();
    expect(chart()).not.toBeInTheDocument();
    expect(graphSwitch()).toHaveAttribute("aria-checked", "false");
  });

  it("상단바, 단어 1개 뒤 힌트 요청 실패 → 상단바 행에 실패 알림", async () => {
    localStorage.setItem(EXCEL_KEY, "bar");
    const { user } = await renderExcelHome();
    await submitWord(user, "사과", 500);
    gameServer.failNext("hint");

    await user.click(screen.getByRole("button", { name: "힌트" }));

    await waitFor(() => expect(within(topBar()!).getByRole("alert")).toBeInTheDocument());
  });

  it("상단바에서 정답을 맞힘 → 결과가 보이고 결과·그래프 탭 없음, 상단바에 정답. 스위치를 켜면 탭이 생기고 결과가 보임", async () => {
    localStorage.setItem(EXCEL_KEY, "bar");
    const { user } = await renderExcelHome();

    await user.type(gameInput(), `${ANSWER.word}{Enter}`);

    await waitFor(() => expect(shareButton()).toBeInTheDocument());
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    // 단어 칸(시도 다음 칸)에 정답 단어
    expect(within(topBar()!).getAllByRole("cell")[1]).toHaveTextContent(ANSWER.word);

    await user.click(graphSwitch());

    expect(screen.getByRole("tab", { name: "결과" })).toHaveAttribute("aria-selected", "true");
    expect(shareButton()).toBeInTheDocument();
    expect(chart()).not.toBeInTheDocument();
  });
});
