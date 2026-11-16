// 화면 레벨: 피드백 창 (docs/tasks/ui/feedback/verification.md F)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as amplitude from "@amplitude/analytics-browser";
import Home from "./page";
import { Toaster } from "@/components/ui/toaster";
import { ANSWER } from "@/test/fakeGameServer";
import { feedbackWebhook } from "@/test/fakeFeedbackWebhook";
import { amplitudeEvents } from "@/test/gameHarness";
import { KST_AFTERNOON, KST_BEFORE_MIDNIGHT, KST_MIDNIGHT, setClock } from "@/test/clock";
import { getKSTDateString } from "@/utils/date";

// 메인 화면이 쓰는 Supabase 메서드 (비로그인 게스트)
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

const SENT_KEY = "newmantle_feedback_sent_date";
const THEME_KEY = "newmantle-ui-theme";

type User = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  localStorage.setItem("newmantle_rule_modal_seen", "1");
  // 이전에 입력해 본 적 있음 (오늘 기록 없음)
  localStorage.setItem(
    "newmantle_game_data",
    JSON.stringify({
      submittedWords: [{ word: "사과", similarity: 10, rank: 500, attempt: 1, correct: false }],
      attempts: 1,
      lastPlayedDate: "2000-01-01",
    })
  );
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

// ---- 사전 상태 ----

/** 오늘 정답 맞힘 / 포기 저장 */
function storeFinished({ givenUp = false } = {}) {
  localStorage.setItem(
    "newmantle_game_data",
    JSON.stringify({
      submittedWords: [
        { word: ANSWER.word, similarity: 100, rank: 0, attempt: 2, correct: true, answer: ANSWER },
        { word: "사과", similarity: 10, rank: 500, attempt: 1, correct: false },
      ],
      attempts: 2,
      solvedAttempts: 2,
      gameCompleted: true,
      lastPlayedDate: getKSTDateString(),
      ...(givenUp ? { givenUp: true } : {}),
    })
  );
}

const useExcel = () => localStorage.setItem(THEME_KEY, "excel");

