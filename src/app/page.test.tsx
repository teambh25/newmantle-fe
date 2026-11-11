// 화면 레벨: 메인 화면의 첫 방문 모달과 규칙 진입점 (docs/tasks/rule/verification.md M, N)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";

// 로그인 여부를 케이스마다 바꾼다 (기본: 비로그인)
const auth = vi.hoisted(() => ({ user: null as null | { id: string; email: string } }));

const signOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));

// 메인 화면은 헤더 로그인 버튼·설정 메뉴(getUser, profiles 조회, signOut)와 닉네임 설정 창(getSession)이 Supabase를 쓴다
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: auth.user } }),
      signOut,
      getSession: async () => ({
        data: { session: auth.user ? { access_token: "test-token", user: auth.user } : null },
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    // 로그인 유저는 닉네임이 있어 닉네임 설정 창이 열리지 않는다
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { nickname: "tester" } }) }), // = NICKNAME
      }),
    }),
  }),
}));

const NICKNAME = "tester";
const MODAL_SEEN_KEY = "newmantle_rule_modal_seen";
const TOOLTIP_DISMISSED_KEY = "login-tooltip-dismissed";

type User = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  auth.user = null;
});

/** 메인을 렌더링하고, 헤더(로그인 버튼)와 게임 입력창이 준비될 때까지 기다린다 */
async function renderHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  // 게임 입력창(모달이 열려 있으면 aria-hidden)이 게임 날짜가 정해져 활성화될 때까지
  await waitFor(() => {
    const textboxes = screen.getAllByRole("textbox", { hidden: true });
    textboxes.forEach((t) => expect(t).toBeEnabled());
  });
  // 헤더 계정 영역: 비로그인은 로그인 링크, 로그인은 닉네임
  await waitFor(() =>
    expect(
      screen.queryAllByRole("link", { name: "로그인", hidden: true }).length +
        screen.queryAllByText(new RegExp(NICKNAME)).length
    ).toBeGreaterThan(0)
  );
  return { user, ...view };
}

const dialog = () => screen.queryByRole("dialog");
/** 로그인 안내 말풍선 (모달이 열리면 바깥 요소가 aria-hidden 되므로 hidden 포함해서 찾는다) */
const loginTooltip = () =>
  screen.queryByRole("button", { name: "로그인 안내 닫기", hidden: true });

async function closeWithX(user: User) {
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: /close/i }));
  await waitFor(() => expect(dialog()).not.toBeInTheDocument());
}

/** 새로고침: 다시 렌더링 (localStorage는 유지) */
async function reload(unmount: () => void) {
  unmount();
  return renderHome();
}

describe("첫 방문 안내 모달", () => {
  it("M-1-1: 첫 방문 시 안내 모달이 열림", async () => {
    await renderHome();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("M-1-2: 모달을 닫고 새로고침하면 다시 열리지 않음", async () => {
    const { user, unmount } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);

    await reload(unmount);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("M-1-3: 이미 본 유저는 모달이 열리지 않음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    await renderHome();
    expect(dialog()).not.toBeInTheDocument();
  });

  it("M-2-1: 게임 기록이 있는 기존 유저도 확인 여부가 없으면 한 번 열림", async () => {
    localStorage.setItem(
      "newmantle_game_data",
      JSON.stringify({ submittedWords: [], attempts: 0, lastPlayedDate: "2000-01-01" })
    );
    await renderHome();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("M-3-1: 모달 안에 /rule 링크가 있음", async () => {
    await renderHome();
    const d = await screen.findByRole("dialog");
    const ruleLinks = within(d)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/rule");
    expect(ruleLinks.length).toBeGreaterThan(0);
  });

  it("M-4-1: X 버튼으로 닫으면 확인 여부가 저장됨", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(localStorage.getItem(MODAL_SEEN_KEY)).not.toBeNull();
  });

  it("M-4-2: ESC로 닫으면 확인 여부가 저장됨", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(localStorage.getItem(MODAL_SEEN_KEY)).not.toBeNull();
  });

  it("M-4-3: 바깥을 클릭해 닫으면 확인 여부가 저장됨", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    // 모달 바깥(오버레이)은 클릭 시 Radix가 pointerdown으로 닫는다
    await user.click(document.body);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(localStorage.getItem(MODAL_SEEN_KEY)).not.toBeNull();
  });

  it("M-5-1: excel 테마에서는 모달이 열리지 않음", async () => {
    localStorage.setItem("newmantle-ui-theme", "excel");
    await renderHome();
    expect(dialog()).not.toBeInTheDocument();
  });

  it("M-6-1: 비로그인 첫 방문 시 모달이 열려 있는 동안 로그인 말풍선이 없고, 닫은 뒤 보임", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    expect(loginTooltip()).not.toBeInTheDocument();

    await closeWithX(user);
    expect(loginTooltip()).toBeInTheDocument();
  });

  it("M-6-2: 로그인 말풍선을 이미 닫은 유저는 모달을 닫아도 말풍선이 없음", async () => {
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("M-6-3: 로그인 유저도 첫 방문이면 모달이 열리고, 말풍선은 없음", async () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(loginTooltip()).not.toBeInTheDocument();
  });
});

describe("규칙 진입점", () => {
  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  it("N-1-1: 헤더에 /rule로 가는 규칙 링크가 있음", async () => {
    await renderHome();
    expect(screen.getByRole("link", { name: "게임 규칙" })).toHaveAttribute("href", "/rule");
  });

  it("N-2-1: 푸터에 /rule로 가는 규칙 링크가 있음", async () => {
    await renderHome();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "규칙" })).toHaveAttribute("href", "/rule");
  });

  it("N-3-1: 메인에 기존 도움말이 없음", async () => {
    await renderHome();
    expect(screen.queryByRole("heading", { name: "도움말" })).not.toBeInTheDocument();
  });

  it("N-4-1: 원작(꼬맨틀) 링크가 그대로 있음", async () => {
    await renderHome();
    expect(screen.getByRole("button", { name: /꼬맨틀/ })).toBeInTheDocument();
  });
});

