import type { RankTier } from "@/utils/rankTier";

// 순위 단계 색: 순위 밖 → 진한 회색까지, 100위 안부터 파랑 (docs/tasks/ui/word-list/rank-track.md 3).
// 글씨(순위·유사도 칸)와 트랙 칸이 같은 색을 쓴다

export const TIER_TEXT: Record<RankTier, string> = {
  0: "text-gray-400",
  5: "text-gray-500",
  4: "text-gray-700",
  3: "text-blue-500",
  2: "text-blue-600",
  1: "text-blue-800",
};

export const TIER_FILL: Record<RankTier, string> = {
  0: "bg-gray-400",
  5: "bg-gray-500",
  4: "bg-gray-700",
  3: "bg-blue-500",
  2: "bg-blue-600",
  1: "bg-blue-800",
};
