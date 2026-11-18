// 로직 레벨: excel 순위 그래프의 점과 단어 표시 (docs/specs/excel-ui)
import { describe, expect, it } from "vitest";
import type { SubmittedWord } from "@/utils/api";
import { CHART_TICKS, chartPoints, chartTicks, chartTopLevel, limitPoints, visibleLabels, type LabelBox } from "@/utils/rankChart";

/** 시간 순(먼저 한 것이 앞)으로 받아 저장 형태(최근 것이 앞)로 바꾼다 */
type Step = number | "out" | "answer" | { hint: number };
function history(steps: Step[]): SubmittedWord[] {
  let attempt = 0;
  const words = steps.map((s, i): SubmittedWord => {
    if (s === "answer") return { word: "정답", similarity: 100, rank: 0, attempt: ++attempt, correct: true };
    if (typeof s === "object") return { word: `힌트${i}`, similarity: 50, rank: s.hint, attempt: -1, correct: false };
    return { word: `단어${i}`, similarity: 10, rank: s === "out" ? -1 : s, attempt: ++attempt, correct: false };
  });
  return words.reverse();
}

describe("그래프 점", () => {
  const records = (points: ReturnType<typeof chartPoints>) => points.filter((p) => p.kind === "record");

  it("진행 중: 최고 기록을 깬 단어만 시간 순으로, 순위가 좋을수록 높게", () => {
    const points = records(chartPoints(history([500, "out", 300, 400, 100]), "playing"));
    expect(points.map((p) => p.word)).toEqual(["단어0", "단어2", "단어4"]);
    const levels = points.map((p) => p.level);
    expect(levels[0]).toBeLessThan(levels[1]);
    expect(levels[1]).toBeLessThan(levels[2]);
  });

  it("점마다 시도 번호, 힌트 단어는 시도 번호 없음(-1)", () => {
    const points = records(chartPoints(history([500, { hint: 80 }, 30]), "playing"));
    expect(points.map((p) => p.attempt)).toEqual([1, -1, 2]);
  });

  it("진행 중 최고가 20위 안: 마지막에 정답 자리 목표 점이 맨 위", () => {
    const points = chartPoints(history([500, 20]), "playing");
    expect(points[points.length - 1]).toMatchObject({ level: 1, kind: "target", attempt: null });
  });

  it("진행 중 최고가 20위 밖: 목표 점 없음", () => {
    const points = chartPoints(history([500, 21]), "playing");
    expect(points.map((p) => p.kind)).toEqual(["record", "record"]);
  });

  it("진행 중 초성 힌트를 썼으면 20위 밖이어도 목표 점이 있고 글자가 초성", () => {
    const words: SubmittedWord[] = [
      { word: "ㅅㄹ", similarity: null, rank: 0, attempt: -1, correct: false },
      ...history([500]),
    ];
    const points = chartPoints(words, "playing");
    expect(points[points.length - 1]).toMatchObject({ word: "ㅅㄹ", kind: "target" });
  });

  it("높이는 0(999위) ~ 1(정답 자리) 안", () => {
    const [low, high] = records(chartPoints(history([999, 1]), "playing"));
    expect(low.level).toBeGreaterThanOrEqual(0);
    expect(high.level).toBeLessThan(1);
  });

  it("순위권 단어가 없으면 점 없음", () => {
    expect(chartPoints(history(["out", "out"]), "playing")).toEqual([]);
  });

  it("맞힘: 마지막에 정답 점이 맨 위", () => {
    const points = chartPoints(history([500, 100, "answer"]), "solved");
    const last = points[points.length - 1];
    expect(last).toEqual({ word: "정답", level: 1, kind: "answer", attempt: 3 });
    expect(points).toHaveLength(3);
  });

  it("포기: 마지막에 포기 표시 정답 점이 맨 위", () => {
    const points = chartPoints(history([500, "answer"]), "givenUp");
    expect(points[points.length - 1]).toEqual({ word: "정답", level: 1, kind: "givenUp", attempt: 2 });
  });
});

describe("그래프 위 끝 (최고 순위의 다음 단계까지)", () => {
  const tick = (rank: number) => CHART_TICKS.find((t) => t.rank === rank)!.level;
  const top = (steps: Step[]) => chartTopLevel(chartPoints(history(steps), "playing"));

  it("최고 999~301위 → 300위 눈금", () => {
    expect(top([500, 301])).toBe(tick(300));
  });

  it("최고 300~101위 → 100위 눈금", () => {
    expect(top([500, 300])).toBe(tick(100));
  });

  it("최고 100~51위 → 50위 눈금", () => {
    expect(top([500, 100])).toBe(tick(50));
  });

  it("최고 50~21위 → 20위 눈금", () => {
    expect(top([500, 21])).toBe(tick(20));
  });

  it("목표 점이 있으면 정답 자리", () => {
    expect(top([500, 10])).toBe(1);
  });

  it("끝났으면 정답 자리", () => {
    expect(chartTopLevel(chartPoints(history([500, "answer"]), "solved"))).toBe(1);
  });
});

