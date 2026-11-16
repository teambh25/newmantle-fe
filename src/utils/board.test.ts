// 로직 레벨: 게임판에 보일 것 (날짜 제목, 방금 입력 칸, 기록 표, 게이지 최고 순위·게임 끝)
// 케이스 ID는 원래 화면 테스트의 것 (docs/tasks/ui/word-list/verification.md W, input/verification.md Y, progress-card/verification.md PC)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import { buildBoard, gaugeFill, GAUGE_BAR_END, type BoardInput, type SubmitNotice } from "@/utils/board";

/** 시간 순(먼저 한 것이 앞)으로 받아 저장 형태(최근 것이 앞)로 바꾼다. 단어 이름은 [이름, 순위] */
type Step = [string, number] | { hint: [string, number] } | "consonant" | "answer" | "giveUp";
const CONSONANT = "ㅈㄷ";
const ANSWER = "정답";
function history(steps: Step[]): SubmittedWord[] {
  let attempt = 0;
  const words = steps.map((s): SubmittedWord => {
    if (s === "consonant") return { word: CONSONANT, similarity: null, rank: 0, attempt: -1, correct: false };
    if (s === "answer") return { word: ANSWER, similarity: 100, rank: 0, attempt: ++attempt, correct: true };
    if (s === "giveUp") return { word: ANSWER, similarity: 100, rank: 0, attempt, correct: true };
    if ("hint" in s) return { word: s.hint[0], similarity: 50, rank: s.hint[1], attempt: -1, correct: false };
    return { word: s[0], similarity: 10, rank: s[1], attempt: ++attempt, correct: false };
  });
  return words.reverse();
}

/** 다시 낸 단어: 저장 순서에서 맨 앞으로 옮겨진다 (useGameState) */
function resubmit(words: SubmittedWord[], word: string): SubmittedWord[] {
  const i = words.findIndex((w) => w.word === word);
  return [words[i], ...words.slice(0, i), ...words.slice(i + 1)];
}

function board(words: SubmittedWord[], extra: Partial<BoardInput> = {}) {
  const ended = words.some((w) => w.correct);
  return buildBoard({
    words,
    gameCompleted: ended,
    givenUp: false,
    attempts: words.filter((w) => w.attempt > 0).length,
    notice: null,
    pendingWord: null,
    repeatedWord: null,
    ...extra,
  });
}

const unknown = (word: string): SubmitNotice => ({ word, tone: "unknown" });
/** 방금 입력 칸의 단어 */
const latestWord = (b: ReturnType<typeof board>) => {
  const l = b.latest;
  if (!l) return null;
  return l.kind === "word" ? l.word.word : l.word;
};
const historyWords = (b: ReturnType<typeof board>) => b.history.map((w) => w.word);

const TWO = history([["사과", 100], ["바나나", 500]]);

