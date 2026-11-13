// 화면 레벨: 메인 화면의 첫 방문 모달과 규칙 진입점 (docs/tasks/rule/verification.md M, N)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import Home from "./page";
import { gameServer } from "@/test/fakeGameServer";
import { notifications } from "@/static/notifications";
import { getLatestNotification } from "@/utils/notifications";
import { getKSTDateString } from "@/utils/date";

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
async function renderHome({ strict = false } = {}) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  // strict: 개발 서버처럼 StrictMode로 (effect가 두 번 실행됨)
  const view = render(strict ? <StrictMode><Home /></StrictMode> : <Home />);
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

/** 이전에 단어를 입력해 본 기존 유저 (입력창 말풍선 대상 아님, docs/tasks/ui/input/plan.md 2) */
function setPlayed() {
  localStorage.setItem(
    "newmantle_game_data",
    JSON.stringify({
      submittedWords: [{ word: "사과", similarity: 10, rank: 500, attempt: 1, correct: false }],
      attempts: 1,
      lastPlayedDate: "2000-01-01",
    })
  );
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
    // 입력해 본 적 없으면 입력창 말풍선이 먼저라 로그인 말풍선이 뒤로 밀린다 (docs/tasks/ui/input/plan.md 2, I-1-1).
    // M-6(모달 → 로그인 말풍선)은 입력해 본 기존 유저 기준으로 확인한다
    setPlayed();
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

  it("N-4-1: 원작(꼬맨틀) 외부 링크가 푸터에 있음 (본문에는 없음, docs/tasks/ui/footer/plan.md)", async () => {
    await renderHome();
    const footer = screen.getByRole("contentinfo");
    const link = within(footer).getByRole("link", { name: /꼬맨틀/ });
    expect(link.getAttribute("href")).toMatch(/^https:\/\//);
    expect(screen.queryByRole("button", { name: /꼬맨틀/ })).not.toBeInTheDocument();
  });
});

describe("로그아웃 위치 (docs/tasks/ui/header/verification.md L)", () => {
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

describe("통계 유도 말풍선 (docs/tasks/ui/header/verification.md T)", () => {
  const STATS_TOOLTIP_DISMISSED_KEY = "stats-tooltip-dismissed";
  const statsTooltip = () =>
    screen.queryByRole("button", { name: "통계 안내 닫기", hidden: true });
  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed(); // 입력창 말풍선이 끝난 상태 (말풍선 순서는 I에서 확인)
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

/** 오늘 게임을 끝낸 상태로 저장 (기본: 2번째에 정답 맞힘. `{ givenUp: true }`로 포기) */
function storeToday(extra: Record<string, unknown>) {
  localStorage.setItem(
    "newmantle_game_data",
    JSON.stringify({
      submittedWords: [
        { word: "사랑", similarity: 100, rank: 0, attempt: 2, correct: true },
        { word: "사과", similarity: 10, rank: 500, attempt: 1, correct: false },
      ],
      attempts: 2,
      solvedAttempts: 2,
      gameCompleted: true,
      lastPlayedDate: getKSTDateString(),
      ...extra,
    }),
  );
}

describe("헤더 말풍선 자동 닫힘 / 결과 상자 로그인 안내 (docs/tasks/ui/header/verification.md H-1, result-box/verification.md H-2)", () => {
  const STATS_TOOLTIP_DISMISSED_KEY = "stats-tooltip-dismissed";
  const statsTooltip = () => screen.queryByRole("button", { name: "통계 안내 닫기", hidden: true });
  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };
  /** 시간을 흘려보낸다. 실제 시간도 같이 흐르게 해 두어(shouldAdvanceTime) waitFor·userEvent가 멈추지 않는다 */
  const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));
  const loginLinks = () =>
    screen.queryAllByRole("link", { hidden: true }).filter((a) => a.getAttribute("href") === "/login");

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
  });

  describe("말풍선 5초", () => {
    beforeEach(() => {
      // setup.ts가 setInterval만 가짜로 깔아 두었으므로, 한 번 풀고 setTimeout까지 다시 깐다 (src/test/README.md 시간)
      vi.useRealTimers();
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
        shouldAdvanceTime: true,
      });
    });

    it("H-1-1: 로그인 말풍선은 5초 전엔 있고 5초 뒤 사라지며 닫은 것으로 저장", async () => {
      await renderHome();
      expect(loginTooltip()).toBeInTheDocument();
      await pass(4000);
      expect(loginTooltip()).toBeInTheDocument();
      await pass(1500);
      expect(loginTooltip()).not.toBeInTheDocument();
      expect(localStorage.getItem(TOOLTIP_DISMISSED_KEY)).not.toBeNull();
    });

    it("H-1-2: 통계 말풍선도 5초 뒤 사라지며 닫은 것으로 저장", async () => {
      logIn();
      await renderHome();
      expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
      await pass(5500);
      expect(statsTooltip()).not.toBeInTheDocument();
      expect(localStorage.getItem(STATS_TOOLTIP_DISMISSED_KEY)).not.toBeNull();
    });

    it("H-1-3: 모달 때문에 숨어 있는 동안은 세지 않음", async () => {
      localStorage.removeItem(MODAL_SEEN_KEY);
      const { user } = await renderHome();
      await screen.findByRole("dialog");
      await pass(6000);
      await closeWithX(user);
      expect(loginTooltip()).toBeInTheDocument();
      await pass(5500);
      expect(loginTooltip()).not.toBeInTheDocument();
    });
  });

  it("H-2-1: 비로그인, 정답 맞힘 → 로그인 링크는 헤더 1개뿐 (결과 상자 링크 뺌)", async () => {
    storeToday({});
    await renderHome();
    expect(loginLinks()).toHaveLength(1);
  });

  it("H-2-2: 비로그인, 포기함 → 로그인 링크는 헤더 1개뿐", async () => {
    storeToday({ givenUp: true });
    await renderHome();
    expect(loginLinks()).toHaveLength(1);
  });

  it("H-2-3: 로그인, 정답 맞힘 → 로그인 링크 없음", async () => {
    logIn();
    storeToday({});
    await renderHome();
    expect(loginLinks()).toHaveLength(0);
  });

  it("H-2-4: 비로그인, 진행 중 → 로그인 링크는 헤더 1개뿐", async () => {
    await renderHome();
    expect(loginLinks()).toHaveLength(1);
  });
});