describe("세로축 눈금", () => {
  const ticks = (steps: Step[]) => chartTicks(chartPoints(history(steps), "playing")).map((t) => t.rank);

  it("순위권 단어가 없으면 바닥(999위) 눈금 하나만", () => {
    expect(ticks(["out", "out"])).toEqual([999]);
  });

  it("순위권 단어가 있으면 바닥부터 위 끝(다음 단계)까지", () => {
    expect(ticks([500, 80])).toEqual([999, 300, 100, 50]);
  });
});

describe("점 위 단어 표시", () => {
  const box = (left: number, top = 0, width = 40, height = 14): LabelBox => ({
    left,
    right: left + width,
    top,
    bottom: top + height,
  });

  it("안 겹치면 모두 보임", () => {
    expect(visibleLabels([box(0), box(50), box(100)])).toEqual([true, true, true]);
  });

  it("마지막(지금 최고)은 늘 보이고, 겹치는 앞 단어는 숨김", () => {
    expect(visibleLabels([box(0), box(90), box(100)])).toEqual([true, false, true]);
  });

  it("처음 것은 마지막과 안 겹치면 보이고, 나머지는 최근 것부터 자리가 있으면 보임", () => {
    // 1·2가 서로 겹침 → 최근인 2가 먼저 자리를 잡는다
    expect(visibleLabels([box(0), box(45), box(60), box(200)])).toEqual([true, false, true, true]);
  });

  it("가로로 겹쳐도 높이가 다르면 둘 다 보임", () => {
    expect(visibleLabels([box(0, 50), box(20, 0)])).toEqual([true, true]);
  });

  it("우선순위를 주면 그 순서대로 자리를 잡는다", () => {
    // 0·1·2가 모두 겹침. 1 → 2 → 0 순서면 1만 보인다
    expect(visibleLabels([box(0), box(10), box(20)], [1, 2, 0])).toEqual([false, true, false]);
  });

  it("단어가 없으면 빈 목록", () => {
    expect(visibleLabels([])).toEqual([]);
  });
});

describe("모바일 점 개수 제한", () => {
  const records = (points: ReturnType<typeof chartPoints>) => points.filter((p) => p.kind === "record").map((p) => p.word);

  it("시작점은 지금 최고 구간 바로 아래 구간에 처음 들어간 점, 중간은 최근 것부터 정한 개수까지, 목표 점은 그대로", () => {
    // 900·500(999~301) → 250·200·150(300~101) → 90·80·70(100~51) → 40(50~21). 아래 구간 첫 점 = 90
    const points = limitPoints(chartPoints(history([900, 500, 250, 200, 150, 90, 80, 70, 40]), "playing"), 3);
    expect(records(points)).toEqual(["단어5", "단어6", "단어7", "단어8"]);
  });

  it("중간 점이 많으면 최근 것부터 정한 개수까지", () => {
    // 지금 최고 70(100~51) → 아래 구간(300~101) 첫 점 280부터
    const points = limitPoints(chartPoints(history([900, 280, 260, 240, 220, 200, 70]), "playing"), 3);
    expect(records(points)).toEqual(["단어1", "단어3", "단어4", "단어5", "단어6"]);
  });

  it("맨 아래 구간이면 맨 처음 점부터", () => {
    const points = limitPoints(chartPoints(history([900, 800, 700]), "playing"), 3);
    expect(records(points)).toEqual(["단어0", "단어1", "단어2"]);
  });

  it("아래 구간을 건너뛰고 올라왔으면 지금 구간에 들어오기 직전 점부터", () => {
    // 900·500(999~301) → 80(100~51): 300~101 구간이 없음 → 직전 점 500부터
    const points = limitPoints(chartPoints(history([900, 500, 80]), "playing"), 3);
    expect(records(points)).toEqual(["단어1", "단어2"]);
  });

  it("목표 점·정답 점은 그대로", () => {
    const points = limitPoints(chartPoints(history([900, 500, 250, 90, 15]), "playing"), 3);
    expect(points[points.length - 1].kind).toBe("target");
  });
});
