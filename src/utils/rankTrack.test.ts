// 로직 레벨: 순위 트랙 (docs/tasks/ui/word-list/verification.md RT-1 ~ RT-4)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import {
  buildTrackMarks,
  TRACK_END_POSITION,
  trackCellSize,
  trackEnd,
  trackPosition,
  visibleLabels,
} from "@/utils/rankTrack";

/** 시간 순(먼저 한 것이 앞)으로 받아 저장 형태(최근 것이 앞)로 바꾼다 */
type Step = number | "out" | { hint: number } | "consonant" | "answer" | "giveUp";
function history(steps: Step[]): SubmittedWord[] {
  let attempt = 0;
  const words = steps.map((s, i): SubmittedWord => {
    if (s === "consonant") return { word: "ㅅㄹ", similarity: null, rank: 0, attempt: -1, correct: false };
    if (s === "answer") return { word: "정답", similarity: 100, rank: 0, attempt: ++attempt, correct: true };
    if (s === "giveUp") return { word: "정답", similarity: 100, rank: 0, attempt, correct: true };
    if (typeof s === "object") return { word: `힌트${i}`, similarity: 50, rank: s.hint, attempt: -1, correct: false };
    return { word: `단어${i}`, similarity: 10, rank: s === "out" ? -1 : s, attempt: ++attempt, correct: false };
  });
  return words.reverse();
}

const labels = (steps: Step[]) => buildTrackMarks(history(steps)).map((m) => m.label);

/** 겹침 판단 간격 (트랙 높이에 대한 비율) */
const GAP = 0.1;

describe("RT-1: 막대 위치", () => {
  it("RT-1-1: 순위가 작을수록 위, 순위 밖이 가장 아래, 끝점이 가장 위", () => {
    for (let r = 1; r < 999; r++) {
      expect(trackPosition(r)).toBeGreaterThan(trackPosition(r + 1));
    }
    expect(trackPosition(999)).toBeGreaterThan(trackPosition(-1));
    expect(TRACK_END_POSITION).toBeGreaterThan(trackPosition(1));
  });

  it("RT-1-2: 정답 쪽 칸일수록 큼", () => {
    const sizes = ([1, 2, 3, 4, 5, 0] as const).map(trackCellSize);
    for (let i = 0; i < sizes.length - 1; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i + 1]);
    }
  });
});

describe("RT-2: 갱신 표시", () => {
  it("RT-2-1: 첫 제출은 순위 밖이어도 표시, 다른 순위 밖은 갱신 아님", () => {
    const marks = buildTrackMarks(history(["out", "out", 500, "out"]));
    expect(marks).toEqual([
      { label: 1, rank: -1 },
      { label: 3, rank: 500 },
    ]);
  });

  it("RT-2-2: 최고 순위가 바뀔 때만", () => {
    expect(labels([500, 300, 400, 100])).toEqual([1, 2, 4]);
  });

  it("RT-2-3: 힌트는 힌트 표시", () => {
    expect(labels([500, { hint: 80 }, 120])).toEqual([1, "hint"]);
  });

  it("RT-2-4: 초성은 표시 없음", () => {
    expect(labels([500, "consonant", 300])).toEqual([1, 2]);
  });

  it("RT-2-5: 기록이 없으면 표시 없음", () => {
    expect(buildTrackMarks([])).toEqual([]);
  });
});

describe("RT-3: 끝점", () => {
  it("RT-3-1: 맞히면 시도 횟수, 정답은 갱신 표시가 아님", () => {
    const words = history([500, "answer"]);
    expect(trackEnd(words, { givenUp: false })).toEqual({ kind: "solved", attempts: 2 });
    expect(buildTrackMarks(words).map((m) => m.label)).toEqual([1]);
  });

  it("RT-3-2: 포기하면 포기, 갱신 표시는 그대로", () => {
    const words = history([500, 300, "giveUp"]);
    expect(trackEnd(words, { givenUp: true })).toEqual({ kind: "givenUp" });
    expect(buildTrackMarks(words).map((m) => m.label)).toEqual([1, 2]);
  });

  it("RT-3-3: 진행 중", () => {
    expect(trackEnd(history([500]), { givenUp: false })).toEqual({ kind: "playing" });
  });
});

describe("RT-4: 글자 숨김", () => {
  it("RT-4-1: 겹치면 오래된 쪽을 숨김", () => {
    const words = history(["out", 500, 100, 99, 10]);
    const marks = buildTrackMarks(words);
    expect(marks.map((m) => m.label)).toEqual([1, 2, 3, 4, 5]);
    expect(visibleLabels(marks, trackEnd(words, { givenUp: false }), GAP)).toEqual([true, true, false, true, true]);
  });

  it("RT-4-2: 시작·처음 순위권·마지막 갱신은 겹쳐도 보임", () => {
    const words = history([900, 899]);
    expect(visibleLabels(buildTrackMarks(words), trackEnd(words, { givenUp: false }), GAP)).toEqual([true, true]);
  });

  it("RT-4-3: 마지막 갱신과 끝점은 겹쳐도 보임", () => {
    const words = history([500, 3, "answer"]);
    expect(trackPosition(3) + GAP).toBeGreaterThan(TRACK_END_POSITION); // 겹치는 간격인지
    expect(visibleLabels(buildTrackMarks(words), trackEnd(words, { givenUp: false }), GAP)).toEqual([true, true]);
  });
});
