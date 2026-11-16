// 순위 → 위치 계산 (docs/tasks/ui/word-list/rank-track.md 4-1). 진행 상황 카드 게이지·말풍선이 쓴다.
// 세로 순위 트랙 컴포넌트와 갱신 표시·끝점·글자 숨김 계산은 코드에서 뺐다 (2026-11-16, 커밋 616c490에 있음)
import { getRankTier, getTierRange, type RankTier } from "@/utils/rankTier";

/** 칸 크기 비율. 정답 쪽 칸일수록 크게, 순위 밖은 맨 아래 작은 칸 (4-1) */
const CELL_SIZE: Record<RankTier, number> = { 0: 0.5, 5: 1, 4: 1.25, 3: 1.5, 2: 1.75, 1: 2 };
/** 1위 칸 위 끝점(정답) 자리 */
const END_SLOT = 0.6;
/** 아래에서 위로 쌓는 순서 */
const STACK: RankTier[] = [0, 5, 4, 3, 2, 1];
const TOTAL = STACK.reduce((sum: number, t) => sum + CELL_SIZE[t], 0) + END_SLOT;

/** 칸 높이 (트랙 높이에 대한 비율) */
export function trackCellSize(tier: RankTier): number {
  return CELL_SIZE[tier] / TOTAL;
}

/** 칸 아래 끝 (트랙 높이에 대한 비율, 0 = 맨 아래) */
export function trackCellBottom(tier: RankTier): number {
  let sum = 0;
  for (const t of STACK) {
    if (t === tier) break;
    sum += CELL_SIZE[t];
  }
  return sum / TOTAL;
}

/** 끝점 가운데 */
export const TRACK_END_POSITION = 1 - END_SLOT / 2 / TOTAL;

/** 순위 → 막대 위치 (0 = 맨 아래, 1 = 맨 위). 칸을 순위 수만큼 고르게 나눈 자리의 가운데, 순위 밖은 그 칸 가운데 */
export function trackPosition(rank: number): number {
  const tier = getRankTier(rank);
  const bottom = trackCellBottom(tier);
  const size = trackCellSize(tier);
  if (tier === 0) return bottom + size / 2;
  const [lo, hi] = getTierRange(tier);
  return bottom + (size * (hi - rank + 0.5)) / (hi - lo + 1);
}

