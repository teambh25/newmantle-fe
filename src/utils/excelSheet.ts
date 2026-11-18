// excel 시트 표시 계산: 선택된 셀, 상태 표시줄 최고 유사도 (docs/specs/excel-ui Dec-69, Dec-80, docs/specs/progress-view-toggle Dec-16, Dec-22)
import type { SubmittedWord } from "@/utils/api";
import type { LatestRow } from "@/utils/board";

const isConsonantLatest = (latest: LatestRow | null) => latest?.kind === "notice" && latest.tone === "consonant";

/** 방금 입력한 단어(또는 초성)가 기록 표 몇 번째 줄인지 (0부터). 기록 표에 없는 항목이면 -1 */
export function latestHistoryIndex(history: SubmittedWord[], latest: LatestRow | null): number {
  if (isConsonantLatest(latest)) return history.findIndex((w) => w.attempt === -1 && w.rank === 0);
  if (latest?.kind !== "word") return -1;
  return history.findIndex((w) => w.attempt === latest.word.attempt && w.word === latest.word.word);
}

/** 선택된 셀: 상단바 행, 기록 표의 줄, 또는 없음 */
export type SelectedCell = { in: "bar" } | { in: "history"; index: number } | null;

/** 선택된 셀 = 방금 입력한 단어 칸. 그래프 모드는 기록 표 안, 상단바 모드는 상단바 행 (Dec-16, Dec-22) */
export function selectedCell(history: SubmittedWord[], latest: LatestRow | null, view: "chart" | "bar"): SelectedCell {
  if (view === "bar") return latest?.kind === "word" || isConsonantLatest(latest) ? { in: "bar" } : null;
  const index = latestHistoryIndex(history, latest);
  return index >= 0 ? { in: "history", index } : null;
}

/** 낸 단어(힌트·정답 포함) 중 가장 높은 유사도. 유사도가 있는 단어가 없으면 null (Dec-80) */
export function bestSimilarity(words: SubmittedWord[]): number | null {
  const values = words.map((w) => w.similarity).filter((v): v is number => typeof v === "number");
  return values.length > 0 ? Math.max(...values) : null;
}
