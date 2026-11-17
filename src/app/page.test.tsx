// 화면 레벨: 메인 화면의 첫 방문 모달과 규칙 진입점 (docs/tasks/rule/plan.md)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import Home from "./page";
import { ANSWER, gameServer } from "@/test/fakeGameServer";
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
  it("첫 방문 시 안내 모달이 열림", async () => {
    await renderHome();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("모달을 닫고 새로고침하면 다시 열리지 않음", async () => {
    const { user, unmount } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);

    await reload(unmount);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("이미 본 유저는 모달이 열리지 않음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    await renderHome();
    expect(dialog()).not.toBeInTheDocument();
  });

  it("게임 기록이 있는 기존 유저도 확인 여부가 없으면 한 번 열림", async () => {
    localStorage.setItem(
      "newmantle_game_data",
      JSON.stringify({ submittedWords: [], attempts: 0, lastPlayedDate: "2000-01-01" })
    );
    await renderHome();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("모달을 닫으면 확인 여부가 저장됨", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(localStorage.getItem(MODAL_SEEN_KEY)).not.toBeNull();
  });

  it("비로그인 첫 방문 시 모달이 열려 있는 동안 로그인 말풍선이 없고, 닫은 뒤 보임", async () => {
    // 입력해 본 적 없으면 입력창 말풍선이 먼저라 로그인 말풍선이 뒤로 밀린다 (docs/tasks/ui/input/plan.md 2).
    // 모달 → 로그인 말풍선 순서(docs/tasks/rule/plan.md M-6)는 입력해 본 기존 유저 기준으로 확인한다
    setPlayed();
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    expect(loginTooltip()).not.toBeInTheDocument();

    await closeWithX(user);
    expect(loginTooltip()).toBeInTheDocument();
  });

  it("로그인 말풍선을 이미 닫은 유저는 모달을 닫아도 말풍선이 없음", async () => {
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("로그인 유저도 첫 방문이면 모달이 열리고, 말풍선은 없음", async () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    expect(loginTooltip()).not.toBeInTheDocument();
  });
});

describe("로그아웃 위치", () => {
  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  const logIn = () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
  };
  const openSettings = (user: User) => user.click(screen.getByRole("button", { name: "설정" }));
  const logoutButton = () => screen.queryByRole("button", { name: "로그아웃" });

  it("로그인하면 헤더에 로그아웃 버튼이 없고 닉네임이 보임", async () => {
    logIn();
    await renderHome();
    expect(screen.getAllByText(new RegExp(NICKNAME)).length).toBeGreaterThan(0);
    expect(logoutButton()).not.toBeInTheDocument();
  });

  it("로그인하면 설정 메뉴에 로그아웃이 있고, 누르면 signOut 호출", async () => {
    logIn();
    const { user } = await renderHome();
    expect(logoutButton()).not.toBeInTheDocument(); // 설정을 열기 전에는 없음 (헤더에 없음)
    await openSettings(user);
    await user.click(await screen.findByRole("button", { name: "로그아웃" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("비로그인이면 설정 메뉴에 로그아웃이 없고 헤더에 로그인 링크가 있음", async () => {
    const { user } = await renderHome();
    expect(screen.getByRole("link", { name: "로그인" })).toBeInTheDocument();
    await openSettings(user);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument(); // 설정 메뉴가 열렸는지
    expect(logoutButton()).not.toBeInTheDocument();
  });
});

describe("통계 유도 말풍선", () => {
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

  it("로그인 유저는 통계 말풍선이 보이고 로그인 말풍선은 없음", async () => {
    logIn();
    await renderHome();
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("비로그인 유저는 통계 말풍선이 없음 (로그인 말풍선은 보임)", async () => {
    await renderHome();
    expect(loginTooltip()).toBeInTheDocument();
    expect(statsTooltip()).not.toBeInTheDocument();
  });

  it("X로 닫으면 저장되고, 다시 열어도 없음", async () => {
    logIn();
    const { user, unmount } = await renderHome();
    await user.click(await screen.findByRole("button", { name: "통계 안내 닫기" }));
    expect(statsTooltip()).not.toBeInTheDocument();
    expect(localStorage.getItem(STATS_TOOLTIP_DISMISSED_KEY)).not.toBeNull();

    await reload(unmount);
    expect(statsTooltip()).not.toBeInTheDocument();
  });

  it("첫 방문이면 모달이 열려 있는 동안 통계 말풍선이 없고, 닫은 뒤 보임", async () => {
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

describe("헤더 말풍선 자동 닫힘 / 헤더 로그인 링크", () => {
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

    it("로그인 말풍선은 5초 전엔 있고 5초 뒤 사라지며 닫은 것으로 저장", async () => {
      await renderHome();
      expect(loginTooltip()).toBeInTheDocument();
      await pass(4000);
      expect(loginTooltip()).toBeInTheDocument();
      await pass(1500);
      expect(loginTooltip()).not.toBeInTheDocument();
      expect(localStorage.getItem(TOOLTIP_DISMISSED_KEY)).not.toBeNull();
    });

    it("통계 말풍선도 5초 뒤 사라지며 닫은 것으로 저장", async () => {
      logIn();
      await renderHome();
      expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
      await pass(5500);
      expect(statsTooltip()).not.toBeInTheDocument();
      expect(localStorage.getItem(STATS_TOOLTIP_DISMISSED_KEY)).not.toBeNull();
    });

    it("모달 때문에 숨어 있는 동안은 세지 않음", async () => {
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

  it("로그인, 정답 맞힘 → 로그인 링크 없음", async () => {
    logIn();
    storeToday({});
    await renderHome();
    expect(loginLinks()).toHaveLength(0);
  });

  it("비로그인, 진행 중 → 로그인 링크는 헤더 1개뿐", async () => {
    await renderHome();
    expect(loginLinks()).toHaveLength(1);
  });
});

describe("결과창 모달", () => {
  /** 결과창 (이름 "게임 결과"인 dialog) */
  const resultDialog = () => screen.queryByRole("dialog", { name: "게임 결과" });
  const findResultDialog = () => screen.findByRole("dialog", { name: "게임 결과" }, { timeout: 3000 });
  const reopenButton = () => screen.queryByRole("button", { name: /결과창 보기/ });
  const gameInput = () => screen.getByRole("textbox");
  /** 실제 시간을 흘려보낸다 (setTimeout은 가짜가 아님) */
  const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));

  /** 오늘 정답 맞힘 / 포기 저장. 정답 항목에 서버 정답 정보(answer)가 들어 있다 */
  function storeFinished({ givenUp = false } = {}) {
    storeToday({
      submittedWords: [
        { word: ANSWER.word, similarity: 100, rank: 0, attempt: 2, correct: true, answer: ANSWER },
        { word: "사과", similarity: 10, rank: 500, attempt: 1, correct: false },
      ],
      ...(givenUp ? { givenUp: true } : {}),
    });
  }

  async function submit(user: User, word: string) {
    const before = gameServer.count("guess");
    await user.type(gameInput(), `${word}{Enter}`);
    await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  }

  async function openFromMain(user: User) {
    await user.click(await screen.findByRole("button", { name: /결과창 보기/ }));
    return findResultDialog();
  }

  async function closeResult(user: User) {
    await user.click(within(screen.getByRole("dialog", { name: "게임 결과" })).getByRole("button", { name: /close/i }));
    await waitFor(() => expect(resultDialog()).not.toBeInTheDocument());
  }

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
  });

  describe("자동 표시", () => {
    it("정답 제출 → 결과창이 열림", async () => {
      const { user } = await renderHome();
      await submit(user, ANSWER.word);
      expect(await findResultDialog()).toBeInTheDocument();
    });

    it("응답 직후 제목에 정답이 보일 때는 결과창이 없고, 잠시 뒤 열림", async () => {
      const { user } = await renderHome();
      await submit(user, ANSWER.word);
      // 제목에 정답이 보이는 시점 (스크린 리더용 한 단어)
      await waitFor(() => expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0));
      expect(resultDialog()).not.toBeInTheDocument();
      expect(await findResultDialog()).toBeInTheDocument();
    });

    it("포기 확인 → 확인 창이 닫히고 결과창만 열림", async () => {
      const { user } = await renderHome();
      await user.click(screen.getByRole("button", { name: "포기" }));
      const confirm = await screen.findByRole("dialog");
      await user.click(within(confirm).getByRole("button", { name: /포기하고/ }));
      await findResultDialog();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });

    it("오늘 정답 맞힘 저장 → 진입 시 자동으로 열리지 않고, 결과 다시 보기 버튼이 있음", async () => {
      storeFinished();
      await renderHome();
      expect(await screen.findByRole("button", { name: /결과창 보기/ })).toBeInTheDocument();
      await wait(1500);
      expect(resultDialog()).not.toBeInTheDocument();
    });

    it("오늘 포기 저장 → 진입 시 자동으로 열리지 않고, 결과 다시 보기 버튼이 있음", async () => {
      storeFinished({ givenUp: true });
      await renderHome();
      expect(await screen.findByRole("button", { name: /결과창 보기/ })).toBeInTheDocument();
      await wait(1500);
      expect(resultDialog()).not.toBeInTheDocument();
    });

    it("정답으로 열린 결과창을 닫고 단어를 더 제출 → 표에 추가되고 결과창은 다시 열리지 않음", async () => {
      const { user } = await renderHome();
      await submit(user, ANSWER.word);
      await findResultDialog();
      await closeResult(user);

      await submit(user, "바나나");
      // 진행 상황 카드와 기록 표 두 곳에 보인다
      expect((await screen.findAllByText("바나나")).length).toBeGreaterThan(0);
      await wait(1500);
      expect(resultDialog()).not.toBeInTheDocument();
    });

    it("정답 제출 → 결과창이 열리기 전엔 입력창 잠금, 닫으면 풀림", async () => {
      const { user } = await renderHome();
      await submit(user, ANSWER.word);
      await waitFor(() => expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0));
      expect(resultDialog()).not.toBeInTheDocument();
      expect(gameInput()).toBeDisabled();

      await findResultDialog();
      await closeResult(user);
      expect(gameInput()).toBeEnabled();
    });

    it("포기 확인 → 결과창이 열리기 전엔 입력창 잠금, 계속 플레이로 풀림", async () => {
      const { user } = await renderHome();
      await user.click(screen.getByRole("button", { name: "포기" }));
      const confirm = await screen.findByRole("dialog");
      await user.click(within(confirm).getByRole("button", { name: /포기하고/ }));
      await waitFor(() => expect(gameServer.count("give-up")).toBe(1));
      await waitFor(() => expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0));
      expect(resultDialog()).not.toBeInTheDocument();
      expect(gameInput()).toBeDisabled();

      const d = await findResultDialog();
      await user.click(within(d).getByRole("button", { name: /순위권 단어/ }));
      await waitFor(() => expect(resultDialog()).not.toBeInTheDocument());
      expect(gameInput()).toBeEnabled();
    });
    it("포기 요청 실패 → 입력창이 잠기지 않고 결과창도 열리지 않음", async () => {
      const { user } = await renderHome();
      gameServer.failNext("give-up");
      await user.click(screen.getByRole("button", { name: "포기" }));
      const confirm = await screen.findByRole("dialog");
      await user.click(within(confirm).getByRole("button", { name: /포기하고/ }));
      await waitFor(() => expect(gameServer.count("give-up")).toBe(1));
      await waitFor(() => expect(screen.getByRole("button", { name: "포기" })).toBeEnabled());
      expect(gameInput()).toBeEnabled();
      await wait(1500);
      expect(resultDialog()).not.toBeInTheDocument();
    });
  });

  describe("닫기와 다시 보기", () => {
    it("계속 플레이 → 결과창이 닫히고 입력창을 쓸 수 있음", async () => {
      storeFinished();
      const { user } = await renderHome();
      const d = await openFromMain(user);
      await user.click(within(d).getByRole("button", { name: /순위권 단어/ }));
      await waitFor(() => expect(resultDialog()).not.toBeInTheDocument());
      expect(gameInput()).toBeEnabled();
    });

    it("다시 보기 → 닫기를 두 번 해도 게임 기록이 그대로이고 서버 요청이 없음", async () => {
      storeFinished();
      const { user } = await renderHome();
      await screen.findByRole("button", { name: /결과창 보기/ });
      const saved = localStorage.getItem("newmantle_game_data");
      const requests = gameServer.requests.length;

      for (let i = 0; i < 2; i++) {
        await openFromMain(user);
        await closeResult(user);
      }
      expect(localStorage.getItem("newmantle_game_data")).toBe(saved);
      expect(gameServer.requests.length).toBe(requests);
    });
  });

  describe("피드백", () => {
    it("피드백 → 결과창은 닫히고 피드백 창만 열림, 피드백 창을 닫으면 결과창이 다시 열림", async () => {
      storeFinished();
      const { user } = await renderHome();
      const d = await openFromMain(user);
      await user.click(within(d).getByRole("button", { name: /피드백/ }));

      await waitFor(() => expect(resultDialog()).not.toBeInTheDocument());
      const dialogs = await screen.findAllByRole("dialog");
      expect(dialogs).toHaveLength(1);

      // 피드백 창을 닫으면 결과창이 다시 열림 (docs/tasks/ui/feedback/decision.md Dec-18)
      await user.click(within(dialogs[0]).getByRole("button", { name: /close/i }));
      expect(await findResultDialog()).toBeInTheDocument();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
    });
  });

  describe("헤더 로그인 강조", () => {
    /** 헤더 로그인 링크 (결과창이 열리면 바깥은 aria-hidden) */
    const headerLogin = () =>
      screen.getAllByRole("link", { hidden: true }).find((a) => a.getAttribute("href") === "/login")!;

    it("결과 다시 보기 → 헤더 로그인에 말풍선, 닫으면 사라짐", async () => {
      storeFinished();
      const { user } = await renderHome();
      expect(headerLogin()).not.toHaveAccessibleDescription();

      await openFromMain(user);
      await waitFor(() => expect(headerLogin()).toHaveAccessibleDescription());

      await closeResult(user);
      await waitFor(() => expect(headerLogin()).not.toHaveAccessibleDescription());
    });

    it("정답 제출로 결과창이 자동으로 열리면 헤더 로그인에 말풍선", async () => {
      const { user } = await renderHome();
      await submit(user, ANSWER.word);
      await findResultDialog();
      await waitFor(() => expect(headerLogin()).toHaveAccessibleDescription());
    });

    it("결과창이 열린 채 헤더 로그인을 누르면 결과창이 먼저 닫히지 않고 링크에 클릭이 전달됨", async () => {
      storeFinished();
      const { user } = await renderHome();
      await openFromMain(user);
      const link = headerLogin();
      let clicked = false;
      // jsdom은 페이지 이동을 하지 않으므로 클릭이 링크에 닿았는지만 본다
      link.addEventListener("click", (e) => {
        clicked = true;
        e.preventDefault();
      });
      await user.click(link);
      expect(clicked).toBe(true);
      await wait(300);
      expect(resultDialog()).toBeInTheDocument();
    });

    it("결과창이 열리면 기존 로그인 말풍선은 숨김", async () => {
      storeFinished();
      const { user } = await renderHome();
      expect(await screen.findByRole("button", { name: "로그인 안내 닫기" })).toBeInTheDocument();

      await openFromMain(user);
      await waitFor(() => expect(loginTooltip()).not.toBeInTheDocument());
    });
  });

  describe("메인 화면", () => {
    it("게임 진행 중 → 결과 다시 보기 버튼이 없음", async () => {
      await renderHome();
      expect(reopenButton()).not.toBeInTheDocument();
    });

  });
});

describe("첫 입력 유도 말풍선 / 말풍선 순서", () => {
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

  it("첫 방문은 모달 → 입력창 말풍선 순서, 이때 로그인 말풍선은 없음", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    expect(inputTooltip()).not.toBeInTheDocument();

    await closeWithX(user);
    expect(await screen.findByRole("button", { name: "입력 안내" })).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("첫 단어를 제출(엔터)하면 입력창 말풍선이 사라지고 로그인 말풍선이 보임", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });

    await submitFirstWord(user);
    await waitFor(() => expect(inputTooltip()).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "로그인 안내 닫기" })).toBeInTheDocument();
    expect(localStorage.getItem(INPUT_TOOLTIP_DONE_KEY)).not.toBeNull();
  });

  it("첫 단어를 제출한 뒤 다시 열면 입력창 말풍선 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user, unmount } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });
    await submitFirstWord(user);
    await waitFor(() => expect(inputTooltip()).not.toBeInTheDocument());

    await reload(unmount);
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("입력창 말풍선을 누르면 입력창에 포커스, 말풍선은 남아 있음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await user.click(await screen.findByRole("button", { name: "입력 안내" }));
    await waitFor(() => expect(gameInput()).toHaveFocus());
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("입력창을 누르고 글자를 쳐도 제출 전이면 입력창 말풍선이 남고 헤더 말풍선은 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    const { user } = await renderHome();
    await screen.findByRole("button", { name: "입력 안내" });
    await user.click(gameInput());
    await user.type(gameInput(), "사과");
    expect(inputTooltip()).toBeInTheDocument();
    expect(loginTooltip()).not.toBeInTheDocument();
  });

  it("입력창을 누르지 않으면 말풍선이 그대로 있음 (개발 서버 StrictMode, 규칙 페이지에서 돌아온 경우)", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    await renderHome({ strict: true });
    await screen.findByRole("button", { name: "입력 안내" });
    // 진입 직후 자동 포커스(50ms 지연)가 지나도 남아 있어야 한다
    await new Promise((r) => setTimeout(r, 150));
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("모달을 시작하기로 닫으면 입력창에 포커스, 입력창 말풍선은 남아 있음", async () => {
    const { user } = await renderHome();
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "시작하기" }));
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    await waitFor(() => expect(gameInput()).toHaveFocus());
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("모달을 X로 닫으면 입력창으로 포커스가 가지 않음, 입력창 말풍선은 남아 있음", async () => {
    const { user } = await renderHome();
    await screen.findByRole("dialog");
    await closeWithX(user);
    // 닫힌 뒤 포커스 이동이 끝날 시간을 둔다
    await new Promise((r) => setTimeout(r, 100));
    expect(gameInput()).not.toHaveFocus();
    expect(inputTooltip()).toBeInTheDocument();
  });

  it("입력해 본 기존 유저는 입력창 말풍선 없이 로그인 말풍선", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
    await renderHome();
    expect(await screen.findByRole("button", { name: "로그인 안내 닫기" })).toBeInTheDocument();
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("로그인 말풍선을 닫은 적 있는 유저는 입력창 말풍선 없음", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, "1");
    await renderHome();
    expect(inputTooltip()).not.toBeInTheDocument();
  });

  it("입력 없이 로그인부터 하고 돌아오면 입력창 말풍선만, 첫 단어를 제출하면 통계 말풍선", async () => {
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

  it("입력해 본 로그인 유저는 입력창 말풍선 없이 통계 말풍선", async () => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
    setPlayed();
    logIn();
    await renderHome();
    expect(await screen.findByRole("button", { name: "통계 안내 닫기" })).toBeInTheDocument();
    expect(inputTooltip()).not.toBeInTheDocument();
  });
});

describe("공지 배너 / 공지사항 진입점", () => {
  const LAST_SEEN_KEY = "newmantle_last_seen_notification_id";
  const LEGACY_CHECK_KEY = "newmantle_last_notification_check";
  // 최신 공지 = 정렬 1순위 (날짜순). 지난 일을 기록한 공지는 id가 더 커도 최신이 아님 (docs/rules/notices.md)
  const latestId = getLatestNotification(notifications)!.id;
  const olderId = String(Number(latestId) - 1);

  beforeEach(() => {
    localStorage.setItem(MODAL_SEEN_KEY, "1");
  });

  const bannerLinks = () =>
    screen.queryAllByRole("link").filter((a) => a.getAttribute("href") === "/notices");
  const closeBanner = () => screen.queryByRole("button", { name: "공지 닫기" });

  it("안 읽은 최신 공지가 있으면 /notices로 가는 배너가 보이고, 공지 목록은 없음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    await renderHome();
    expect(bannerLinks()).toHaveLength(1);
    expect(closeBanner()).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "공지사항" })).not.toBeInTheDocument();
  });

  it("최신 공지를 읽었으면 배너 없음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, latestId);
    await renderHome();
    expect(bannerLinks()).toHaveLength(0);
    expect(closeBanner()).not.toBeInTheDocument();
  });

  it("메인에 들어오기만 해서는 읽음 저장값(새 키·기존 키)이 바뀌지 않음", async () => {
    const legacy = "2026-01-01T00:00:00.000Z";
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    localStorage.setItem(LEGACY_CHECK_KEY, legacy);
    await renderHome();
    // 기존 공지 목록은 마운트 100ms 뒤 기존 키를 덮어썼다
    await new Promise((r) => setTimeout(r, 200));
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(olderId);
    expect(localStorage.getItem(LEGACY_CHECK_KEY)).toBe(legacy);
  });

  it("배너를 X로 닫으면 배너가 사라지고 최신 공지를 본 것으로 저장", async () => {
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    const { user } = await renderHome();
    await user.click(screen.getByRole("button", { name: "공지 닫기" }));
    expect(bannerLinks()).toHaveLength(0);
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(latestId);
  });

});
