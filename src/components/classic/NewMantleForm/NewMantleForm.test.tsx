// 화면 레벨: 사용자 조작으로 드러나는 규칙 (docs/tasks/hint-giveup-fix/verification.md)
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 화면은 실제 컴포넌트를 렌더링한다.
// 문구는 검증하지 않는다. 버튼은 역할과 대략적인 이름으로만 찾는다.
import { describe, expect, it } from "vitest";
import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewMantleForm from "./index";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
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

/** 게임 결과가 표시됐는지: 결과창(이름 "게임 결과" dialog)이 열려 있음 (docs/tasks/ui/result-box/plan.md) */
const givenUpShown = () => screen.queryByRole("dialog", { name: "게임 결과" }) !== null;

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

/** 정답 제출 → 결과창이 열리면 닫고 게임 화면으로 (결과창을 닫을 때까지 입력창이 잠긴다) */
async function submitAnswer(user: User) {
  const before = gameServer.count("guess");
  await user.type(input(), ANSWER.word);
  await user.click(submitButton());
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  await closeResultDialog(user);
  expect(input()).toBeEnabled();
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

/** 게임이 끝나면 잠시 뒤 열리는 결과창 (docs/tasks/ui/result-box/plan.md) */
const findResultDialog = () => screen.findByRole("dialog", { name: "게임 결과" }, { timeout: 3000 });

/** 결과창을 닫고 게임 화면으로 돌아간다 (열려 있는 동안 바깥 버튼은 aria-hidden) */
async function closeResultDialog(user: User) {
  await user.click(within(await findResultDialog()).getByRole("button", { name: /close/i }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "게임 결과" })).not.toBeInTheDocument());
}

/** 포기 → 결과창에 포기 결과가 뜰 때까지. 기본은 결과창을 닫고 게임 화면으로 돌아온다 */
async function giveUpViaDialog(user: User, { keepResultOpen = false } = {}) {
  await openGiveUpDialog(user);
  await user.click(dialogOptions().giveUp!);
  await findResultDialog();
  expect(givenUpShown()).toBe(true);
  if (!keepResultOpen) await closeResultDialog(user);
}

/** 방금 입력 칸 = 진행 상황 카드 (docs/tasks/ui/progress-card/plan.md 4) */
const latestCard = () => screen.queryByRole("region", { name: "방금 입력" });
const historyTable = () => screen.queryByRole("table", { name: "기록" });
/** 표 안 머리줄을 뺀 줄 */
const rowsOf = (t: HTMLElement | null) =>
  t ? within(t).queryAllByRole("row").filter((r) => within(r).queryAllByRole("columnheader").length === 0) : [];
/** 카드의 방금 항목(말풍선). 아무것도 안 했으면 빈 배열 */
function latestItems(): HTMLElement[] {
  const card = latestCard();
  const bubble = card && within(card).queryByRole("status");
  return bubble ? [bubble] : [];
}
/** 보이는 단어 줄: 방금 항목 + 기록 표 (없으면 빈 배열) */
function bodyRows() {
  return [...latestItems(), ...rowsOf(historyTable())];
}
const firstRowText = () => bodyRows()[0]?.textContent ?? "";
const rowsWith = (word: string) => bodyRows().filter((r) => r.textContent?.includes(word));
/** 저장값에 든 단어 */
const storedWords = (): string[] =>
  (JSON.parse(localStorage.getItem("newmantle_game_data") ?? "{}").submittedWords ?? []).map(
    (w: { word: string }) => w.word,
  );

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
  it("B-2-1: 초성 미사용 상태에서 포기 버튼 → 서버 요청 없이 확인 창, 선택지 3개 (초성 힌트 / 포기 / 힌트 없이 계속)", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.all).toHaveLength(3);
    expect(opts.consonant).toBeDefined();
    expect(opts.giveUp).toBeDefined();
    expect(opts.continue).toBeDefined();
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

  it("B-2-4: 초성 미사용 상태에서 힌트 없이 계속 선택 → 요청 없음, 창 닫힘, 다음에도 초성 선택지 있음", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    await user.click(dialogOptions().continue!);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(gameServer.count("hint")).toBe(0);
    expect(gameServer.count("give-up")).toBe(0);
    expect(giveUpButton()).toBeEnabled();
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeDefined();
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

});

