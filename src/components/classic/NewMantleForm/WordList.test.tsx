// 화면 레벨: 입력 단어 목록 (docs/tasks/ui/word-list/verification.md W-2 ~ W-4). 무엇을 어디에 둘지는 로직(src/utils/board.test.ts)
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewMantleForm from "./index";
import { formatGameDate, getKSTDateString } from "@/utils/date";
import type { SubmittedWord } from "@/utils/api";

function word(i: number, extra: Partial<SubmittedWord> = {}): SubmittedWord {
  return { word: `단어${i}`, similarity: 10, rank: 100 + i, attempt: i, correct: false, ...extra };
}

/** 저장된 기록으로 시작 (최근 것이 앞) */
function storeWords(words: SubmittedWord[], extra: Record<string, unknown> = {}) {
  localStorage.setItem(
    "newmantle_game_data",
    JSON.stringify({
      submittedWords: words,
      attempts: words.filter((w) => w.attempt > 0).length,
      lastPlayedDate: getKSTDateString(),
      ...extra,
    }),
  );
}

const escapeRegExp = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CONSONANT = "ㅅㄹ";
const consonant = (): SubmittedWord => ({ word: CONSONANT, similarity: null, rank: 0, attempt: -1, correct: false });

const nWords = (n: number) => Array.from({ length: n }, (_, k) => word(n - k));

async function renderForm() {
  render(<NewMantleForm />);
  await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
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
/** 보이는 단어 줄: 방금 항목 + 기록 표 */
function wordRows() {
  return [...latestItems(), ...rowsOf(historyTable())];
}
const moreButton = () => screen.queryByRole("button", { name: "더보기" });

/** 기록 표 줄 (방금 단어도 들어 있음, word-list/plan.md 1) */
const tableRows = () => rowsOf(historyTable());

describe("W-2: 보이는 개수", () => {
  it("W-2-1: 8개면 표 7줄 + 더보기", async () => {
    storeWords(nWords(8));
    await renderForm();
    expect(tableRows()).toHaveLength(7);
    expect(moreButton()).toBeInTheDocument();
  });

  it("W-2-2: 7개면 표 7줄, 더보기 없음", async () => {
    storeWords(nWords(7));
    await renderForm();
    expect(tableRows()).toHaveLength(7);
    expect(moreButton()).not.toBeInTheDocument();
  });

  it("W-2-3: 더보기를 누르면 전부", async () => {
    storeWords(nWords(8));
    await renderForm();
    await userEvent.setup({ pointerEventsCheck: 0 }).click(moreButton()!);
    expect(tableRows()).toHaveLength(8);
  });
});

describe("W-4: 날짜 제목 (초성·정답)", () => {
  const inTable = (text = CONSONANT) => wordRows().some((r) => within(r).queryByText(text));
  /** 날짜가 들어간 제목. 글자는 타일마다 나뉠 수 있어 텍스트를 이어 붙여 본다 */
  const dateHeading = () => screen.findByRole("heading", { name: new RegExp(escapeRegExp(formatGameDate(getKSTDateString()))) });
  const headingText = async () => ((await dateHeading()).textContent ?? "").replace(/\s/g, "");

  it("W-4-1: 진행 중이면 초성이 제목 안에 있고 표에는 없음", async () => {
    storeWords([word(2), consonant(), word(1)], { initialConsonantHintUsed: true });
    await renderForm();
    expect(await headingText()).toContain(CONSONANT);
    expect(inTable()).toBe(false);
  });
});

describe("W-3: 힌트 단어 표시", () => {
  it("W-3-1: 힌트 단어 줄에만 힌트 표시가 있음", async () => {
    storeWords([
      word(2),
      { word: "힌트단어", similarity: 30, rank: 40, attempt: -1, correct: false },
      word(1),
    ]);
    await renderForm();
    const rowOf = (w: string) => wordRows().find((r) => within(r).queryByText(w))!;
    expect(within(rowOf("힌트단어")).getByRole("img", { name: /힌트/ })).toBeInTheDocument();
    expect(within(rowOf("단어1")).queryByRole("img", { name: /힌트/ })).not.toBeInTheDocument();
    expect(within(rowOf("단어2")).queryByRole("img", { name: /힌트/ })).not.toBeInTheDocument();
  });
});
