// excel 시트 표시 계산: 상태 표시줄 통계, 선택된 셀 (specs/excel-ui Dec-68, Dec-69)
import type { SubmittedWord } from "@/utils/api";
import type { LatestRow } from "@/utils/board";

export interface SheetStats {
  /** 제출 횟수 */
  count: number;
  /** 최고 순위. 순위권 단어가 없으면 null */
  best: number | null;
  /** 순위권 단어(입력·힌트)의 평균 순위, 반올림. 없으면 null */
  average: number | null;
}

/** 엑셀 상태 표시줄의 "평균 · 개수 · 합계" 자리에 보일 게임 통계. history는 기록 표 (src/utils/board.ts) */
export function sheetStats(history: SubmittedWord[], attempts: number): SheetStats {
  const ranks = history.map((w) => w.rank).filter((r) => r >= 1);
  if (ranks.length === 0) return { count: attempts, best: null, average: null };
  return {
    count: attempts,
    best: Math.min(...ranks),
    average: Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length),
  };
}

/** 방금 입력한 단어가 기록 표 몇 번째 줄인지 (0부터). 방금 항목이 단어가 아니면 -1 */
export function latestHistoryIndex(history: SubmittedWord[], latest: LatestRow | null): number {
  if (latest?.kind !== "word") return -1;
  return history.findIndex((w) => w.attempt === latest.word.attempt && w.word === latest.word.word);
}