describe("C. 포기", () => {
  it("C-1-1: 입력 0개에서 포기 선택 → 포기 요청, 정답 공개, 게임 종료", async () => {
    const { user } = await setup();
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0);
  });

  // 닫는 방법(ESC·X·바깥)은 Radix Dialog가 맡는다. 앱 규칙 "닫으면 요청 없음"만 본다 (초성 미사용 상태는 B-2-2가 ESC로 봄)
  it("C-2-2: 초성 사용 후 X로 닫기 → 요청 없음, 상태 변화 없음", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    const before = { hint: gameServer.count("hint"), giveUp: gameServer.count("give-up") };
    await openGiveUpDialog(user);
    await user.click(closeButton());
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect({ hint: gameServer.count("hint"), giveUp: gameServer.count("give-up") }).toEqual(before);
    expect(giveUpButton()).toBeEnabled();
    expect(hintButton()).toBeEnabled();
  });

  it.each([
    ["초성 미사용", false],
    ["초성 사용 후", true],
  ])("C-2-4 (%s): 창이 열리면 포커스는 계속 플레이 쪽 선택지 (포기 선택지 아님)", async (_label, consonantUsed) => {
    const { user } = await setup();
    if (consonantUsed) await takeConsonantHint(user);
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    const keepPlaying = consonantUsed ? opts.continue : opts.consonant;
    await waitFor(() => expect(keepPlaying).toHaveFocus());
    expect(opts.giveUp).not.toHaveFocus();
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

  it("C-2-6: 초성 사용 후 포기 선택 → 포기 요청 1회, 정답 공개, 게임 종료", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0);
    expect(giveUpButton()).toBeDisabled();
  });

  it("C-3-1: 정답을 맞힌 뒤 포기 버튼은 비활성이고, 눌러도 안내·확인 창이 뜨지 않음", async () => {
    const { user } = await setup();
    await submitWord(user, "아무말", -1);
    await submitAnswer(user);
    expect(giveUpButton()).toBeDisabled();
    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("C-4-3: 입력 3개 후 포기 → 결과 창 3, 공유 링크 shared_attempts=3, 공유 이벤트 시도 횟수 3", async () => {
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user, { keepResultOpen: true });

    // 결과창에 시도 횟수 3이 보임 (다른 숫자와 붙어 있지 않은 3)
    const result = screen.getByRole("dialog", { name: "게임 결과" });
    expect(within(result).getByText(/(^|\D)3(\D|$)/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /공유하기/ }));
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
    await submitAnswer(user);
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

    // 힌트 단어는 카드 배너와 기록 표 두 곳에 보인다
    await waitFor(() => expect(screen.getAllByText("힌트20").length).toBeGreaterThan(0));
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
    await findResultDialog();
    expect(givenUpShown()).toBe(true);
    await closeResultDialog(user);
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

  it("D-4-2: 포기 후 새로고침 → 포기 결과 표시 유지, 힌트·포기 버튼 비활성", async () => {
    const first = await setup();
    await submitWord(first.user, "하나", -1);
    await giveUpViaDialog(first.user);
    first.unmount();

    const { user } = await setup();
    // 새로고침 후에는 결과창이 자동으로 열리지 않으므로 다시 보기로 확인한다
    await user.click(screen.getByRole("button", { name: /결과창 보기/ }));
    await findResultDialog();
    expect(givenUpShown()).toBe(true);
    await closeResultDialog(user);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });

  it("D-4-3: 2번째에 정답 후 새로고침 → 힌트·포기 버튼 비활성", async () => {
    const first = await setup();
    await submitWord(first.user, "아무말", -1);
    await submitAnswer(first.user);
    first.unmount();

    await setup();
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });
});

