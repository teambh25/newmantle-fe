// 단어 목록 순위 배지 단계 (docs/tasks/ui/word-list/plan.md 2)
import { HINT_LIMIT_RANK } from "@/utils/gameRules";

export type RankTier = 1 | 2 | 3 | 4 | 5 | 0;

/** 순위 밖(-1) */
export const OUT_OF_RANK_TIER = 0;

/** 각 단계의 마지막 순위. 1단계는 힌트 한계 순위(20위 이내 = 힌트로 못 받는 "아주 유사" 구간) */
const TIER_MAX_RANKS = [HINT_LIMIT_RANK, 50, 100, 300] as const;

export function getRankTier(rank: number): RankTier {
  if (rank < 1) return OUT_OF_RANK_TIER;
  const i = TIER_MAX_RANKS.findIndex((max) => rank <= max);
  return (i === -1 ? 5 : i + 1) as RankTier;
}
