// 화면 레벨: 피드백 창
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as amplitude from "@amplitude/analytics-browser";
import * as Sentry from "@sentry/nextjs";
import Home from "./page";
import { Toaster } from "@/components/ui/toaster";
import { ANSWER } from "@/test/fakeGameServer";
import { feedbackScript } from "@/test/fakeFeedbackScript";
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
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
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
  const before = feedbackScript.requests.length;
  await user.click(sendButton(d)!);
  await waitFor(() => expect(feedbackScript.requests.length).toBe(before + 1));
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

const lastRequest = () => feedbackScript.requests[feedbackScript.requests.length - 1];
const sentryReports = () => vi.mocked(Sentry.captureException).mock.calls;
/** Sentry로 간 내용 전체. Error는 JSON.stringify로 메시지가 빠지므로 직접 펼친다 */
const sentryText = () =>
  JSON.stringify(sentryReports(), (_key, value) =>
    value instanceof Error ? { name: value.name, message: value.message, cause: value.cause } : value
  );

/** 감사 안내(창 안 status) 말고는 status가 없음 = 토스트 없음 */
const expectNoToast = (d: HTMLElement) =>
  expect(screen.getAllByRole("status").every((el) => d.contains(el))).toBe(true);

/**
 * setTimeout까지 가짜 타이머로 바꾼다. setup.ts가 setInterval만 가짜로 깔아 두었으므로 한 번 풀고 다시 깐다 (src/test/README.md 시간).
 * 실제 시간도 같이 흐르게 해 두어(shouldAdvanceTime) waitFor·userEvent가 멈추지 않는다
 */
function fakeTimeouts() {
  vi.useRealTimers();
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
    shouldAdvanceTime: true,
  });
}

// ---- 케이스 ----

describe("입력", () => {
  it("공백만 입력하면 보내기 비활성", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "   ");
    expect(sendButton(d)).toBeDisabled();
  });
});

describe("전송", () => {
  // 보내는 행의 필드 값은 로직 테스트(src/utils/feedback.test.ts)에서 확인한다
  it("피드백을 입력하고 보내기 → Apps Script로 text/plain·keepalive 요청이 한 번 나간다", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    expect(feedbackScript.requests).toHaveLength(1);
    expect(lastRequest()).toMatchObject({
      body: { feedback: "의견" },
      contentType: expect.stringMatching(/^text\/plain/),
      keepalive: true,
    });
  });

  // 응답을 기다리지 않는다 (docs/specs/feedback-migration Dec-3)
  it("Apps Script가 아직 응답하지 않은 상태 → 보내기 → 바로 보낸 상태가 되고, 하루 1회 저장값이 오늘이다", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackScript.holdNext();
    await send(user, d);
    await expectSentState(d);
    expect(localStorage.getItem(SENT_KEY)).toBe(getKSTDateString());
  });
});