// 제출 버튼 대신 엔터 (docs/tasks/ui/input/verification.md E)
describe("E. 엔터 제출", () => {
  it("E-1: 단어 입력 후 엔터 → 추측 요청 1회", async () => {
    const { user } = await setup();
    await user.type(input(), "엔터단어{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(1));
  });

});

// 없는 단어 안내 (docs/tasks/ui/input/verification.md Y)
describe("Y. 없는 단어", () => {
  it("Y-1-1: 없는 단어 제출 → 입력창 오류 상태·알림 없음 (안내는 카드 배너)", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Y-2-1: 없는 단어 제출 → 입력창 비움, 알림에 단어, 표 첫 줄에 임시 줄, 저장 안 됨", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).toHaveValue("");
    expect(firstRowText()).toContain("없는말");
    expect(storedWords()).not.toContain("없는말");
  });

  it("Y-2-2: 임시 줄은 입력창에 글자를 쳐도 남음", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.type(input(), "가");
    expect(firstRowText()).toContain("없는말");
  });

  it("Y-2-3: 임시 줄 뒤 있는 단어 제출 → 임시 줄 사라지고 첫 줄은 새 단어", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await submitWord(user, "사과", 500);
    await waitFor(() => expect(rowsWith("없는말")).toHaveLength(0));
    expect(firstRowText()).toContain("사과");
  });

  it("Y-2-5: 같은 없는 단어를 다시 제출 → 줄은 하나, 요청은 두 번", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await submitWord(user, "없는말");
    expect(gameServer.count("guess")).toBe(2);
    expect(rowsWith("없는말")).toHaveLength(1);
  });

  it("Y-2-11: 없는 단어 뒤 다른 없는 단어 제출 중 → 방금 입력 칸·기록이 그대로, 응답 뒤 새 없는 단어", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    gameServer.setUnknown("없는말둘");
    await submitWord(user, "없는말");
    const held = gameServer.holdNext("guess");
    await user.type(input(), "없는말둘");
    await user.click(submitButton());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(latestItems()[0].textContent).toContain("없는말");
    expect(rowsOf(historyTable()).map((r) => r.textContent)).toEqual([
      expect.stringContaining("사과"),
      expect.stringContaining("바나나"),
    ]);
    await held.release();
    await waitFor(() => expect(latestItems()[0].textContent).toContain("없는말둘"));
    expect(rowsOf(historyTable())).toHaveLength(2);
  });

  it("Y-2-12: 없는 단어 뒤 직전 단어를 다시 제출 → 임시 줄 사라지고 첫 줄은 그 단어(반복 아이콘)", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.type(input(), "바나나");
    await user.click(submitButton());
    await waitFor(() => expect(rowsWith("없는말")).toHaveLength(0));
    expect(firstRowText()).toContain("바나나");
    expect(within(bodyRows()[0]).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument();
  });

});

// 이미 제출한 단어 (docs/tasks/ui/input/verification.md Y-4, input/plan.md 3)
describe("Y-4. 이미 제출한 단어", () => {
  async function resubmit(user: User, word: string) {
    await user.type(input(), word);
    await user.click(submitButton());
    await waitFor(() => expect(input()).toHaveValue(""));
  }

  it("Y-4-1: 이미 낸 단어를 다시 → 요청 없음, 첫 줄이 그 단어이고 반복 아이콘", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 10);
    await submitWord(user, "바나나", 500);
    await resubmit(user, "사과");
    expect(gameServer.count("guess")).toBe(2);
    await waitFor(() => expect(firstRowText()).toContain("사과"));
    expect(within(bodyRows()[0]).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument();
  });

});

// 요청 실패 안내 (docs/tasks/ui/input/verification.md Y-3, 안내 자리는 progress-card/plan.md 3)
describe("Y-3. 요청 실패는 카드 배너 알림", () => {
  /** 토스트가 뜨는지도 보기 위해 Toaster를 같이 렌더링한다 */
  async function setupWithToaster() {
    // 토스트 상태는 모듈 전역이라 앞 테스트(링크 복사 등)의 토스트를 닫아 둔다
    const toasts = renderHook(() => useToast());
    act(() => toasts.result.current.dismiss());
    toasts.unmount();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <>
        <NewMantleForm />
        <Toaster />
      </>
    );
    await waitFor(() => expect(input()).toBeEnabled());
    return { user };
  }
  /** 알림은 카드(배너) 안에만 있고 입력창 아래 등 카드 밖에는 없음 (progress-card/plan.md 3) */
  async function alertInCardOnly() {
    await waitFor(() => expect(within(latestCard()!).getByRole("alert")).toBeInTheDocument());
    expect(screen.getAllByRole("alert").every((el) => latestCard()!.contains(el))).toBe(true);
  }
  /** 토스트(status). 카드 말풍선도 status라 카드 밖만 센다 */
  const toastShown = () => screen.queryAllByRole("status").some((el) => !latestCard()?.contains(el));

  async function failHint(user: User) {
    gameServer.failNext("hint");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(hintButton()).toBeEnabled());
  }

  it("Y-3-1: 서버 오류로 제출 실패 → 단어가 남고 오류 상태 아님, 카드 안 알림, 토스트 없음, 저장 안 됨", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    expect(input()).toHaveValue("사과");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
    expect(storedWords()).not.toContain("사과");
  });

  it("Y-3-2: 제출 실패 뒤 엔터만 다시 → 같은 단어로 재요청, 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    await user.type(input(), "{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(2));
    expect(gameServer.requests.filter((r) => r.kind === "guess").map((r) => r.word)).toEqual(["사과", "사과"]);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    await waitFor(() => expect(storedWords()).toContain("사과"));
    // 기록 표에 결과 줄 하나 (배너에도 같은 단어)
    expect(rowsOf(historyTable()).filter((r) => r.textContent?.includes("사과"))).toHaveLength(1);
  });

  it("Y-3-3: 힌트 실패 → 카드 안 알림, 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
  });

  it("Y-3-6: 힌트 실패 뒤 힌트 다시 (성공) → 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await screen.findByRole("alert");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("Y-3-7: 힌트 실패 뒤 입력창에 글자 입력 → 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await screen.findByRole("alert");
    await user.type(input(), "가");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Y-3-9: 연속 두 번 실패 → 두 번째에 토스트", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
    gameServer.failNext("guess");
    await user.type(input(), "{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(2));
    await waitFor(() => expect(toastShown()).toBe(true));
  });

  it("Y-3-10: 실패 사이에 성공이 있으면 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await submitWord(user, "사과", 500);
    gameServer.failNext("guess");
    await submitWord(user, "바나나");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
  });

  it("Y-3-8: 없는 단어 안내 중 힌트 실패 → 안내는 하나, 입력창은 오류 상태 아님", async () => {
    const { user } = await setupWithToaster();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await failHint(user);
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(1));
    expect(screen.getByRole("alert")).not.toHaveTextContent("없는말");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
  });
});