describe("결과 상자 (docs/tasks/ui/result-box/verification.md R)", () => {
  const resultBox = () => screen.findByRole("region", { name: "게임 결과" });

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  it("R-1-1: 정답 맞힘 → 결과 상자 안에 공유·피드백 버튼", async () => {
    storeToday({});
    await renderHome();
    const box = await resultBox();
    expect(within(box).getByRole("button", { name: /공유하기/ })).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: /피드백/ })).toBeInTheDocument();
  });

  it("R-1-2: 포기함 → 결과 상자 안에 공유·피드백 버튼", async () => {
    storeToday({ givenUp: true });
    await renderHome();
    const box = await resultBox();
    expect(within(box).getByRole("button", { name: /공유하기/ })).toBeInTheDocument();
    expect(within(box).getByRole("button", { name: /피드백/ })).toBeInTheDocument();
  });

  it("R-1-3: 결과 상자의 피드백 버튼 → 피드백 창이 열림", async () => {
    storeToday({});
    const { user } = await renderHome();
    await user.click(within(await resultBox()).getByRole("button", { name: /피드백/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("R-2-1: 정답 맞힘 → 정답 투표 버튼이 없음", async () => {
    storeToday({});
    await renderHome();
    await screen.findByRole("button", { name: /공유하기/ });
    expect(screen.queryByRole("button", { name: /좋았다/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /별로였다/ })).not.toBeInTheDocument();
  });
});

describe("첫 입력 유도 말풍선 / 말풍선 순서 (docs/tasks/ui/input/verification.md I)", () => {
  const INPUT_TOOLTIP_DONE_KEY = "newmantle_input_tooltip_done";
  const inputTooltip = () => screen.queryByRole("button", { name: "입력 안내", hidden: true });
  const statsTooltip = () =>
    screen.queryByRole("button", { name: "통계 안내 닫기", hidden: true });
  const gameInput = () => screen.getByRole("textbox");
  /** 첫 단어를 엔터로 제출하고 서버 응답까지 기다린다 */
  async function submitFirstWord(user: User) {
    await user.type(gameInput(), "사과{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(1));
  }
  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };

  it("I-1-1: 첫 방문은 모달 → 입력창 말풍선 순서, 이때 로그인 말풍선은 없음", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    expect(inputTooltip()).not.toBeInTheDocument();

    await closeWithX(user);
    expect(await screen.findByRole("button", { name: "입력 안내" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("I-1-2: 첫 단어를 제출(엔터)하면 입력창 말풍선이 사라지고 로그인 말풍선이 보임", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });

    await submitFirstWord(user);
    await waitFor(() => expect(inputTooltip()).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "로그인 안내 닫기" })).toBeInTheDocument();
    expect(localStorage.getItem(INPUT_TOOLTIP_DONE_KEY)).not.toBeNull();
  });

  it("I-1-3: 첫 단어를 제출한 뒤 다시 열면 입력창 말풍선 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user, unmount } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });
    await submitFirstWord(user);
    await waitFor(() => expect(inputTooltip()).not.toBeInTheDocument());

    await reload(unmount);
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("I-1-4: 입력창 말풍선을 누르면 입력창에 포커스, 말풍선은 남아 있음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await user.click(await screen.findByRole("button", { name: "입력 안내" }));
    await waitFor(() => expect(gameInput()).toHaveFocus());
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("I-1-6: 입력창을 누르고 글자를 쳐도 제출 전이면 입력창 말풍선이 남고 헤더 말풍선은 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });
    await user.click(gameInput());
    await user.type(gameInput(), "사과");
    expect(inputTooltip()).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("I-1-5: 입력창을 누르지 않으면 말풍선이 그대로 있음 (개발 서버 StrictMode, 규칙 페이지에서 돌아온 경우)", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    await renderHome({ strict: true });
    await screen.findByRole("button", { name: "입력 안내" });
    // 진입 직후 자동 포커스(50ms 지연)가 지나도 남아 있어야 한다
    await new Promise((r) => setTimeout(r, 150));
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("I-4-1: 모달을 시작하기로 닫으면 입력창에 포커스, 입력창 말풍선은 남아 있음", async () => {
    const { user } = await renderHome();
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "시작하기" }));
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    await waitFor(() => expect(gameInput()).toHaveFocus());
    expect(inputTooltip()).toBeInTheDocument();
  });

  describe.each([
    ["X", async (user: User) => closeWithX(user)],
    [
      "ESC",
      async (user: User) => {
        await user.keyboard("{Escape}");
        await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      },
    ],
    [
      "바깥 클릭",
      async (user: User) => {
        await user.click(document.body);
        await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      },
    ],
  ])("모달을 %s(으)로 닫기", (_, close) => {
    it("I-4-2: 입력창으로 포커스가 가지 않음, 입력창 말풍선은 남아 있음", async () => {
      const { user } = await renderHome();
      await screen.findByRole("dialog");
      await close(user);
      // 닫힌 뒤 포커스 이동이 끝날 시간을 둔다
      await new Promise((r) => setTimeout(r, 100));
      expect(gameInput()).not.toHaveFocus();
      expect(inputTooltip()).toBeInTheDocument();
    });
  });

  it("I-2-1: 입력해 본 기존 유저는 입력창 말풍선 없이 로그인 말풍선", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
    await renderHome();
    expect(await screen.findByRole("button", { name: "로그인 안내 닫기" })).toBeInTheDocument();
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("I-2-2: 로그인 말풍선을 닫은 적 있는 유저는 입력창 말풍선 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
    await renderHome();
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("I-3-1: 입력 없이 로그인부터 하고 돌아오면 입력창 말풍선만, 첫 단어를 제출하면 통계 말풍선", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    logIn();
    const { user } = await renderHome();
    expect(await screen.findByRole("button", { name: "입력 안내" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
    expect(statsTooltip()).not.toBeInTheDocument();

    await submitFirstWord(user);
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("I-3-2: 입력해 본 로그인 유저는 입력창 말풍선 없이 통계 말풍선", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
    logIn();
    await renderHome();
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
    expect(inputTooltip()).not.toBeInTheDocument();
  });
});

describe("공지 배너 / 공지사항 진입점 (docs/tasks/ui/notices/verification.md NT)", () => {
  const LAST_SEEN_KEY = "newmantle_last_seen_notification_id";
  const LEGACY_CHECK_KEY = "newmantle_last_notification_check";
  // 최신 공지 = 정렬 1순위 (날짜순). 지난 일을 기록한 공지는 id가 더 커도 최신이 아님 (docs/spec/notices.md)
  const latestId = getLatestNotification(notifications)!.id;
  const olderId = String(Number(latestId) - 1);

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  const bannerLinks = () =>
    screen.queryAllByRole("link").filter((a) => a.getAttribute("href") === "/notices");
  const closeBanner = () => screen.queryByRole("button", { name: "공지 닫기" });

  it("NT-5: 안 읽은 최신 공지가 있으면 /notices로 가는 배너가 보이고, 공지 목록은 없음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    await renderHome();
    expect(bannerLinks()).toHaveLength(1);
    expect(closeBanner()).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "공지사항" })).not.toBeInTheDocument();
  });

  it("NT-6: 최신 공지를 읽었으면 배너 없음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, latestId);
    await renderHome();
    expect(bannerLinks()).toHaveLength(0);
    expect(closeBanner()).not.toBeInTheDocument();
  });

  it("NT-7: 메인에 들어오기만 해서는 읽음 저장값(새 키·기존 키)이 바뀌지 않음", async () => {
    const legacy = "2026-01-01T00:00:00.000Z";
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    localStorage.setItem(LEGACY_CHECK_KEY, legacy);
    await renderHome();
    // 기존 공지 목록은 마운트 100ms 뒤 기존 키를 덮어썼다
    await new Promise((r) => setTimeout(r, 200));
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(olderId);
    expect(localStorage.getItem(LEGACY_CHECK_KEY)).toBe(legacy);
  });

  it("NT-8: 배너를 X로 닫으면 배너가 사라지고 최신 공지를 본 것으로 저장", async () => {
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    const { user } = await renderHome();
    await user.click(screen.getByRole("button", { name: "공지 닫기" }));
    expect(bannerLinks()).toHaveLength(0);
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(latestId);
  });

  it("NT-10: 설정 메뉴에 /notices로 가는 공지사항 링크가 있음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, latestId); // 배너 없이
    const { user } = await renderHome();
    await user.click(screen.getByRole("button", { name: "설정" }));
    expect(screen.getByRole("link", { name: "공지사항" })).toHaveAttribute("href", "/notices");
  });
});
