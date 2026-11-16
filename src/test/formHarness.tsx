// 화면 레벨 도구: 게임 화면(NewMantleForm)을 렌더링하고 조작하는 함수.
// NewMantleForm 폴더의 화면 테스트들이 같이 쓴다.
import { expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewMantleForm from "@/components/classic/NewMantleForm";
import { ANSWER, gameServer } from "@/test/fakeGameServer";

export type User = ReturnType<typeof userEvent.setup>;

export async function setup() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<NewMantleForm />);
  // 게임 날짜가 정해진 뒤(마운트 직후) 조작한다
  await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
  return { user, ...view };
}

export const hintButton = () => screen.getByRole("button", { name: "힌트" });
export const giveUpButton = () => screen.getByRole("button", { name: "포기" });
export const input = () => screen.getByRole("textbox");
export const submitButton = () => screen.getByRole("button", { name: /제출/ });
export const dialog = () => screen.queryByRole("dialog");

/** 게임 결과가 표시됐는지: 결과창(이름 "게임 결과" dialog)이 열려 있음 */
export const givenUpShown = () => screen.queryByRole("dialog", { name: "게임 결과" }) !== null;

/** 확인 창의 선택지 (X 닫기 버튼 제외) */
export function dialogOptions() {
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
export const closeButton = () =>
  within(screen.getByRole("dialog")).getByRole("button", { name: /close/i });

export async function submitWord(user: User, word: string, rank?: number) {
  if (rank !== undefined) gameServer.setRank(word, rank);
  const before = gameServer.count("guess");
  await user.type(input(), word);
  await user.click(submitButton());
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  await waitFor(() => expect(input()).toBeEnabled());
}

/** 정답 제출 → 결과창이 열리면 닫고 게임 화면으로 (결과창을 닫을 때까지 입력창이 잠긴다) */
export async function submitAnswer(user: User) {
  const before = gameServer.count("guess");
  await user.type(input(), ANSWER.word);
  await user.click(submitButton());
  await waitFor(() => expect(gameServer.count("guess")).toBe(before + 1));
  await closeResultDialog(user);
  expect(input()).toBeEnabled();
}

export async function openGiveUpDialog(user: User) {
  await user.click(giveUpButton());
  await waitFor(() => expect(dialog()).toBeInTheDocument());
}

export async function takeConsonantHint(user: User) {
  await openGiveUpDialog(user);
  await user.click(dialogOptions().consonant!);
  await waitFor(() => expect(gameServer.consonantHintCount()).toBe(1));
  await waitFor(() => expect(giveUpButton()).toBeEnabled());
}

/** 게임이 끝나면 잠시 뒤 열리는 결과창 */
export const findResultDialog = () => screen.findByRole("dialog", { name: "게임 결과" }, { timeout: 3000 });

/** 결과창을 닫고 게임 화면으로 돌아간다 (열려 있는 동안 바깥 버튼은 aria-hidden) */
export async function closeResultDialog(user: User) {
  await user.click(within(await findResultDialog()).getByRole("button", { name: /close/i }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "게임 결과" })).not.toBeInTheDocument());
}

/** 포기 → 결과창에 포기 결과가 뜰 때까지. 기본은 결과창을 닫고 게임 화면으로 돌아온다 */
export async function giveUpViaDialog(user: User, { keepResultOpen = false } = {}) {
  await openGiveUpDialog(user);
  await user.click(dialogOptions().giveUp!);
  await findResultDialog();
  expect(givenUpShown()).toBe(true);
  if (!keepResultOpen) await closeResultDialog(user);
}

/** 방금 입력 칸 = 진행 상황 카드 */
export const latestCard = () => screen.queryByRole("region", { name: "방금 입력" });
export const historyTable = () => screen.queryByRole("table", { name: "기록" });
/** 표 안 머리줄을 뺀 줄 */
export const rowsOf = (t: HTMLElement | null) =>
  t ? within(t).queryAllByRole("row").filter((r) => within(r).queryAllByRole("columnheader").length === 0) : [];
/** 카드의 방금 항목(말풍선). 아무것도 안 했으면 빈 배열 */
export function latestItems(): HTMLElement[] {
  const card = latestCard();
  const bubble = card && within(card).queryByRole("status");
  return bubble ? [bubble] : [];
}
/** 보이는 단어 줄: 방금 항목 + 기록 표 (없으면 빈 배열) */
export function bodyRows() {
  return [...latestItems(), ...rowsOf(historyTable())];
}
export const firstRowText = () => bodyRows()[0]?.textContent ?? "";
export const rowsWith = (word: string) => bodyRows().filter((r) => r.textContent?.includes(word));
/** 저장값에 든 단어 */
export const storedWords = (): string[] =>
  (JSON.parse(localStorage.getItem("newmantle_game_data") ?? "{}").submittedWords ?? []).map(
    (w: { word: string }) => w.word,
  );