// 진행 상황 카드 (docs/tasks/ui/progress-card/verification.md PC)
describe("PC. 진행 상황 카드", () => {
  const card = () => latestCard()!;
  const meterValue = () => Number(within(card()).getByRole("meter").getAttribute("aria-valuenow"));
  const bubble = () => latestItems()[0];
  /** 정답 자리 아이콘: 진행 중 / 맞힘 / 포기 */
  const endIcon = (name: RegExp) => within(card()).queryByRole("img", { name });
  const END_PLAYING = /정답 자리/;
  const END_SOLVED = /^정답$/;
  const END_GIVEN_UP = /^포기$/;
  /** 카드 왼쪽 위 제출 횟수 (숫자만 본다) */
  const attemptCount = () => within(card()).queryByLabelText("제출 횟수")?.textContent?.match(/\d+/)?.[0];

  it("PC-1-1: 처음 → 영역 있고 배너·제출 횟수 없음, 미터 0, 정답 자리는 진행 중", async () => {
    await setup();
    expect(latestCard()).toBeInTheDocument();
    expect(latestItems()).toHaveLength(0);
    expect(attemptCount()).toBeUndefined();
    expect(meterValue()).toBe(0);
    expect(endIcon(END_PLAYING)).toBeInTheDocument();
  });

  it("PC-1-2: 500위 제출 → 배너에 단어·500위, 제출 횟수 1, 미터 > 0, 기록 표에도 그 단어", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    expect(bubble().textContent).toContain("사과");
    expect(bubble().textContent).toContain("500위");
    // 평소 단어에는 아이콘 없음 (힌트·다시 내기 등 예외만 아이콘)
    expect(within(bubble()).queryByRole("img")).not.toBeInTheDocument();
    expect(attemptCount()).toBe("1");
    expect(meterValue()).toBeGreaterThan(0);
    expect(rowsOf(historyTable())).toHaveLength(1);
  });

  it("PC-2-4: 500위 뒤 힌트 → 미터 오름, 말풍선에 힌트 표시", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    const before = meterValue();
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "힌트로 받은 단어" })).toBeInTheDocument());
    expect(meterValue()).toBeGreaterThan(before);
  });

  it("PC-2-5: 힌트 단어를 다시 입력 → 다시 입력 표시, 힌트 표시 없음", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "힌트로 받은 단어" })).toBeInTheDocument());
    // 가짜 서버는 힌트 단어를 "힌트{순위}"로 준다
    const hintWord = `힌트${gameServer.normalHintRanks()[0]}`;
    await submitWord(user, "바나나", 300);
    await user.type(input(), hintWord);
    await user.click(submitButton());
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument());
    expect(within(bubble()).queryByRole("img", { name: "힌트로 받은 단어" })).not.toBeInTheDocument();
  });

  it("PC-3-2: 500위 뒤 초성 힌트 → 말풍선에 초성·초성 표시, 미터 그대로", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    const before = meterValue();
    await takeConsonantHint(user);
    await waitFor(() => expect(bubble().textContent).toContain("ㅈㄷ"));
    expect(within(bubble()).getByRole("img", { name: "초성 힌트" })).toBeInTheDocument();
    expect(meterValue()).toBe(before);
  });

  it("PC-4-1: 500위 뒤 정답 → 말풍선에 정답, 정답 자리는 맞힘", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await submitAnswer(user);
    await waitFor(() => expect(bubble().textContent).toContain(ANSWER.word));
    expect(endIcon(END_SOLVED)).toBeInTheDocument();
  });

  it("PC-4-2: 500위 뒤 포기 → 말풍선에 정답, 정답 자리는 포기", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await giveUpViaDialog(user);
    await waitFor(() => expect(bubble().textContent).toContain(ANSWER.word));
    expect(endIcon(END_GIVEN_UP)).toBeInTheDocument();
  });

});
