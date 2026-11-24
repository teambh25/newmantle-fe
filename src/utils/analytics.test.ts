// 로직: Amplitude 하루 1회 판단과 설정 사용자 속성(_chosen) (docs/rules/amplitude.md 2장·3장)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import {
  getEndedBy,
  isFirstNormalHint,
  parseProgressViewSetting,
  parseThemeSetting,
  shouldLogPageVisit,
  shouldLogPostGameSubmission,
  shouldLogWordSubmitted,
} from "./analytics";

const QUIZ_DATE = "2026-11-10";

describe("방문 하루 1회", () => {
  it("퀴즈 날짜가 빈 값이면 → 보내지 않는다", () => {
    expect(shouldLogPageVisit("", () => null)).toBe(false);
  });

  it("오늘(퀴즈 날짜) 보낸 기록이 있으면 → 보내지 않는다", () => {
    expect(shouldLogPageVisit(QUIZ_DATE, () => QUIZ_DATE)).toBe(false);
  });

  it.each([
    ["없으면", null],
    ["다른 날짜면", "2026-11-09"],
  ])("보낸 기록이 %s → 보낸다", (_label, stored) => {
    expect(shouldLogPageVisit(QUIZ_DATE, () => stored)).toBe(true);
  });

  it("보낸 기록을 읽을 수 없으면 → 보낸다", () => {
    expect(shouldLogPageVisit(QUIZ_DATE, blocked)).toBe(true);
  });
});

// ---- 그날 기록 ----

const direct = (word: string, attempt: number): SubmittedWord => ({
  word,
  similarity: 10,
  rank: 500,
  attempt,
  correct: false,
});
const normalHintWord: SubmittedWord = { word: "힌트", similarity: 50, rank: 999, attempt: -1, correct: false };
const consonantHintWord: SubmittedWord = { word: "ㅅㄱ", similarity: 0, rank: 0, attempt: -1, correct: false };

const blocked = () => {
  throw new Error("SecurityError");
};

const playing = (submittedWords: SubmittedWord[] = []) => ({ submittedWords, gameCompleted: false, givenUp: false });
const solved = { submittedWords: [], gameCompleted: true, givenUp: false };
const givenUp = { submittedWords: [], gameCompleted: true, givenUp: true };

describe("게임 중 첫 제출", () => {
  it("게임 중이고 보낸 기록이 없고 기록에 힌트로 받은 단어만 있으면 → 보낸다", () => {
    expect(shouldLogWordSubmitted(playing([consonantHintWord, normalHintWord]), QUIZ_DATE, () => null)).toBe(true);
  });

  it("다른 날짜에 보낸 기록만 있으면 → 보낸다", () => {
    expect(shouldLogWordSubmitted(playing(), QUIZ_DATE, () => "2026-11-09")).toBe(true);
  });

  it("오늘 보낸 기록이 있으면 → 보내지 않는다", () => {
    expect(shouldLogWordSubmitted(playing(), QUIZ_DATE, () => QUIZ_DATE)).toBe(false);
  });

  it("기록에 직접 낸 단어가 있으면 → 보낸 기록이 없어도 보내지 않는다", () => {
    expect(shouldLogWordSubmitted(playing([normalHintWord, direct("사과", 1)]), QUIZ_DATE, () => null)).toBe(false);
  });

  it("보낸 기록을 읽을 수 없으면 → 게임 기록만으로 판단한다", () => {
    expect(shouldLogWordSubmitted(playing(), QUIZ_DATE, blocked)).toBe(true);
    expect(shouldLogWordSubmitted(playing([direct("사과", 1)]), QUIZ_DATE, blocked)).toBe(false);
  });

  it.each([
    ["정답을 맞혔으면", solved],
    ["포기했으면", givenUp],
  ])("%s → 보내지 않는다", (_label, game) => {
    expect(shouldLogWordSubmitted(game, QUIZ_DATE, () => null)).toBe(false);
  });
});

describe("끝난 뒤 첫 제출", () => {
  it.each([
    ["정답을 맞혔고", solved],
    ["포기했고", givenUp],
  ])("%s 보낸 기록이 없으면 → 보낸다", (_label, game) => {
    expect(shouldLogPostGameSubmission(game, QUIZ_DATE, () => null)).toBe(true);
  });

  it("게임 중이면 → 보내지 않는다", () => {
    expect(shouldLogPostGameSubmission(playing(), QUIZ_DATE, () => null)).toBe(false);
  });

  it("오늘 보낸 기록이 있으면 → 보내지 않는다", () => {
    expect(shouldLogPostGameSubmission(solved, QUIZ_DATE, () => QUIZ_DATE)).toBe(false);
  });

  it.each([
    ["다른 날짜면", () => "2026-11-09"],
    ["읽을 수 없으면", blocked],
  ])("보낸 기록이 %s → 보낸다", (_label, read) => {
    expect(shouldLogPostGameSubmission(solved, QUIZ_DATE, read)).toBe(true);
  });
});

describe("ended_by", () => {
  it("포기했으면 → given_up, 정답을 맞혔으면 → solved", () => {
    expect(getEndedBy(givenUp)).toBe("given_up");
    expect(getEndedBy(solved)).toBe("solved");
  });
});

describe("첫 일반 힌트", () => {
  it("그날 일반 힌트를 쓴 적이 없으면 → 첫 일반 힌트다", () => {
    expect(isFirstNormalHint({ hintUsed: 0, initialConsonantHintUsed: false })).toBe(true);
  });

  it("그날 초성 힌트만 썼으면 → 첫 일반 힌트다", () => {
    expect(isFirstNormalHint({ hintUsed: 0, initialConsonantHintUsed: true })).toBe(true);
  });

  it("그날 일반 힌트를 쓴 적이 있으면 → 첫 일반 힌트가 아니다", () => {
    expect(isFirstNormalHint({ hintUsed: 1, initialConsonantHintUsed: false })).toBe(false);
  });
});

// ---- 설정 사용자 속성 ----

describe("테마 _chosen", () => {
  it.each([
    ["없으면", null],
    ["올바르지 않으면", "dark"],
  ])("저장값이 %s → classic, chosen false", (_label, raw) => {
    expect(parseThemeSetting(raw)).toEqual({ value: "classic", chosen: false });
  });

  it.each(["classic", "excel"] as const)("저장값이 %s → 그 값, chosen true", (raw) => {
    expect(parseThemeSetting(raw)).toEqual({ value: raw, chosen: true });
  });
});

describe("진행 상황 보기 _chosen", () => {
  it.each([
    ["classic", null, "card"],
    ["classic", "chart", "card"],
    ["excel", null, "chart"],
    ["excel", "card", "chart"],
  ] as const)("%s 보기 저장값이 %s(없거나 올바르지 않음) → 기본값 %s, chosen false", (theme, raw, expected) => {
    expect(parseProgressViewSetting(raw, theme)).toEqual({ value: expected, chosen: false });
  });

  it.each([
    ["classic", "card"],
    ["classic", "bar"],
    ["excel", "chart"],
    ["excel", "bar"],
  ] as const)("%s 보기 저장값이 %s → 그 값, chosen true", (theme, raw) => {
    expect(parseProgressViewSetting(raw, theme)).toEqual({ value: raw, chosen: true });
  });
});
