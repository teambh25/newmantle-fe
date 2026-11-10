// 화면 레벨: 사용자 조작으로 드러나는 규칙 (docs/tasks/hint-giveup-fix/verification.md)
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 화면은 실제 컴포넌트를 렌더링한다.
// 문구는 검증하지 않는다. 버튼은 역할과 대략적인 이름으로만 찾는다.
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewMantleForm from "./index";
import { ANSWER, gameServer } from "@/test/fakeGameServer";
import { amplitudeEvents, GAME_DATE } from "@/test/gameHarness";

type User = ReturnType<typeof userEvent.setup>;

async function setup() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<NewMantleForm />);
  // 게임 날짜가 정해진 뒤(마운트 직후) 조작한다
  await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
  return { user, ...view };
}

const hintButton = () => screen.getByRole("button", { name: "힌트" });
const giveUpButton = () => screen.getByRole("button", { name: "포기" });
const input = () => screen.getByRole("textbox");
const submitButton = () => screen.getByRole("button", { name: /제출/ });
const dialog = () => screen.queryByRole("dialog");

/** 포기 결과가 화면에 표시됐는지 */
const givenUpShown = () => screen.queryAllByText(/포기하셨습니다/).length > 0;
/** 결과 창에 표시된 시도 횟수 */
function resultAttempts(): number | null {
  const withNumber = screen
    .queryAllByText(/포기하셨습니다|맞히셨네요/)
    .map((el) => el.textContent?.match(/\d+/)?.[0])
    .find(Boolean);
  return withNumber ? Number(withNumber) : null;
}

/** 확인 창의 선택지 (X 닫기 버튼 제외) */
function dialogOptions() {
  const d = screen.getByRole("dialog");
  const buttons = within(d)
    .getAllByRole("button")
    .filter((b) => !/^close$/i.test(b.textContent?.trim() ?? ""));
  const name = (b: HTMLElement) => b.textContent ?? "";
  return {
    all: buttons,
    consonant: buttons.find((b) => /초성/.test(name(b))),
    giveUp: buttons.find((b) => /포기/.test(name(b))),
    continue: buttons.find((b) => /계속/.test(name(b)) && !/초성/.test(name(b))),
  };
}
const closeButton = () =>
  within(screen.getByRole("dialog")).getByRole("button", { name: /close/i });

async function submitWord(user: User, word: string, rank?: number) {
  if (rank !== undefined) gameServer.setRank(word, rank);
  const before = gameServer.count("guess");
  await user.type(input(), word);
  await user.click(submitButton());
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  await waitFor(() => expect(input()).toBeEnabled());
}

async function openGiveUpDialog(user: User) {
  await user.click(giveUpButton());
  await waitFor(() => expect(dialog()).toBeInTheDocument());
}

async function takeConsonantHint(user: User) {
  await openGiveUpDialog(user);
  await user.click(dialogOptions().consonant!);
  await waitFor(() => expect(gameServer.consonantHintCount()).toBe(1));
  await waitFor(() => expect(giveUpButton()).toBeEnabled());
}

async function giveUpViaDialog(user: User) {
  await openGiveUpDialog(user);
  await user.click(dialogOptions().giveUp!);
  await waitFor(() => expect(givenUpShown()).toBe(true));
}

// ---------------------------------------------------------------------------

describe("A. 일반 힌트 버튼", () => {
  it("A-6-3: 18위 단어 제출 후 → 힌트 버튼 비활성, 포기 버튼 활성", async () => {
    const { user } = await setup();
    await submitWord(user, "가까운말", 18);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeEnabled();
  });

  it("A-6-4: 18위 상태에서 포기 버튼 → 초성 힌트 선택 → 초성 힌트 받음", async () => {
    const { user } = await setup();
    await submitWord(user, "가까운말", 18);
    await takeConsonantHint(user);
    expect(dialog()).not.toBeInTheDocument();
  });
});