describe("로그아웃 위치 (docs/tasks/ui/verification.md L)", () => {
  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };
  const openSettings = (user: User) => user.click(screen.getByRole("button", { name: "설정" }));
  const logoutButton = () => screen.queryByRole("button", { name: "로그아웃" });

  it("L-1-1: 로그인하면 헤더에 로그아웃 버튼이 없고 닉네임이 보임", async () => {
    logIn();
    await renderHome();
    expect(screen.getAllByText(new RegExp(NICKNAME)).length).toBeGreaterThan(0);
    expect(logoutButton()).not.toBeInTheDocument();
  });

  it("L-1-2: 로그인하면 설정 메뉴에 로그아웃이 있고, 누르면 signOut 호출", async () => {
    logIn();
    const { user } = await renderHome();
    expect(logoutButton()).not.toBeInTheDocument(); // 설정을 열기 전에는 없음 (헤더에 없음)
    await openSettings(user);
    await user.click(await screen.findByRole("button", { name: "로그아웃" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("L-1-3: 비로그인이면 설정 메뉴에 로그아웃이 없고 헤더에 로그인 링크가 있음", async () => {
    const { user } = await renderHome();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    await openSettings(user);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument(); // 설정 메뉴가 열렸는지
    expect(logoutButton()).not.toBeInTheDocument();
  });

  it("L-2-1: excel 테마에서도 로그인하면 설정 메뉴에 로그아웃이 있음", async () => {
    localStorage.setItem("newmantle-ui-theme", "excel");
    logIn();
    const { user } = await renderHome();
    expect(logoutButton()).not.toBeInTheDocument();
    await openSettings(user);
    expect(await screen.findByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});

describe("통계 유도 말풍선 (docs/tasks/ui/verification.md T)", () => {
  const STATS_TOOLTIP_DISMISSED_KEY = "stats-tooltip-dismissed";
  const statsTooltip = () =>
    screen.queryByRole("button", { name: "통계 안내 닫기", hidden: true });
  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  it("T-1-1: 로그인 유저는 통계 말풍선이 보이고 로그인 말풍선은 없음", async () => {
    logIn();
    await renderHome();
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("T-1-2: 비로그인 유저는 통계 말풍선이 없음 (로그인 말풍선은 보임)", async () => {
    await renderHome();
    expect(loginTooltip()).toBeInTheDocument();
    expect(statsTooltip()).not.toBeInTheDocument();
  });

  it("T-1-3: X로 닫으면 저장되고, 다시 열어도 없음", async () => {
    logIn();
    const { user, unmount } = await renderHome();
    await user.click(await screen.findByRole("button", { name: "통계 안내 닫기" }));
    expect(statsTooltip()).not.toBeInTheDocument();
    expect(localStorage.getItem(STATS_TOOLTIP_DISMISSED_KEY)).not.toBeNull();

    await reload(unmount);
    expect(statsTooltip()).not.toBeInTheDocument();
  });

  it("T-1-4: 첫 방문이면 모달이 열려 있는 동안 통계 말풍선이 없고, 닫은 뒤 보임", async () => {
    localStorage.removeItem(MODAL_SEEN_KEY);
    logIn();
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    expect(statsTooltip()).not.toBeInTheDocument();

    await closeWithX(user);
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
  });
});
