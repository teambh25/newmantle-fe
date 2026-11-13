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
import { getKSTDateString } from "@/utils/date";

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

const latestTable = () => screen.queryByRole("table", { name: "방금 입력" });
const historyTable = () => screen.queryByRole("table", { name: "기록" });
/** 표 안 머리줄을 뺀 줄 */
const rowsOf = (t: HTMLElement | null) =>
  t ? within(t).queryAllByRole("row").filter((r) => within(r).queryAllByRole("columnheader").length === 0) : [];
/** 보이는 단어 줄: 방금 입력 칸 + 기록 표 (표가 없으면 빈 배열) */
function bodyRows() {
  return [...rowsOf(latestTable()), ...rowsOf(historyTable())];
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

  it("B-5-2: 초성 힌트를 받고 새로고침(다시 마운트) → 포기 버튼 확인 창에 초성 선택지 없음", async () => {
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

    it("C-2-2: 바깥 클릭으로 닫기 → 요청 없음, 상태 변화 없음", async () => {
      const { user } = await prepare();
      const before = requestsSnapshot();
      await openGiveUpDialog(user);
      await user.click(document.body);
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

  it("C-2-6: 초성 사용 후 포기 선택 → 포기 요청 1회, 정답 공개, 게임 종료", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0);
    expect(giveUpButton()).toBeDisabled();
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

  it("D-3-4: 초성 힌트 요청 실패 후 → 포기 버튼 다시 활성, 확인 창에 초성 선택지 남아 있음", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint", (r) => r.rank === 0);
    await openGiveUpDialog(user);
    await user.click(dialogOptions().consonant!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await held.fail();
    await waitFor(() => expect(giveUpButton()).toBeEnabled());
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeDefined();
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

    await setup();
    expect(givenUpShown()).toBe(true);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });

  it("D-4-3: 2번째에 정답 후 새로고침 → 힌트·포기 버튼 비활성", async () => {
    const first = await setup();
    await submitWord(first.user, "아무말", -1);
    await submitWord(first.user, ANSWER.word);
    first.unmount();

    await setup();
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });
});

// 제출 버튼 대신 엔터 (docs/tasks/ui/verification.md E)
describe("E. 엔터 제출", () => {
  it("E-1: 단어 입력 후 엔터 → 추측 요청 1회", async () => {
    const { user } = await setup();
    await user.type(input(), "엔터단어{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(1));
  });

  it("E-2: 입력창의 모바일 키보드 엔터 키가 보내기(send)", async () => {
    await setup();
    expect(input()).toHaveAttribute("enterkeyhint", "send");
  });
});

// 없는 단어 안내 (docs/tasks/ui/verification.md Y)
describe("Y. 없는 단어", () => {
  it("Y-1-1: 없는 단어 제출 → 입력창이 오류 상태", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).toHaveAttribute("aria-invalid", "true");
  });

  it("Y-1-2: 오류 뒤 입력창에 글자 입력 → 오류 상태와 안내가 사라짐", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.type(input(), "가");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Y-2-1: 없는 단어 제출 → 입력창 비움, 알림에 단어, 표 첫 줄에 임시 줄, 저장 안 됨", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).toHaveValue("");
    expect(screen.getByRole("alert")).toHaveTextContent("없는말");
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

  it("Y-2-4: 임시 줄 뒤 힌트 (성공) → 임시 줄 사라짐", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(rowsWith("없는말")).toHaveLength(0));
  });

  it("Y-2-5: 같은 없는 단어를 다시 제출 → 줄은 하나, 요청은 두 번", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await submitWord(user, "없는말");
    expect(gameServer.count("guess")).toBe(2);
    expect(rowsWith("없는말")).toHaveLength(1);
  });

  it("Y-2-6: 단어 8개 저장 상태에서 없는 단어 → 보이는 줄은 임시 줄 포함 7줄", async () => {
    const words = Array.from({ length: 8 }, (_, k) => ({
      word: `단어${8 - k}`, similarity: 10, rank: 108 - k, attempt: 8 - k, correct: false,
    }));
    localStorage.setItem(
      "newmantle_game_data",
      JSON.stringify({ submittedWords: words, attempts: 8, lastPlayedDate: getKSTDateString() }),
    );
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(firstRowText()).toContain("없는말");
    expect(bodyRows()).toHaveLength(7);
  });

  it("Y-2-7: 10위·500위 순으로 낸 뒤 없는 단어 → 줄 순서는 없는 단어, 10위, 500위", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 10);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    const texts = bodyRows().map((r) => r.textContent ?? "");
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain("없는말");
    expect(texts[1]).toContain("사과");
    expect(texts[2]).toContain("바나나");
  });

  it("Y-2-8: 단어 7개 저장 상태에서 없는 단어 → 임시 줄 포함 7줄 + 더보기, 누르면 7개 모두", async () => {
    const words = Array.from({ length: 7 }, (_, k) => ({
      word: `단어${7 - k}`, similarity: 10, rank: 107 - k, attempt: 7 - k, correct: false,
    }));
    localStorage.setItem(
      "newmantle_game_data",
      JSON.stringify({ submittedWords: words, attempts: 7, lastPlayedDate: getKSTDateString() }),
    );
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(firstRowText()).toContain("없는말");
    expect(bodyRows()).toHaveLength(7);
    await user.click(screen.getByRole("button", { name: "더보기" }));
    for (const w of words) expect(rowsWith(w.word)).toHaveLength(1);
  });

});

