// excel 시트 표시 계산: 선택된 셀, 상태 표시줄 최고 유사도 (specs/excel-ui Dec-69, Dec-80)
import type { SubmittedWord } from "@/utils/api";
import type { LatestRow } from "@/utils/board";

/** 방금 입력한 단어가 기록 표 몇 번째 줄인지 (0부터). 방금 항목이 단어가 아니면 -1 */
export function latestHistoryIndex(history: SubmittedWord[], latest: LatestRow | null): number {
  if (latest?.kind !== "word") return -1;
  return history.findIndex((w) => w.attempt === latest.word.attempt && w.word === latest.word.word);
}

/** 낸 단어(힌트·정답 포함) 중 가장 높은 유사도. 유사도가 있는 단어가 없으면 null (Dec-80) */
export function bestSimilarity(words: SubmittedWord[]): number | null {
  const values = words.map((w) => w.similarity).filter((v): v is number => typeof v === "number");
  return values.length > 0 ? Math.max(...values) : null;
}
