// 로직 레벨: excel 시트 표시 계산 (선택된 셀) (docs/specs/excel-ui)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import type { LatestRow } from "@/utils/board";
import { bestSimilarity, latestHistoryIndex } from "@/utils/excelSheet";

const w = (word: string, rank: number, attempt: number): SubmittedWord => ({
  word,
  similarity: 10,
  rank,
  attempt,
  correct: false,
});

describe("선택된 셀: 방금 입력한 단어의 기록 표 줄", () => {
  const history = [w("가", 10, 2), w("나", 101, 1)];

  it("방금 항목이 단어면 기록 표에서 그 줄 번호", () => {
    const latest: LatestRow = { kind: "word", word: history[1], isRepeat: false };
    expect(latestHistoryIndex(history, latest)).toBe(1);
  });

  it("방금 항목이 단어가 아니면(없는 단어·제출 중 등) 없음", () => {
    const latest: LatestRow = { kind: "notice", word: "뭐", tone: "unknown" };
    expect(latestHistoryIndex(history, latest)).toBe(-1);
    expect(latestHistoryIndex(history, null)).toBe(-1);
  });
});

describe("상태 표시줄 최고 유사도", () => {
  const sim = (word: string, similarity: number | null, extra: Partial<SubmittedWord> = {}): SubmittedWord => ({
    word,
    similarity,
    rank: 100,
    attempt: 1,
    correct: false,
    ...extra,
  });

  it("낸 단어(힌트·정답 포함) 중 가장 높은 유사도", () => {
    expect(bestSimilarity([sim("가", 12.5), sim("나", 40.25, { attempt: -1 }), sim("다", -3)])).toBe(40.25);
    expect(bestSimilarity([sim("가", 12.5), sim("정답", 100, { correct: true })])).toBe(100);
  });

  it("유사도가 있는 단어가 없으면 없음 (초성 힌트만 등)", () => {
    expect(bestSimilarity([])).toBeNull();
    expect(bestSimilarity([sim("ㅅㄹ", null, { rank: 0, attempt: -1 })])).toBeNull();
  });
});
