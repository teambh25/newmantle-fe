import type { SubmittedWord } from "@/utils/api";

// 힌트 / 포기 규칙: docs/spec/hint-giveup.md

// 순위권 단어가 없을 때 주는 첫 힌트 순위 (A-1).
export const FIRST_HINT_RANK = 999;
// 일반 힌트로 줄 수 있는 가장 높은 순위이자, 최고 순위가 이 값 이내면 일반 힌트를 막는 기준 (A-6).
export const HINT_LIMIT_RANK = 20;
// 다음 힌트 순위 = 최고 순위 × 이 비율 (A-5).
export const HINT_RATIO = 0.75;

/**
 * 지금까지 나온 단어 중 가장 높은 순위.
 * 순위 밖(-1), 초성 힌트(0), 정답 행은 제외한다. 없으면 null.
 */
export function getTopRank(words: SubmittedWord[]): number | null {
  let top: number | null = null;
  for (const word of words) {
    if (word.correct) continue;
    if (word.rank == null || word.rank <= 0) continue;
    if (top === null || word.rank < top) top = word.rank;
  }
  return top;
}

export function getNextHintRank(topRank: number | null): number {
  if (topRank === null) return FIRST_HINT_RANK;
  return Math.max(HINT_LIMIT_RANK, Math.round(topRank * HINT_RATIO));
}

export function isHintDisabled(topRank: number | null): boolean {
  return topRank !== null && topRank <= HINT_LIMIT_RANK;
}