// 이미 제출한 단어 (docs/tasks/ui/verification.md Y-4, plan.md 12장)
describe("Y-4. 이미 제출한 단어", () => {
  const repeatIcon = () => screen.queryByRole("img", { name: "이미 입력한 단어" });

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

  it("Y-4-2: 반복 아이콘 뒤 새 단어 제출 → 아이콘 없음", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 10);
    await submitWord(user, "바나나", 500);
    await resubmit(user, "사과");
    await submitWord(user, "포도", 300);
    expect(repeatIcon()).not.toBeInTheDocument();
  });

  it("Y-4-3: 500위 단어를 다시 낸 뒤 초성 → 반복 아이콘 없음, 첫 줄은 초성", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    await submitWord(user, "포도", 300);
    await resubmit(user, "바나나");
    await takeConsonantHint(user);
    expect(firstRowText()).toContain("ㅈㄷ");
    expect(repeatIcon()).not.toBeInTheDocument();
  });

  it("Y-4-4: 다시 낸 뒤 힌트 → 반복 아이콘 없음, 첫 줄은 힌트 단어", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    await submitWord(user, "포도", 300);
    await resubmit(user, "바나나");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(firstRowText()).toContain("힌트"));
    expect(repeatIcon()).not.toBeInTheDocument();
  });

  it("Y-2-9: 없는 단어 뒤 초성 → 임시 줄 사라지고 첫 줄은 초성", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await takeConsonantHint(user);
    expect(rowsWith("없는말")).toHaveLength(0);
    expect(firstRowText()).toContain("ㅈㄷ");
  });

  it("Y-2-10: 없는 단어 뒤 포기 → 임시 줄 사라짐", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await giveUpViaDialog(user);
    expect(rowsWith("없는말")).toHaveLength(0);
  });
});