describe("B. 초성 힌트 / 확인 창", () => {
  it("B-2-1: 초성 미사용 상태에서 포기 버튼 → 서버 요청 없이 확인 창, 선택지 2개 (초성 힌트 / 포기)", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.all).toHaveLength(2);
    expect(opts.consonant).toBeDefined();
    expect(opts.giveUp).toBeDefined();
    expect(gameServer.count("hint")).toBe(0);
    expect(gameServer.count("give-up")).toBe(0);
  });

  it("B-2-2: 포기 버튼 → 창 닫기를 3번 반복해도 매번 확인 창, 초성 힌트가 바로 지급되지 않음", async () => {
    const { user } = await setup();
    for (let i = 0; i < 3; i++) {
      await openGiveUpDialog(user);
      expect(dialogOptions().consonant).toBeDefined();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    }
    expect(gameServer.count("hint")).toBe(0);
  });

  it("B-1-1 / B-2-3: 입력 0개에서 초성 힌트 선택 → 0위 요청 1회, 창 닫힘, 게임 계속", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    expect(dialog()).not.toBeInTheDocument();
    expect(hintButton()).toBeEnabled();
    expect(giveUpButton()).toBeEnabled();
    expect(givenUpShown()).toBe(false);
  });

  it("B-5-1: 초성 힌트를 받은 뒤 포기 버튼 → 초성 선택지 없음 (계속 도전 / 포기)", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.consonant).toBeUndefined();
    expect(opts.continue).toBeDefined();
    expect(opts.giveUp).toBeDefined();
    expect(opts.all).toHaveLength(2);
  });

  it("B-5-2: 초성 힌트를 받고 새로고침(다시 렌더링) → 포기 버튼 확인 창에 초성 선택지 없음", async () => {
    const first = await setup();
    await takeConsonantHint(first.user);
    first.unmount();

    const { user } = await setup();
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeUndefined();
  });
});

describe("C. 포기", () => {
  it("C-1-1: 입력 0개에서 포기 선택 → 포기 요청, 정답 공개, 게임 종료", async () => {
    const { user } = await setup();
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0);
  });

  it("C-2-1: 초성 사용 후 포기 버튼 → 선택지 2개 (계속 도전 / 포기)", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.all).toHaveLength(2);
    expect(opts.continue).toBeDefined();
    expect(opts.giveUp).toBeDefined();
  });

  describe.each([
    ["초성 미사용", false],
    ["초성 사용 후", true],
  ])("C-2 (%s)", (_label, consonantUsed) => {
    async function prepare() {
      const s = await setup();
      if (consonantUsed) await takeConsonantHint(s.user);
      return s;
    }
    const requestsSnapshot = () => ({
      hint: gameServer.count("hint"),
      giveUp: gameServer.count("give-up"),
    });

    it("C-2-2: ESC로 닫기 → 요청 없음, 상태 변화 없음", async () => {
      const { user } = await prepare();
      const before = requestsSnapshot();
      await openGiveUpDialog(user);
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(requestsSnapshot()).toEqual(before);
      expect(giveUpButton()).toBeEnabled();
      expect(hintButton()).toBeEnabled();
    });

    it("C-2-2: X 버튼으로 닫기 → 요청 없음, 상태 변화 없음", async () => {
      const { user } = await prepare();
      const before = requestsSnapshot();
      await openGiveUpDialog(user);
      await user.click(closeButton());
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
      expect(requestsSnapshot()).toEqual(before);
      expect(giveUpButton()).toBeEnabled();
    });

    it("C-2-4: 창이 열리면 포커스는 계속 플레이 쪽 선택지 (포기 선택지 아님)", async () => {
      const { user } = await prepare();
      await openGiveUpDialog(user);
      const opts = dialogOptions();
      const keepPlaying = consonantUsed ? opts.continue : opts.consonant;
      await waitFor(() => expect(keepPlaying).toHaveFocus());
      expect(opts.giveUp).not.toHaveFocus();
    });
  });

  it("C-2-3: 초성 사용 후 계속 도전 선택 → 요청 없음, 창 닫힘", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    const hintsBefore = gameServer.count("hint");
    await openGiveUpDialog(user);
    await user.click(dialogOptions().continue!);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(gameServer.count("hint")).toBe(hintsBefore);
    expect(gameServer.count("give-up")).toBe(0);
    expect(giveUpButton()).toBeEnabled();
  });

  it("C-2-5: 확인 창에 포기 결과 안내 문구가 있음 (내용은 검증하지 않음)", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(/\S/);
  });

  it("C-3-1: 정답을 맞힌 뒤 포기 버튼은 비활성이고, 눌러도 안내·확인 창이 뜨지 않음", async () => {
    const { user } = await setup();
    await submitWord(user, "아무말", -1);
    await submitWord(user, ANSWER.word);
    expect(giveUpButton()).toBeDisabled();
    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("C-4-3: 입력 3개 후 포기 → 결과 창 3, 공유 링크 shared_attempts=3, 공유 이벤트 시도 횟수 3", async () => {
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user);

    expect(resultAttempts()).toBe(3);

    await user.click(screen.getByRole("button", { name: /도전장/ }));
    const link = await waitFor(async () => {
      const text = await navigator.clipboard.readText();
      expect(text).toContain("shared_attempts");
      return text;
    });
    expect(new URL(link).searchParams.get("shared_attempts")).toBe("3");
    expect(amplitudeEvents("Result Shared")).toEqual([
      expect.objectContaining({ attempts: 3 }),
    ]);
  });

  it("C-4-4: 친구 공유 링크(shared_attempts=5)로 진입, 입력 3개 후 포기 → 친구 비교에 내 시도 3", async () => {
    window.history.replaceState(null, "", `/?shared_attempts=5&game_date=${GAME_DATE}`);
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user);

    const myLabel = await screen.findByText("나의 시도");
    expect(myLabel.parentElement).toHaveTextContent(/(^|\D)3(\D|$)/);
  });

  it("C-5-3: 포기 후 → 힌트·포기 버튼 비활성, 입력창·제출 버튼 활성", async () => {
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
    expect(input()).toBeEnabled();
    expect(submitButton()).toBeEnabled();
  });
});

