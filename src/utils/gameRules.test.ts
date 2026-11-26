// 로직 레벨: 힌트 순위 계산 (spec A, 용어 "최고 순위")
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import { getNextHintRank, getTopRank, isHintDisabled } from "@/utils/gameRules";

const word = (rank: number, extra: Partial<SubmittedWord> = {}): SubmittedWord => ({
  word: `w${rank}`,
  similarity: 10,
  rank,
  attempt: 1,
  correct: false,
  ...extra,
});
const outOfRank = () => word(-1);
const hintWord = (rank: number) => word(rank, { attempt: -1 });

describe("일반 힌트 순위", () => {
  it("단어가 없으면 다음 힌트는 999", () => {
    expect(getNextHintRank(getTopRank([]))).toBe(999);
  });

  it("순위 밖 단어만 있으면 다음 힌트는 999", () => {
    expect(getNextHintRank(getTopRank([outOfRank(), outOfRank()]))).toBe(999);
  });

  it.each([
    [950, 713],
    [150, 113],
    [101, 76],
    [100, 75],
    [30, 23],
    [21, 20],
  ])("최고 순위 %i → 다음 힌트 %i", (top, next) => {
    expect(getNextHintRank(getTopRank([word(top), outOfRank()]))).toBe(next);
  });

  it.each([20, 1])("최고 순위 %i이면 일반 힌트 불가", (top) => {
    expect(isHintDisabled(getTopRank([word(top)]))).toBe(true);
  });

  it("최고 순위 21이면 힌트 가능, 다음 순위는 20 (20보다 높은 순위는 주지 않음)", () => {
    const top = getTopRank([word(21)]);
    expect(isHintDisabled(top)).toBe(false);
    expect(getNextHintRank(top)).toBe(20);
  });

  it("최고 순위 22도 다음 순위는 20 미만으로 내려가지 않음", () => {
    expect(getNextHintRank(getTopRank([word(22)]))).toBe(20);
  });

  it("순위 단어가 여럿이면 가장 작은 순위 숫자가 최고 순위", () => {
    expect(getTopRank([word(300), word(50), word(120), outOfRank()])).toBe(50);
  });

  it("힌트로 받은 단어도 최고 순위 기준이 된다", () => {
    expect(getNextHintRank(getTopRank([hintWord(76), word(101)]))).toBe(57);
  });
});
