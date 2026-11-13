// 단어 목록 순위 배지 단계 (docs/tasks/ui/word-list/verification.md W-1)
import { describe, expect, it } from "vitest";
import { getRankTier, OUT_OF_RANK_TIER } from "@/utils/rankTier";
import { HINT_LIMIT_RANK } from "@/utils/gameRules";

describe("순위 → 배지 단계", () => {
  it.each([
    [1, 1], [20, 1],
    [21, 2], [50, 2],
    [51, 3], [100, 3],
    [101, 4], [300, 4],
    [301, 5], [999, 5],
  ])("W-1-1: %i위 → %i단계", (rank, tier) => {
    expect(getRankTier(rank)).toBe(tier);
  });

  it("W-1-2: 순위 밖(-1)은 1~5와 다른 단계", () => {
    expect(getRankTier(-1)).toBe(OUT_OF_RANK_TIER);
    expect([1, 2, 3, 4, 5]).not.toContain(OUT_OF_RANK_TIER);
  });

  it("W-1-3: 1단계 경계 = 힌트 한계 순위", () => {
    expect(getRankTier(HINT_LIMIT_RANK)).toBe(1);
    expect(getRankTier(HINT_LIMIT_RANK + 1)).toBe(2);
  });
});
