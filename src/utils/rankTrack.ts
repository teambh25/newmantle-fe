// 순위 트랙: 무엇을 막대 어디에 찍는지 (docs/tasks/ui/word-list/rank-track.md 4).
// 메인에서는 뺐고, 결과창의 플레이 기록(타임랩스)에서 다시 쓸 예정 (rank-track.md 5)
import type { SubmittedWord } from "@/utils/api";
import { getRankTier, getTierRange, type RankTier } from "@/utils/rankTier";

/** 최고 순위 갱신 표시. label은 표 #(시도 번호), 힌트는 "hint". rank -1은 순위 밖 */
export type TrackMark = { rank: number; label: number | "hint" };
export type TrackEnd = { kind: "playing" } | { kind: "solved"; attempts: number } | { kind: "givenUp" };

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

const isConsonant = (w: SubmittedWord) => w.attempt === -1 && w.rank === 0;
/** 순위 밖은 999위보다 먼 것으로 친다 */
const distance = (rank: number) => (rank < 1 ? Infinity : rank);

/**
 * 최고 순위 갱신 표시 (4-2). 첫 제출은 순위 밖이어도 남기고, 그 뒤로는 최고 순위가 나아질 때만.
 * 초성은 순위를 안 바꾸고, 정답·포기는 끝점이 맡는다. 게임이 끝난 뒤 기록은 보지 않는다
 */
export function buildTrackMarks(words: SubmittedWord[]): TrackMark[] {
  const marks: TrackMark[] = [];
  let best = Infinity;
  for (const w of [...words].reverse()) {
    if (w.correct) break;
    if (isConsonant(w)) continue;
    const d = distance(w.rank);
    if (marks.length > 0 && d >= best) continue;
    best = Math.min(best, d);
    marks.push({ rank: w.rank, label: w.attempt === -1 ? "hint" : w.attempt });
  }
  return marks;
}

export function trackEnd(words: SubmittedWord[], { givenUp }: { givenUp: boolean }): TrackEnd {
  const answer = words.find((w) => w.correct);
  if (!answer) return { kind: "playing" };
  return givenUp ? { kind: "givenUp" } : { kind: "solved", attempts: answer.attempt };
}

/**
 * 표시마다 글자를 보일지. 겹치면 오래된 쪽을 숨기고 눈금만 남긴다.
 * 시작·처음 순위권 진입·마지막 갱신·끝점(맞힘)은 늘 보임 (4-2). gap은 겹친다고 볼 간격 (트랙 높이에 대한 비율)
 */
export function visibleLabels(marks: TrackMark[], end: TrackEnd, gap: number): boolean[] {
  const firstRanked = marks.findIndex((m) => m.rank >= 1);
  const fixed = new Set([0, firstRanked, marks.length - 1].filter((i) => i >= 0));
  const shown = marks.map((_, i) => fixed.has(i));
  const taken = marks.filter((_, i) => shown[i]).map((m) => trackPosition(m.rank));
  if (end.kind === "solved") taken.push(TRACK_END_POSITION);
  for (let i = marks.length - 1; i >= 0; i--) {
    if (shown[i]) continue;
    const pos = trackPosition(marks[i].rank);
    if (taken.every((p) => Math.abs(p - pos) >= gap)) {
      shown[i] = true;
      taken.push(pos);
    }
  }
  return shown;
}
