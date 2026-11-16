// 로직 레벨: excel 시트 표시 계산 (상태 표시줄 통계, 선택된 셀) (specs/excel-ui)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import type { LatestRow } from "@/utils/board";
import { latestHistoryIndex, sheetStats } from "@/utils/excelSheet";

const w = (word: string, rank: number, attempt: number): SubmittedWord => ({
  word,
  similarity: 10,
  rank,
  attempt,
  correct: false,
});

describe("상태 표시줄 통계", () => {
  it("개수는 제출 횟수, 최고와 평균은 순위권 단어만 (평균은 반올림)", () => {
    const history = [w("가", 10, 2), w("나", 101, 1), w("다", -1, 3), w("힌트", 50, -1)];
    expect(sheetStats(history, 3)).toEqual({ count: 3, best: 10, average: 54 });
  });

  it("순위권 단어가 없으면 최고·평균 없음", () => {
    expect(sheetStats([w("가", -1, 1)], 1)).toEqual({ count: 1, best: null, average: null });
  });
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