describe("W-6. 방금 입력 칸과 기록 표", () => {
  it("W-6-1: 100위·500위 → 방금 입력에 500위, 기록에 100위·500위", () => {
    const b = board(TWO);
    expect(latestWord(b)).toBe("바나나");
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("W-6-2: 그 뒤 없는 단어 → 방금 입력에 없는 단어, 기록에 100위·500위", () => {
    const b = board(TWO, { notice: unknown("없는말") });
    expect(b.latest).toMatchObject({ kind: "notice", word: "없는말", tone: "unknown" });
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("W-6-3: 단어 1개 → 방금 입력과 기록 모두 그 단어", () => {
    const b = board(history([["사과", 100]]));
    expect(latestWord(b)).toBe("사과");
    expect(historyWords(b)).toEqual(["사과"]);
  });

  it("W-6-4 / PC-1-1: 제출한 단어 없음 → 방금 입력 없음, 기록 없음, 최고 순위 없음, 진행 중", () => {
    const b = board([]);
    expect(b.latest).toBeNull();
    expect(b.history).toEqual([]);
    expect(b.best).toBeNull();
    expect(b.end).toBe("playing");
  });

  it("W-6-5: 100위 단어를 다시 내도 기록에 100위·500위 그대로", () => {
    const b = board(resubmit(TWO, "사과"), { repeatedWord: "사과" });
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("W-6-6: 500위 뒤 힌트 → 기록에 힌트 단어가 있음", () => {
    const b = board(history([["사과", 500], { hint: ["힌트", 375] }]));
    expect(historyWords(b)).toContain("힌트");
  });
});

describe("W-5. 방금 입력 칸 = 가장 최근 항목", () => {
  it("W-5-1: 100위·500위 뒤 초성 → 방금 입력은 초성, 기록에 초성 없음", () => {
    const b = board(history([["사과", 100], ["바나나", 500], "consonant"]));
    expect(b.latest).toMatchObject({ kind: "notice", word: CONSONANT, tone: "consonant" });
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("W-5-2: 100위·500위 뒤 힌트 → 방금 입력은 힌트 단어", () => {
    const b = board(history([["사과", 100], ["바나나", 500], { hint: ["힌트", 75] }]));
    expect(latestWord(b)).toBe("힌트");
  });

  it("W-5-3: 100위·500위 뒤 포기 → 방금 입력은 정답(포기), 기록에 정답 없음", () => {
    const b = board(history([["사과", 100], ["바나나", 500], "giveUp"]), { givenUp: true });
    expect(b.latest).toMatchObject({ kind: "notice", word: ANSWER, tone: "givenUp" });
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("W-5-4: 100위·500위 뒤 정답 → 방금 입력은 정답(맞힘), 기록에 정답 없음", () => {
    const b = board(history([["사과", 100], ["바나나", 500], "answer"]));
    expect(b.latest).toMatchObject({ kind: "notice", word: ANSWER, tone: "answer", attempt: 3 });
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });
});

describe("Y-2. 없는 단어 임시 줄", () => {
  it("Y-2-7: 10위·500위 뒤 없는 단어 → 방금 입력은 없는 단어, 기록은 10위·500위", () => {
    const b = board(history([["사과", 10], ["바나나", 500]]), { notice: unknown("없는말") });
    expect(latestWord(b)).toBe("없는말");
    expect(historyWords(b)).toEqual(["사과", "바나나"]);
  });

  it("Y-2-6 / Y-2-8: 임시 줄은 기록 표에 들어가지 않음 (단어 8개면 기록도 8개)", () => {
    const words = history(Array.from({ length: 8 }, (_, k): Step => [`단어${k + 1}`, 101 + k]));
    expect(board(words, { notice: unknown("없는말") }).history).toHaveLength(8);
  });

  it("제출 중이면 방금 입력은 제출 중 단어 (임시 줄보다 앞), 시도 번호는 다음 번호", () => {
    const b = board(TWO, { notice: unknown("없는말"), pendingWord: "포도" });
    expect(b.latest).toEqual({ kind: "pending", word: "포도", attempt: 3 });
  });
});

describe("Y-4. 이미 제출한 단어", () => {
  it("Y-4-1: 이미 낸 단어를 다시 → 방금 입력이 그 단어이고 반복 표시", () => {
    const b = board(resubmit(TWO, "사과"), { repeatedWord: "사과" });
    expect(b.latest).toMatchObject({ kind: "word", isRepeat: true });
    expect(latestWord(b)).toBe("사과");
  });

  it("Y-4-2: 반복 뒤 새 단어 → 반복 표시 없음", () => {
    const words = history([["바나나", 500], ["사과", 10], ["포도", 300]]);
    expect(board(words, { repeatedWord: "사과" }).latest).toMatchObject({ kind: "word", isRepeat: false });
  });

  it("Y-4-3: 다시 낸 뒤 초성 → 방금 입력은 초성 (반복 표시 없음)", () => {
    const words = [history(["consonant"])[0], ...resubmit(history([["사과", 100], ["바나나", 500], ["포도", 300]]), "바나나")];
    expect(board(words, { repeatedWord: "바나나" }).latest).toMatchObject({ kind: "notice", tone: "consonant" });
  });

  it("Y-4-4: 다시 낸 뒤 힌트 → 방금 입력은 힌트 단어, 반복 표시 없음", () => {
    const hint: SubmittedWord = { word: "힌트", similarity: 50, rank: 75, attempt: -1, correct: false };
    const words = [hint, ...resubmit(history([["사과", 100], ["바나나", 500], ["포도", 300]]), "바나나")];
    const b = board(words, { repeatedWord: "바나나" });
    expect(latestWord(b)).toBe("힌트");
    expect(b.latest).toMatchObject({ kind: "word", isRepeat: false });
  });
});

describe("W-4. 날짜 제목 (초성·정답)", () => {
  it("W-4-1: 진행 중이면 초성이 제목에 있고 기록 표에는 없음", () => {
    const b = board(history([["단어1", 101], "consonant", ["단어2", 102]]));
    expect(b.reveal).toBe(CONSONANT);
    expect(historyWords(b)).not.toContain(CONSONANT);
  });

  it("W-4-2: 정답을 맞혔으면 제목은 초성 대신 정답, 기록 표에는 초성·정답 모두 없음", () => {
    const b = board(history([["단어1", 101], "consonant", ["단어2", 102], "answer"]));
    expect(b.reveal).toBe(ANSWER);
    expect(historyWords(b)).toEqual(["단어1", "단어2"]);
    expect(b.end).toBe("solved");
  });

  it("W-4-3: 포기했으면 제목은 정답, 게임 끝 상태는 포기 (gameCompleted도 true)", () => {
    const b = board(history([["단어1", 101], "consonant", ["단어2", 102], "giveUp"]), { givenUp: true });
    expect(b.reveal).toBe(ANSWER);
    expect(historyWords(b)).toEqual(["단어1", "단어2"]);
    expect(b.end).toBe("givenUp");
  });

  it("W-4-4: 초성 없이 진행 중이면 제목에 드러낼 단어가 없음", () => {
    expect(board(TWO).reveal).toBeNull();
  });
});

describe("W-2. 기록 표에 세는 단어 (초성)", () => {
  const seven = (n: number) => Array.from({ length: n }, (_, k): Step => [`단어${k + 1}`, 101 + k]);

  it("W-2-4: 7개 + 초성(가장 최근)이면 기록 표는 7개", () => {
    expect(board(history([...seven(7), "consonant"])).history).toHaveLength(7);
  });

  it("W-2-5: 초성 뒤에 단어를 내서 7개면 기록 표는 7개, 초성 없음", () => {
    const b = board(history([...seven(6), "consonant", ["단어7", 107]]));
    expect(b.history).toHaveLength(7);
    expect(historyWords(b)).not.toContain(CONSONANT);
  });
});

describe("PC. 게이지 최고 순위와 게임 끝", () => {
  it("PC-2-1: 500위 뒤 100위 → 최고 순위 100, 게이지가 오름", () => {
    const before = board(history([["사과", 500]]));
    const after = board(history([["사과", 500], ["바나나", 100]]));
    expect(after.best).toBe(100);
    expect(gaugeFill(after.best, after.end)).toBeGreaterThan(gaugeFill(before.best, before.end));
  });

  it("PC-2-2: 500위·100위 뒤 300위 → 최고 순위 100 그대로", () => {
    expect(board(history([["사과", 500], ["바나나", 100], ["포도", 300]])).best).toBe(100);
  });

  it("PC-2-3: 순위 밖만 → 최고 순위 없음, 게이지 0", () => {
    const b = board(history([["사과", -1]]));
    expect(b.best).toBeNull();
    expect(gaugeFill(b.best, b.end)).toBe(0);
  });

  it("PC-2-4: 500위 뒤 힌트(375위) → 힌트도 최고 순위가 됨", () => {
    expect(board(history([["사과", 500], { hint: ["힌트", 375] }])).best).toBe(375);
  });

  it("PC-3-1 / PC-3-2: 없는 단어 임시 줄과 초성은 최고 순위를 바꾸지 않음", () => {
    expect(board(history([["사과", 500]]), { notice: unknown("없는말") }).best).toBe(500);
    expect(board(history([["사과", 500], "consonant"])).best).toBe(500);
  });

  it("PC-4-4: 정답 → 게이지 끝까지", () => {
    const b = board(history([["사과", 500], "answer"]));
    expect(b.end).toBe("solved");
    expect(gaugeFill(b.best, b.end)).toBe(GAUGE_BAR_END);
  });

  it("PC-4-3: 정답 뒤 100위 → 방금 입력은 100위 단어, 맞힘·게이지 끝까지 그대로", () => {
    const words = [{ word: "바나나", similarity: 10, rank: 100, attempt: 3, correct: false }, ...history([["사과", 500], "answer"])];
    const b = board(words);
    expect(latestWord(b)).toBe("바나나");
    expect(b.end).toBe("solved");
    expect(gaugeFill(b.best, b.end)).toBe(GAUGE_BAR_END);
  });

  it("포기 → 게이지는 최고 순위까지 (끝까지 채우지 않음)", () => {
    const b = board(history([["사과", 500], "giveUp"]), { givenUp: true });
    expect(gaugeFill(b.best, b.end)).toBeLessThan(GAUGE_BAR_END);
    expect(gaugeFill(b.best, b.end)).toBeGreaterThan(0);
  });
});