function kstYesterday() {
  const d = new Date(`${getKSTDateString()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---- 화면 조작 ----

async function renderHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(
    <>
      <Home />
      <Toaster />
    </>
  );
  await waitFor(() => {
    const textboxes = screen.getAllByRole("textbox", { hidden: true });
    textboxes.forEach((t) => expect(t).toBeEnabled());
  });
  return { user, ...view };
}

/** 열린 피드백 창 ("게임 결과"가 아닌 dialog) */
async function feedbackDialog() {
  let found: HTMLElement | undefined;
  await waitFor(() => {
    const result = screen.queryByRole("dialog", { name: "게임 결과" });
    found = screen.getAllByRole("dialog").find((d) => d !== result);
    expect(found).toBeDefined();
  });
  return found!;
}

const settingsFeedbackButton = () => screen.queryByRole("button", { name: /피드백 남기기/ });

async function openFromSettings(user: User) {
  await user.click(screen.getByRole("button", { name: "설정" }));
  await user.click(await screen.findByRole("button", { name: /피드백 남기기/ }));
  return feedbackDialog();
}

async function openFromResult(user: User) {
  await user.click(await screen.findByRole("button", { name: /결과창 보기/ }));
  const result = await screen.findByRole("dialog", { name: "게임 결과" }, { timeout: 3000 });
  const button = within(result).getByRole("button", { name: /피드백/ });
  expect(button).toBeEnabled();
  await user.click(button);
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "게임 결과" })).not.toBeInTheDocument());
  return feedbackDialog();
}

async function closeDialog(user: User, d: HTMLElement) {
  await user.click(within(d).getByRole("button", { name: /close/i }));
  await waitFor(() => expect(screen.queryAllByRole("dialog")).toHaveLength(0));
}

const input = (d: HTMLElement) => within(d).queryByRole("textbox");
const sendButton = (d: HTMLElement) => within(d).queryByRole("button", { name: /보내기/ });

async function write(user: User, d: HTMLElement, text: string) {
  const box = input(d);
  expect(box).not.toBeNull();
  await user.click(box!);
  await user.paste(text);
}

async function send(user: User, d: HTMLElement) {
  const before = feedbackWebhook.bodies.length;
  await user.click(sendButton(d)!);
  await waitFor(() => expect(feedbackWebhook.bodies.length).toBe(before + 1));
}

/** 보낸 상태: 입력창과 보내기 버튼이 없고, 창 안에 감사 안내(status)가 있음 */
async function expectSentState(d: HTMLElement) {
  await waitFor(() => {
    expect(input(d)).not.toBeInTheDocument();
    expect(sendButton(d)).not.toBeInTheDocument();
    expect(within(d).getByRole("status")).toBeInTheDocument();
  });
}

/** 피드백 창이 닫힘 (결과창은 제외하고 셈, Dec-18) */
async function expectFeedbackClosed() {
  await waitFor(() => {
    const result = screen.queryByRole("dialog", { name: "게임 결과" });
    expect(screen.queryAllByRole("dialog").filter((d) => d !== result)).toHaveLength(0);
  });
}

function expectInputState(d: HTMLElement) {
  expect(input(d)).toBeInTheDocument();
  expect(sendButton(d)).toBeInTheDocument();
}

const failureToast = () => screen.findByRole("status");
const lastBody = () => feedbackWebhook.bodies[feedbackWebhook.bodies.length - 1];

// ---- 케이스 ----

describe("F-1. 투표 없이 바로 입력", () => {
  it("F-1-4: 엔터는 줄바꿈이고 보내지 않음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    const box = input(d)!;
    await user.click(box);
    await user.type(box, "가{Enter}나");
    expect(box).toHaveValue("가\n나");
    expect(feedbackWebhook.bodies).toHaveLength(0);
  });

  it("F-1-5: 501자를 붙여넣으면 500자까지만 들어감", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "가".repeat(501));
    expect((input(d) as HTMLTextAreaElement).value).toHaveLength(500);
  });

  it("F-1-6: 공백만 입력하면 보내기 비활성", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "   ");
    expect(sendButton(d)).toBeDisabled();
  });
});

describe("F-2. 웹훅 요청", () => {
  it("F-2-1: 설정에서 보내기 → 웹훅 본문에 맥락 필드가 있고 식별자가 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "힌트가 더 있으면 좋겠어요");
    await send(user, d);

    expect(feedbackWebhook.bodies).toHaveLength(1);
    const body = lastBody();
    expect(Object.keys(body).sort()).toEqual(
      ["entry", "feedback", "gameStatus", "quizDate", "theme", "timestamp"].sort()
    );
    expect(body).toMatchObject({
      feedback: "힌트가 더 있으면 좋겠어요",
      quizDate: getKSTDateString(),
      theme: "classic",
      entry: "settings",
      gameStatus: "playing",
    });
  });

  it("F-2-2: 정답 맞힌 날 결과창에서 보내기 → entry=result, gameStatus=solved", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await write(user, d, "재밌어요");
    await send(user, d);
    expect(lastBody()).toMatchObject({ entry: "result", gameStatus: "solved" });
  });

  it("F-2-3: 포기한 날 설정에서 보내기 → entry=settings, gameStatus=given_up", async () => {
    storeFinished({ givenUp: true });
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "어려워요");
    await send(user, d);
    expect(lastBody()).toMatchObject({ entry: "settings", gameStatus: "given_up" });
  });

  it("F-2-4: excel에서 보내기 → theme=excel", async () => {
    useExcel();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "엑셀 좋아요");
    await send(user, d);
    expect(lastBody()).toMatchObject({ theme: "excel", entry: "settings" });
  });

  it("F-2-5: 응답 전에는 보내기 비활성, 다시 눌러도 요청 1회", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    const held = feedbackWebhook.holdNext();
    await send(user, d);
    expect(sendButton(d)).toBeDisabled();
    await user.click(sendButton(d)!);
    await held.release();
    expect(feedbackWebhook.bodies).toHaveLength(1);
  });
});

describe("F-3. 퀴즈 날짜(KST)당 1회", () => {
  it("F-3-1: 보내기 성공 → 창은 열린 채 보낸 상태, 토스트 없음, 저장값이 오늘, alert 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    await expectSentState(d);
    // 감사 안내(창 안 status) 말고는 status가 없음 = 토스트 없음
    expect(screen.getAllByRole("status").every((el) => d.contains(el))).toBe(true);
    expect(localStorage.getItem(SENT_KEY)).toBe(getKSTDateString());
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("F-3-2: 보낸 뒤 닫고 설정에서 다시 열면 보낸 상태, 진입 버튼은 활성", async () => {
    const { user } = await renderHome();
    let d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    await expectSentState(d);
    await closeDialog(user, d);

    await user.click(screen.getByRole("button", { name: "설정" }));
    expect(await screen.findByRole("button", { name: /피드백 남기기/ })).toBeEnabled();
    await user.click(settingsFeedbackButton()!);
    d = await feedbackDialog();
    await expectSentState(d);
  });

  it("F-3-3: 오늘 보냄 + 정답 맞힘 → 결과창 피드백 버튼은 활성, 열면 보낸 상태", async () => {
    localStorage.setItem(SENT_KEY, getKSTDateString());
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await expectSentState(d);
  });

  it("F-3-4: 보낸 뒤 새로고침해도 보낸 상태", async () => {
    const first = await renderHome();
    const d = await openFromSettings(first.user);
    await write(first.user, d, "의견");
    await send(first.user, d);
    await expectSentState(d);
    first.unmount();

    const { user } = await renderHome();
    await expectSentState(await openFromSettings(user));
  });

  it("F-3-5: 오늘 보냄 → excel로 바꿔 열어도 보낸 상태", async () => {
    localStorage.setItem(SENT_KEY, getKSTDateString());
    useExcel();
    const { user } = await renderHome();
    await expectSentState(await openFromSettings(user));
  });

  it("F-3-6: 어제 보냄 → 오늘은 입력 가능", async () => {
    localStorage.setItem(SENT_KEY, kstYesterday());
    const { user } = await renderHome();
    expectInputState(await openFromSettings(user));
  });

  it.each([
    ["2026-11-10", "sent"],
    ["2026-11-09", "input"],
  ])("F-3-7: 기기 LA, KST 11/10(LA 11/9) 오후, 저장값 %s → %s", async (stored, expected) => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    localStorage.setItem(SENT_KEY, stored);
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    if (expected === "sent") await expectSentState(d);
    else expectInputState(d);
  });

  it("F-3-8: 23:59:59에 열고 00:00에 보내면 보내는 시점 날짜로 기록", async () => {
    setClock("Asia/Seoul", KST_BEFORE_MIDNIGHT);
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    vi.setSystemTime(new Date(KST_MIDNIGHT));
    await send(user, d);
    expect(lastBody()).toMatchObject({ quizDate: "2026-11-11" });
    await waitFor(() => expect(localStorage.getItem(SENT_KEY)).toBe("2026-11-11"));
  });
});

describe("F-6. 닫으면 연 곳으로", () => {
  const closeX = (user: User, d: HTMLElement) => user.click(within(d).getByRole("button", { name: /close/i }));

  it("F-6-1: 결과창에서 연 피드백 창을 보내지 않고 닫으면 결과창이 다시 열림", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await closeX(user, d);
    await expectFeedbackClosed();
    expect(await screen.findByRole("dialog", { name: "게임 결과" })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("F-6-2: 결과창에서 연 창으로 보낸 뒤에도 창은 열려 있고, 닫으면 결과창이 다시 열림", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await write(user, d, "재밌어요");
    await send(user, d);
    await expectSentState(d);
    expect(screen.queryByRole("dialog", { name: "게임 결과" })).not.toBeInTheDocument();
    await closeX(user, d);
    await expectFeedbackClosed();
    expect(await screen.findByRole("dialog", { name: "게임 결과" })).toBeInTheDocument();
  });

  it("F-6-3: 설정에서 연 창을 닫으면 메인으로 (결과창을 열지 않음)", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await closeX(user, d);
    await waitFor(() => expect(screen.queryAllByRole("dialog")).toHaveLength(0));
  });
});

describe("F-4. 전송 실패", () => {
  it.each([
    ["500", () => feedbackWebhook.failNext()],
    ["네트워크 오류", () => feedbackWebhook.networkErrorNext()],
  ])("F-4-1, F-4-2: 웹훅 %s → 실패 토스트, 입력 유지, 저장 안 함, alert 없음", async (_label, failNext) => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    failNext();
    await send(user, d);

    expect(await failureToast()).toBeInTheDocument();
    expect(input(d)).toHaveValue("의견");
    await waitFor(() => expect(sendButton(d)).toBeEnabled());
    expect(localStorage.getItem(SENT_KEY)).toBeNull();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("F-4-3: 실패 뒤 다시 보내 성공하면 보낸 상태", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackWebhook.failNext();
    await send(user, d);
    await failureToast();
    await waitFor(() => expect(sendButton(d)).toBeEnabled());

    await send(user, d);
    expect(feedbackWebhook.bodies).toHaveLength(2);
    await expectSentState(d);
    expect(localStorage.getItem(SENT_KEY)).toBe(getKSTDateString());
  });

  it("F-4-4: excel에서 웹훅 500 → 실패 토스트, 입력 유지, 저장 안 함", async () => {
    useExcel();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackWebhook.failNext();
    await send(user, d);

    expect(await failureToast()).toBeInTheDocument();
    expect(input(d)).toHaveValue("의견");
    expect(localStorage.getItem(SENT_KEY)).toBeNull();
  });
});

describe("F-5. Amplitude", () => {
  it("F-5-1: 열 때마다 Feedback Opened (진입점·테마)", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await closeDialog(user, d);
    await openFromResult(user);

    expect(amplitudeEvents("Feedback Opened")).toEqual([
      expect.objectContaining({ entry: "settings", theme: "classic" }),
      expect.objectContaining({ entry: "result", theme: "classic" }),
    ]);
  });

  it("F-5-2: 보내기 성공 → Feedback Submitted에 글자 수만, 본문은 어디에도 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "좋아요 굿");
    await send(user, d);
    await expectSentState(d);

    const submitted = amplitudeEvents("Feedback Submitted");
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toMatchObject({ length: 5, entry: "settings", theme: "classic" });
    expect(JSON.stringify(vi.mocked(amplitude.track).mock.calls)).not.toContain("좋아요 굿");
    expect(amplitudeEvents("Survey Vote")).toHaveLength(0);
  });

  it("F-5-3: 보내기 실패 → Feedback Submitted 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackWebhook.failNext();
    await send(user, d);
    await failureToast();
    expect(amplitudeEvents("Feedback Submitted")).toHaveLength(0);
  });
});
