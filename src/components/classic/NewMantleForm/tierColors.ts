import type { RankTier } from "@/utils/rankTier";

// 순위 단계 색: 순위 밖 → 진한 회색까지, 100위 안부터 파랑 (docs/tasks/ui/word-list/rank-track.md 3).
// 가장 옅은 색도 흰 바탕 대비 4.5:1 이상 (gray-500부터, 2026-11-15)

export const TIER_TEXT: Record<RankTier, string> = {
  0: "text-gray-500",
  5: "text-gray-600",
  4: "text-gray-700",
  3: "text-blue-500",
  2: "text-blue-600",
  1: "text-blue-800",
};

