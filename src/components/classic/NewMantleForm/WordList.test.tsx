// 화면 레벨: 입력 단어 목록 (docs/tasks/ui/verification.md W-2 ~ W-4)
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

const latestTable = () => screen.queryByRole("table", { name: "방금 입력" });
const historyTable = () => screen.queryByRole("table", { name: "기록" });
/** 표 안 머리줄을 뺀 줄 */
const rowsOf = (t: HTMLElement | null) =>
  t ? within(t).queryAllByRole("row").filter((r) => within(r).queryAllByRole("columnheader").length === 0) : [];
/** 보이는 단어 줄: 방금 입력 칸 + 기록 표 */
function wordRows() {
  return [...rowsOf(latestTable()), ...rowsOf(historyTable())];
}
const moreButton = () => screen.queryByRole("button", { name: "더보기" });

describe("W-2: 보이는 개수", () => {
  it("W-2-1: 8개면 7줄 + 더보기", async () => {
    storeWords(nWords(8));
    await renderForm();
    expect(wordRows()).toHaveLength(7);
    expect(moreButton()).toBeInTheDocument();
  });

  it("W-2-2: 7개면 7줄, 더보기 없음", async () => {
    storeWords(nWords(7));
    await renderForm();
    expect(wordRows()).toHaveLength(7);
    expect(moreButton()).not.toBeInTheDocument();
  });

  it("W-2-3: 더보기를 누르면 전부", async () => {
    storeWords(nWords(8));
    await renderForm();
    await userEvent.setup({ pointerEventsCheck: 0 }).click(moreButton()!);
    expect(wordRows()).toHaveLength(8);
  });
});

describe("W-2: 보이는 개수 (초성)", () => {
  it("W-2-4: 7개 + 초성(가장 최근)이면 초성 줄 포함 7줄 + 더보기", async () => {
    storeWords([consonant(), ...nWords(7)], { initialConsonantHintUsed: true });
    await renderForm();
    expect(wordRows()).toHaveLength(7);
    expect(moreButton()).toBeInTheDocument();
  });

  it("W-2-5: 초성 뒤에 단어를 내서 7개면 7줄, 더보기 없음, 초성 줄 없음", async () => {
    const [latest, ...rest] = nWords(7);
    storeWords([latest, consonant(), ...rest], { initialConsonantHintUsed: true });
    await renderForm();
    expect(wordRows()).toHaveLength(7);
    expect(moreButton()).not.toBeInTheDocument();
    expect(wordRows().some((r) => r.textContent?.includes(CONSONANT))).toBe(false);
  });
});

describe("W-4: 날짜 제목 (초성·정답)", () => {
  const ANSWER = "사랑";
  const answer = (attempt: number): SubmittedWord => ({ word: ANSWER, similarity: 100, rank: 0, attempt, correct: true });
  const inTable = (text = CONSONANT) => wordRows().some((r) => within(r).queryByText(text));
  const rowsWithAnswer = () => wordRows().filter((r) => within(r).queryByText(ANSWER));
  /** 날짜가 들어간 제목. 글자는 타일마다 나뉠 수 있어 텍스트를 이어 붙여 본다 */
  const dateHeading = () => screen.findByRole("heading", { name: new RegExp(escapeRegExp(formatGameDate(getKSTDateString()))) });
  const headingText = async () => ((await dateHeading()).textContent ?? "").replace(/\s/g, "");

  it("W-4-1: 진행 중이면 초성이 제목 안에 있고 표에는 없음", async () => {
    storeWords([word(2), consonant(), word(1)], { initialConsonantHintUsed: true });
    await renderForm();
    expect(await headingText()).toContain(CONSONANT);
    expect(inTable()).toBe(false);
  });

  it("W-4-2: 정답을 맞혔으면 초성은 없고 정답은 제목과 표 첫 줄에만", async () => {
    storeWords([answer(3), word(2), consonant(), word(1)], {
      initialConsonantHintUsed: true,
      gameCompleted: true,
      solvedAttempts: 3,
    });
    await renderForm();
    expect(await headingText()).toContain(ANSWER);
    expect(rowsWithAnswer()).toEqual([wordRows()[0]]);
    expect(document.body.textContent).not.toContain(CONSONANT);
  });

  it("W-4-3: 포기했으면 초성은 없고 정답은 제목과 표 첫 줄에만, 번호 칸에 포기 아이콘", async () => {
    // 포기 저장 형태: 정답 항목 + gameCompleted·givenUp 둘 다 true (useGameState giveUp)
    storeWords([answer(2), word(2), consonant(), word(1)], {
      initialConsonantHintUsed: true,
      gameCompleted: true,
      givenUp: true,
      solvedAttempts: 2,
    });
    await renderForm();
    expect(await headingText()).toContain(ANSWER);
    expect(rowsWithAnswer()).toEqual([wordRows()[0]]);
    expect(within(wordRows()[0]).getByRole("img", { name: "포기" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(CONSONANT);
  });

  it("W-4-4: 초성 없이 진행 중이면 제목에 단어가 없음", async () => {
    storeWords(nWords(3));
    await renderForm();
    const text = await headingText();
    for (const w of nWords(3)) expect(text).not.toContain(w.word);
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
