// 화면 레벨: classic 보기 방식 말풍선 (docs/specs/progress-view-toggle Phase 3, Dec-27~40)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { gameServer } from "@/test/fakeGameServer";

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

const MODAL_SEEN_KEY = "newmantle_rule_modal_seen";

type User = ReturnType<typeof userEvent.setup>;

const viewTooltip = () => screen.queryByRole("button", { name: "보기 방식 안내", hidden: true });
const viewTooltipClose = () => screen.getByRole("button", { name: "보기 방식 안내 닫기" });
const loginTooltip = () => screen.queryByRole("button", { name: "로그인 안내 닫기", hidden: true });
const inputTooltip = () => screen.queryByRole("button", { name: "입력 안내", hidden: true });
const gaugeSwitch = () => screen.getByRole("switch", { name: "게이지 보기" });

/** 메인을 렌더링하고, 헤더(로그인 링크)와 게임 입력창이 준비될 때까지 기다린다 */
async function renderHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  // 첫 방문 모달이 열려 있으면 바깥 요소가 aria-hidden 되므로 hidden 포함해서 찾는다
  await waitFor(() => screen.getAllByRole("textbox", { hidden: true }).forEach((t) => expect(t).toBeEnabled()));
  await waitFor(() => expect(screen.getByRole("link", { name: "로그인", hidden: true })).toBeInTheDocument());
  await waitFor(() => expect(screen.getByRole("switch", { name: "게이지 보기", hidden: true })).toBeInTheDocument());
  return { user, ...view };
}

/** 새로고침: 다시 렌더링 (localStorage는 유지) */
async function reload(unmount: () => void) {
  unmount();
  return renderHome();
}

/** 이전에 단어를 입력해 본 기존 유저 (입력창 말풍선 대상 아님) */
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

async function submit(user: User, word: string) {
  const before = gameServer.count("guess");
  await user.type(screen.getByRole("textbox"), `${word}{Enter}`);
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
}

beforeEach(() => {
  localStorage.setItem(MODAL_SEEN_KEY, "1");
});

/** 시간을 흘려보낸다. 실제 시간도 같이 흐르게 해 두어(shouldAdvanceTime) waitFor·userEvent가 멈추지 않는다 */
const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** setup.ts가 setInterval만 가짜로 깔아 두었으므로, 한 번 풀고 setTimeout까지 다시 깐다 (src/test/README.md 시간) */
function fakeTimeouts() {
  vi.useRealTimers();
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
    shouldAdvanceTime: true,
  });
}

describe("기존 유저: 보기 방식 말풍선 → 로그인 말풍선", () => {
  beforeEach(() => {
    setPlayed();
  });

  it("들어오면 보기 방식 말풍선만 보이고, 5초 뒤 사라지며 로그인 말풍선이 보이고, 새로고침하면 보기 방식 말풍선이 없음", async () => {
    fakeTimeouts();
    const { unmount } = await renderHome();
    expect(await screen.findByRole("button", { name: "보기 방식 안내" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();

    await pass(5500);
    expect(viewTooltip()).not.toBeInTheDocument();
    expect(loginTooltip()).toBeInTheDocument();

    await reload(unmount);
    expect(viewTooltip()).not.toBeInTheDocument();
  });

  it("첫 방문 모달을 안 본 기존 유저는 모달이 열려 있는 동안 보기 방식 말풍선이 없고, 닫은 뒤 보임", async () => {
    localStorage.removeItem(MODAL_SEEN_KEY);
    const { user } = await renderHome();
    const dialog = await screen.findByRole("dialog");
    expect(viewTooltip()).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "보기 방식 안내" })).toBeInTheDocument();
  });
});

describe("신규 유저: 입력창 말풍선 → 보기 방식 말풍선", () => {
  it("들어오면 입력창 말풍선만 있고, 6초 고민한 뒤 첫 단어를 제출하면 입력창 말풍선이 사라지고 보기 방식 말풍선이 보임", async () => {
    fakeTimeouts();
    const { user } = await renderHome();
    expect(await screen.findByRole("button", { name: "입력 안내" })).toBeInTheDocument();
    expect(viewTooltip()).not.toBeInTheDocument();

    // 기다린 시간은 보기 방식 말풍선의 5초에 들어가지 않는다 (Dec-31)
    await pass(6000);
    await submit(user, "사과");
    await waitFor(() => expect(inputTooltip()).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "보기 방식 안내" })).toBeInTheDocument();
  });
});

describe("보기 방식 말풍선 끝내기", () => {
  beforeEach(() => {
    setPlayed();
  });

  it("스위치를 끄면 말풍선이 사라짐", async () => {
    const { user } = await renderHome();
    await screen.findByRole("button", { name: "보기 방식 안내" });

    await user.click(gaugeSwitch());
    await waitFor(() => expect(viewTooltip()).not.toBeInTheDocument());
  });

  it("X를 누르면 말풍선이 사라지고 카드 그대로이며, 새로고침해도 말풍선이 없음", async () => {
    const { user, unmount } = await renderHome();
    await screen.findByRole("button", { name: "보기 방식 안내" });

    await user.click(viewTooltipClose());
    await waitFor(() => expect(viewTooltip()).not.toBeInTheDocument());
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "true");

    await reload(unmount);
    expect(viewTooltip()).not.toBeInTheDocument();
  });

  it("말풍선 본문을 누르면 말풍선이 사라지고 카드 그대로이며, 새로고침해도 말풍선이 없음", async () => {
    const { user, unmount } = await renderHome();
    const body = await screen.findByRole("button", { name: "보기 방식 안내" });

    await user.click(body);
    await waitFor(() => expect(viewTooltip()).not.toBeInTheDocument());
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "true");

    await reload(unmount);
    expect(viewTooltip()).not.toBeInTheDocument();
  });
});