describe("퀴즈 날짜(KST)당 1회", () => {
  it("피드백을 입력하고 보내기 → 창은 열린 채 보낸 상태, 토스트 없음, 저장값이 오늘, alert 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    await expectSentState(d);
    expectNoToast(d);
    expect(localStorage.getItem(SENT_KEY)).toBe(getKSTDateString());
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("보낸 뒤 닫고 설정에서 다시 열면 보낸 상태, 진입 버튼은 활성", async () => {
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

  it("오늘 보냄 + 정답 맞힘 → 결과창 피드백 버튼은 활성, 열면 보낸 상태", async () => {
    localStorage.setItem(SENT_KEY, getKSTDateString());
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await expectSentState(d);
  });

  it("보낸 뒤 새로고침해도 보낸 상태", async () => {
    const first = await renderHome();
    const d = await openFromSettings(first.user);
    await write(first.user, d, "의견");
    await send(first.user, d);
    await expectSentState(d);
    first.unmount();

    const { user } = await renderHome();
    await expectSentState(await openFromSettings(user));
  });

  it("오늘 보냄 → excel로 바꿔 열어도 보낸 상태", async () => {
    localStorage.setItem(SENT_KEY, getKSTDateString());
    useExcel();
    const { user } = await renderHome();
    await expectSentState(await openFromSettings(user));
  });

  it("어제 보냄 → 오늘은 입력 가능", async () => {
    localStorage.setItem(SENT_KEY, kstYesterday());
    const { user } = await renderHome();
    expectInputState(await openFromSettings(user));
  });

  it.each([
    ["2026-11-10", "sent"],
    ["2026-11-09", "input"],
  ])("기기 LA, KST 11/10(LA 11/9) 오후, 저장값 %s → %s", async (stored, expected) => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    localStorage.setItem(SENT_KEY, stored);
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    if (expected === "sent") await expectSentState(d);
    else expectInputState(d);
  });

  // 행과 이벤트의 quiz_date는 같은 규칙이라 한 테스트에서 함께 본다 (docs/specs/feedback-migration Dec-9)
  it("게임 화면을 연 채 KST 자정이 지난 뒤 피드백을 보내면 → 행과 Feedback Submitted의 quiz_date는 어제, 하루 1회 저장값은 오늘", async () => {
    setClock("Asia/Seoul", KST_BEFORE_MIDNIGHT);
    const { user } = await renderHome();
    vi.setSystemTime(new Date(KST_MIDNIGHT));
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    await expectSentState(d);
    expect(lastRequest().body).toMatchObject({ quiz_date: "2026-11-10" });
    expect(amplitudeEvents("Feedback Submitted").map((e) => e.quiz_date)).toEqual(["2026-11-10"]);
    expect(localStorage.getItem(SENT_KEY)).toBe("2026-11-11");
  });
});

describe("닫으면 연 곳으로", () => {
  const closeX = (user: User, d: HTMLElement) => user.click(within(d).getByRole("button", { name: /close/i }));

  it("결과창에서 연 피드백 창을 보내지 않고 닫으면 결과창이 다시 열림", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromResult(user);
    await closeX(user, d);
    await expectFeedbackClosed();
    expect(await screen.findByRole("dialog", { name: "게임 결과" })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("결과창에서 연 창으로 보낸 뒤에도 창은 열려 있고, 닫으면 결과창이 다시 열림", async () => {
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

  it("설정에서 연 창을 닫으면 메인으로 (결과창을 열지 않음)", async () => {
    storeFinished();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await closeX(user, d);
    await waitFor(() => expect(screen.queryAllByRole("dialog")).toHaveLength(0));
  });
});

// 실패는 화면에 보이지 않고 Sentry로 알린다 (docs/specs/feedback-migration Dec-3, Dec-4)
describe("전송 실패", () => {
  it.each([
    ["성공 표시 없이 응답", () => feedbackScript.rejectNext()],
    ["네트워크 오류로 실패", () => feedbackScript.networkErrorNext()],
  ])("Apps Script가 %s → 보내기 → Sentry에 피드백 태그로 한 번 보고되고 본문은 없으며, 화면은 보낸 상태 그대로다", async (_label, failNext) => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "비밀 의견");
    failNext();
    await send(user, d);

    await waitFor(() => expect(sentryReports()).toHaveLength(1));
    expect(sentryReports()[0][1]).toMatchObject({ tags: { feature: "feedback" } });
    expect(sentryText()).not.toContain("비밀 의견");
    await expectSentState(d);
    expectNoToast(d);
  });

  it("Apps Script가 제한 시간 넘게 응답하지 않음 → 제한 시간이 지나면 Sentry에 한 번 보고된다", async () => {
    fakeTimeouts();
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackScript.holdNext();
    await send(user, d);
    expect(sentryReports()).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(10_000));
    await waitFor(() => expect(sentryReports()).toHaveLength(1));
  });

  it("Apps Script가 성공을 돌려줌 → 보내기 → Sentry에 보고되지 않는다", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    await send(user, d);
    await expectSentState(d);
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(sentryReports()).toHaveLength(0);
  });
});

describe("Amplitude", () => {
  it("보내기 → Feedback Submitted 1회, 본문은 어디에도 없음", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "좋아요 굿");
    await send(user, d);
    await expectSentState(d);

    const submitted = amplitudeEvents("Feedback Submitted");
    expect(submitted).toHaveLength(1);
    expect(JSON.stringify(vi.mocked(amplitude.track).mock.calls)).not.toContain("좋아요 굿");
  });

  // 저장 성공 여부가 아니라 보내려 한 행동을 남긴다 (docs/specs/feedback-migration Dec-16)
  it("Apps Script가 성공 표시 없이 응답 → 보내기 → Feedback Submitted는 1회 나간다", async () => {
    const { user } = await renderHome();
    const d = await openFromSettings(user);
    await write(user, d, "의견");
    feedbackScript.rejectNext();
    await send(user, d);
    await waitFor(() => expect(sentryReports()).toHaveLength(1));
    expect(amplitudeEvents("Feedback Submitted")).toHaveLength(1);
  });
});