describe("D. 공통 / 예외", () => {
  it("D-1-2: 2번째에 정답 후 → 힌트·포기 버튼 비활성, 입력창·제출 버튼 활성", async () => {
    const { user } = await setup();
    await submitWord(user, "아무말", -1);
    await submitWord(user, ANSWER.word);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
    expect(input()).toBeEnabled();
    expect(submitButton()).toBeEnabled();
  });

  it("D-2-2 / D-2-3: 힌트 응답 전 → 버튼 비활성, 다시 눌러도 요청 1회 → 응답 후 다시 활성", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint");

    await user.click(hintButton());
    await waitFor(() => expect(hintButton()).toBeDisabled());
    await user.click(hintButton());
    expect(gameServer.count("hint")).toBe(1);

    await held.release();
    await waitFor(() => expect(hintButton()).toBeEnabled());
    expect(gameServer.count("hint")).toBe(1);
  });

  it("D-2-4: 24위에서 힌트(20위) 응답 후 → 잠금은 풀렸지만 A-6 규칙으로 비활성 유지", async () => {
    const { user } = await setup();
    await submitWord(user, "꽤가까운말", 24);
    const held = gameServer.holdNext("hint");

    await user.click(hintButton());
    await waitFor(() => expect(hintButton()).toBeDisabled());
    await held.release();

    await waitFor(() => expect(screen.getByText("힌트20")).toBeInTheDocument());
    expect(gameServer.normalHintRanks()).toEqual([20]);
    expect(hintButton()).toBeDisabled();
  });

  it("D-2-7: 초성 힌트 선택 → 응답 전 포기 버튼 비활성, 눌러도 확인 창 안 열림 → 응답 후 다시 활성", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint");

    await openGiveUpDialog(user);
    await user.click(dialogOptions().consonant!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());

    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();
    expect(gameServer.consonantHintCount()).toBe(1);

    await held.release();
    await waitFor(() => expect(giveUpButton()).toBeEnabled());
    expect(gameServer.consonantHintCount()).toBe(1);
  });

  it("D-2-8: 포기 선택 → 응답 전 포기 버튼 비활성 → 응답 후 게임 종료로 비활성 유지", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("give-up");

    await openGiveUpDialog(user);
    await user.click(dialogOptions().giveUp!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();

    await held.release();
    await waitFor(() => expect(givenUpShown()).toBe(true));
    expect(giveUpButton()).toBeDisabled();
    expect(gameServer.count("give-up")).toBe(1);
  });

  it("D-2-10: 단어 제출 응답 전 → 입력창·제출 버튼 비활성 (기존 동작 유지)", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("guess");

    await user.type(input(), "기다리는말");
    await user.click(submitButton());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(submitButton()).toBeDisabled();

    await held.release();
    await waitFor(() => expect(input()).toBeEnabled());
    expect(submitButton()).toBeEnabled();
    expect(gameServer.count("guess")).toBe(1);
  });

  it("D-3-4: 힌트 요청 실패 후 → 힌트 버튼 다시 활성", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint");
    await user.click(hintButton());
    await waitFor(() => expect(hintButton()).toBeDisabled());
    await held.fail();
    await waitFor(() => expect(hintButton()).toBeEnabled());
  });

  it("D-3-4: 포기 요청 실패 후 → 포기 버튼 다시 활성, 게임 진행 중", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("give-up");
    await openGiveUpDialog(user);
    await user.click(dialogOptions().giveUp!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await held.fail();
    await waitFor(() => expect(giveUpButton()).toBeEnabled());
    expect(givenUpShown()).toBe(false);
  });

  it("D-4-1: 포기 버튼 → 창 닫기 → 새로고침 → 포기 버튼 → 확인 창이 뜸 (바로 지급되지 않음)", async () => {
    const first = await setup();
    await openGiveUpDialog(first.user);
    await first.user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    first.unmount();

    const { user } = await setup();
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeDefined();
    expect(gameServer.count("hint")).toBe(0);
  });
});