// 방금 입력 칸과 기록 표 (docs/tasks/ui/verification.md W-6, word-list.md 3-2)
describe("W-6. 방금 입력 칸과 기록 표", () => {
  it("W-6-1: 100위·500위 → 방금 입력에 500위, 기록에 100위", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    const latest = rowsOf(latestTable());
    const history = rowsOf(historyTable());
    expect(latest).toHaveLength(1);
    expect(latest[0].textContent).toContain("바나나");
    expect(history).toHaveLength(1);
    expect(history[0].textContent).toContain("사과");
  });

  it("W-6-2: 그 뒤 없는 단어 → 방금 입력에 없는 단어, 기록에 100위·500위", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    const latest = rowsOf(latestTable());
    const history = rowsOf(historyTable()).map((r) => r.textContent ?? "");
    expect(latest).toHaveLength(1);
    expect(latest[0].textContent).toContain("없는말");
    expect(history).toHaveLength(2);
    expect(history[0]).toContain("사과");
    expect(history[1]).toContain("바나나");
  });

  it("W-6-3: 단어 1개 → 방금 입력에 그 단어, 기록 줄 없음", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    expect(rowsOf(latestTable())).toHaveLength(1);
    expect(rowsOf(latestTable())[0].textContent).toContain("사과");
    expect(rowsOf(historyTable())).toHaveLength(0);
  });

  it("W-6-4: 제출한 단어 없음 → 방금 입력 표가 바로 보이고 줄 없음", async () => {
    await setup();
    expect(latestTable()).toBeInTheDocument();
    expect(rowsOf(latestTable())).toHaveLength(0);
  });
});

// 구분선 위 = 가장 최근 입력·힌트 (docs/tasks/ui/verification.md W-5, word-list.md 3-2)
describe("W-5. 구분선 위", () => {
  async function twoWords() {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    return user;
  }

  /** 줄 순서: 구분선 위 한 줄 + 순위 순서 */
  const rowOrder = (top: string) => {
    const texts = bodyRows().map((r) => r.textContent ?? "");
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain(top);
    expect(texts[1]).toContain("사과");
    expect(texts[2]).toContain("바나나");
  };

  it("W-5-1: 100위·500위 뒤 초성 → 줄 순서 초성, 100위, 500위", async () => {
    const user = await twoWords();
    await takeConsonantHint(user);
    rowOrder("ㅈㄷ");
  });

  it("W-5-2: 100위·500위 뒤 힌트 → 첫 줄은 힌트 단어", async () => {
    const user = await twoWords();
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(firstRowText()).toContain("힌트"));
  });

  it("W-5-3: 100위·500위 뒤 포기 → 줄 순서 정답, 100위, 500위", async () => {
    const user = await twoWords();
    await giveUpViaDialog(user);
    rowOrder(ANSWER.word);
  });

  it("W-5-4: 100위·500위 뒤 정답 → 줄 순서 정답, 100위, 500위", async () => {
    const user = await twoWords();
    await submitWord(user, ANSWER.word);
    await waitFor(() => expect(bodyRows()).toHaveLength(3));
    rowOrder(ANSWER.word);
  });
});

// 요청 실패 안내 (docs/tasks/ui/verification.md Y-3, plan.md 11장)
describe("Y-3. 요청 실패는 입력창 아래", () => {
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
  const toastShown = () => screen.queryByRole("status") !== null;

  async function failHint(user: User) {
    gameServer.failNext("hint");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(hintButton()).toBeEnabled());
  }

  it("Y-3-1: 서버 오류로 제출 실패 → 단어가 남고 오류 상태 아님, 알림, 토스트 없음, 표 첫 줄에 임시 줄", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    expect(input()).toHaveValue("사과");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toastShown()).toBe(false);
    expect(firstRowText()).toContain("사과");
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
    expect(rowsWith("사과")).toHaveLength(1);
  });

  it("Y-3-3: 힌트 실패 → 아래 안내, 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toastShown()).toBe(false);
  });

  it("Y-3-4: 초성 힌트 실패 → 아래 안내, 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("hint");
    await openGiveUpDialog(user);
    await user.click(dialogOptions().consonant!);
    await waitFor(() => expect(gameServer.consonantHintCount()).toBe(1));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(toastShown()).toBe(false);
  });

  it("Y-3-5: 포기 실패 → 아래 안내, 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("give-up");
    await openGiveUpDialog(user);
    await user.click(dialogOptions().giveUp!);
    await waitFor(() => expect(gameServer.count("give-up")).toBe(1));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
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
