// 로직 레벨: 진행 상황 카드 지난 기록 말풍선 (docs/tasks/ui/progress-card/verification.md PC-5)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import { recordBubbles, visibleBubbles, type RecordBubble } from "@/utils/progressMarks";

/** 시간 순(먼저 한 것이 앞)으로 받아 저장 형태(최근 것이 앞)로 바꾼다 */
type Step = number | "out" | { hint: number } | "consonant" | "answer";
function history(steps: Step[]): SubmittedWord[] {
  let attempt = 0;
  const words = steps.map((s, i): SubmittedWord => {
    if (s === "consonant") return { word: "ㅅㄹ", similarity: null, rank: 0, attempt: -1, correct: false };
    if (s === "answer") return { word: "정답", similarity: 100, rank: 0, attempt: ++attempt, correct: true };
    if (typeof s === "object") return { word: `힌트${i}`, similarity: 50, rank: s.hint, attempt: -1, correct: false };
    return { word: `단어${i}`, similarity: 10, rank: s === "out" ? -1 : s, attempt: ++attempt, correct: false };
  });
  return words.reverse();
}
const ranks = (steps: Step[]) => recordBubbles(history(steps)).map((b) => b.rank);

describe("PC-5: 지난 기록 말풍선", () => {
  it("PC-5-1: 최고 기록을 깬 단어만, 시간 순 (방금 단어가 기록이 아닐 때)", () => {
    expect(ranks([500, 300, 400, 100, "out"])).toEqual([500, 300, 100]);
  });

  it("PC-2-6: 방금 낸 단어가 새 최고면 바로 말풍선에 들어감", () => {
    expect(ranks([500, 100])).toEqual([500, 100]);
  });

  it("PC-5-2: 순위 밖·초성 없음, 힌트 포함", () => {
    const bubbles = recordBubbles(history(["out", 500, { hint: 80 }, "consonant", 120]));
    expect(bubbles.map((b) => b.rank)).toEqual([500, 80]);
    expect(bubbles[1].word).toBe("힌트2");
  });

  it("PC-5-3: 정답 없음, 끝난 뒤 단어 포함", () => {
    expect(ranks([500, "answer", 100, "out"])).toEqual([500, 100]);
  });

  it("PC-5-8: 다시 낸 단어는 남고, 순서는 처음 낸 때 기준", () => {
    const words = history([500, 100, 300]);
    // 500위 단어를 다시 내면 저장 순서에서 맨 앞으로 옮겨진다 (useGameState moveWordToTop)
    const moved = [words[2], words[0], words[1]];
    expect(recordBubbles(moved).map((b) => b.rank)).toEqual([500, 100]);
  });

  // 폭 300px, 말풍선 폭은 어림값. 겹침은 몸통 자리로 판단
  const b = (rank: number, word = "단어"): RecordBubble => ({ rank, word });

  it("PC-5-5: 겹치면 가장 최근만", () => {
    // 899·898·897위는 거의 같은 자리
    expect(visibleBubbles([b(899), b(898), b(897)], 300)).toEqual([false, false, true]);
  });

  it("PC-5-6: 처음·최고는 보이고, 사이의 겹치는 둘 중 최근 것", () => {
    expect(visibleBubbles([b(900), b(60), b(59), b(2)], 300)).toEqual([true, false, true, true]);
  });

  it("PC-5-7: 폭을 모르면 최고만", () => {
    expect(visibleBubbles([b(900), b(60), b(2)], 0)).toEqual([false, false, true]);
  });
});
