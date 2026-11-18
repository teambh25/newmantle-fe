// 화면 레벨: excel 보기 방식 말풍선 (docs/specs/progress-view-toggle Phase 3, Dec-27~40)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

// 메인 화면은 헤더 로그인 버튼·설정 메뉴(getUser, profiles 조회, signOut)와 닉네임 설정 창(getSession)이 Supabase를 쓴다. 비로그인
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null }) }),
      }),
    }),
  }),
}));

const viewTooltip = () => screen.queryByRole("button", { name: "보기 방식 안내" });
const loginTooltip = () => screen.queryByRole("button", { name: "로그인 안내 닫기" });
const chartSwitch = () => screen.getByRole("switch", { name: "그래프 보기" });

async function renderExcelHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
  await waitFor(() => expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument());
  await waitFor(() => expect(chartSwitch()).toBeInTheDocument());
  return { user, ...view };
}

beforeEach(() => {
  localStorage.setItem("newmantle-ui-theme", "excel");
});

describe("excel 보기 방식 말풍선", () => {
  it("들어오면 보기 방식 말풍선만 보이고, X를 누르면 사라지며 로그인 말풍선이 보이고, 새로고침하면 보기 방식 말풍선이 없음", async () => {
    const { user, unmount } = await renderExcelHome();
    expect(await screen.findByRole("button", { name: "보기 방식 안내" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "보기 방식 안내 닫기" }));
    await waitFor(() => expect(viewTooltip()).not.toBeInTheDocument());
    expect(loginTooltip()).toBeInTheDocument();

    unmount();
    await renderExcelHome();
    expect(viewTooltip()).not.toBeInTheDocument();
  });

  it("스위치를 끄면 말풍선이 사라지고 상단바로 바뀜", async () => {
    const { user } = await renderExcelHome();
    await screen.findByRole("button", { name: "보기 방식 안내" });

    await user.click(chartSwitch());
    await waitFor(() => expect(viewTooltip()).not.toBeInTheDocument());
    expect(chartSwitch()).toHaveAttribute("aria-checked", "false");
  });
});
