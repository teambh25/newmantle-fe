// excel 순위 그래프 계산: 점 목록, 눈금, 점 위 단어 표시 (docs/specs/excel-ui Dec-47~Dec-51)
import type { SubmittedWord } from "@/utils/api";
import type { GameEnd } from "@/utils/board";
import { getTopRank } from "@/utils/gameRules";
import { recordBubbles } from "@/utils/progressMarks";
import { TRACK_END_POSITION, trackCellBottom, trackPosition } from "@/utils/rankTrack";

/**
 * 그래프 점 하나. level: 0 = 999위 칸 아래 끝, 1 = 정답 자리.
 * kind: 기록을 깬 단어 / 맞힌 정답 / 포기한 정답 / 진행 중 정답 자리(목표, 정답은 드러내지 않음).
 * attempt: 시도 번호. 힌트 단어는 -1, 목표 점은 null
 */
export type ChartPoint = {
  word: string;
  level: number;
  kind: "record" | "answer" | "givenUp" | "target";
  attempt: number | null;
};

/** 목표 점 위 글자. 초성 힌트를 썼으면 초성 (Dec-60) */
const TARGET_LABEL = "정답은?";
const isConsonant = (w: SubmittedWord) => w.attempt === -1 && w.rank === 0;

/** 그래프 바닥: 순위 밖은 그리지 않으므로 999위 칸 아래 끝 */
const BOTTOM = trackCellBottom(5);

/** 순위 → 그래프 높이 (classic 게이지와 같은 눈금, src/utils/rankTrack.ts) */
const levelOf = (position: number) => (position - BOTTOM) / (TRACK_END_POSITION - BOTTOM);

/**
 * 그래프 점: 최고 기록을 깬 단어만 시간 순으로 (Dec-47, classic 지난 기록 말풍선과 같은 기준).
 * 마지막은 맨 위 정답 자리: 끝났으면 정답 점, 진행 중이면 목표 점 (Dec-55)
 */
export function chartPoints(words: SubmittedWord[], end: GameEnd): ChartPoint[] {
  const points: ChartPoint[] = recordBubbles(words).map((b) => ({
    word: b.word,
    level: levelOf(trackPosition(b.rank)),
    kind: "record",
    attempt: words.find((w) => w.word === b.word)?.attempt ?? null,
  }));
  const answer = words.find((w) => w.correct);
  if (end !== "playing" && answer) {
    points.push({ word: answer.word, level: 1, kind: end === "solved" ? "answer" : "givenUp", attempt: answer.attempt });
  } else if (end === "playing") {
    // 목표 점은 20위 안에 들어왔을 때부터. 초성 힌트를 썼으면 초성을 보여야 하므로 그 전에도 (Dec-61)
    const consonant = words.find(isConsonant);
    const best = getTopRank(words);
    if (consonant || (best !== null && best <= TARGET_SHOW_RANK)) {
      points.push({ word: consonant?.word ?? TARGET_LABEL, level: 1, kind: "target", attempt: null });
    }
  }
  return points;
}

/** 가로 눈금선: 구간 경계, 이름은 그 위 구간이 시작하는 순위 (classic 게이지 숫자 눈금과 같음) */
export const CHART_TICKS: { rank: number; level: number }[] = (
  [
    [5, 999],
    [4, 300],
    [3, 100],
    [2, 50],
    [1, 20],
  ] as const
).map(([tier, rank]) => ({ rank, level: levelOf(trackCellBottom(tier)) }));

/** 목표 점을 보이기 시작하는 순위 */
const TARGET_SHOW_RANK = 20;

/** 점 위 단어 상자 (px) */
export type LabelBox = { left: number; right: number; top: number; bottom: number };

/** 상자 사이 최소 간격 (px) */
const LABEL_GAP = 2;

const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.right + LABEL_GAP && b.left < a.right + LABEL_GAP && a.top < b.bottom && b.top < a.bottom;

/** 기본 우선순위: 마지막(지금 최고) → 처음 → 나머지는 최근 것부터 */
function defaultOrder(n: number): number[] {
  if (n === 0) return [];
  const order = [n - 1];
  if (n > 1) order.push(0);
  for (let i = n - 2; i >= 1; i--) order.push(i);
  return order;
}

/**
 * 단어마다 보일지 (Dec-47, Dec-83). 우선순위대로 이미 보이는 것과 안 겹치면 보인다. 높이가 달라 안 겹치면 둘 다 보인다.
 * order를 안 주면 마지막(지금 최고)은 늘, 처음 것은 마지막과 안 겹치면, 나머지는 최근 것부터
 */
export function visibleLabels(boxes: LabelBox[], order: number[] = defaultOrder(boxes.length)): boolean[] {
  const shown = boxes.map(() => false);
  const placed: LabelBox[] = [];
  for (const i of order) {
    if (placed.some((p) => overlaps(p, boxes[i]))) continue;
    shown[i] = true;
    placed.push(boxes[i]);
  }
  return shown;
}

/**
 * 그래프 위 끝 높이: 지금 최고 순위의 다음 단계 눈금까지만 (Dynamic Y-Axis, Dec-63).
 * 999~301위 → 300위, 300~101위 → 100위, 100~51위 → 50위, 50~21위 → 20위. 목표·정답 점이 있으면 정답 자리(1)
 */
export function chartTopLevel(points: ChartPoint[]): number {
  if (points.some((p) => p.level === 1)) return 1;
  const best = Math.max(0, ...points.map((p) => p.level));
  return CHART_TICKS.find((t) => t.level > best)?.level ?? 1;
}

/** 보일 눈금: 점이 하나도 없으면(순위권 단어 없음) 바닥(999위) 하나만, 있으면 바닥부터 위 끝까지 (Dec-63, Dec-64) */
export function chartTicks(points: ChartPoint[]): typeof CHART_TICKS {
  if (points.length === 0) return CHART_TICKS.slice(0, 1);
  const top = chartTopLevel(points);
  return CHART_TICKS.filter((t) => t.level <= top);
}

/** 점이 몇 번째 구간인지: 1 = 999~301위 … 5 = 20~1위 (눈금선 기준) */
const bandOf = (p: ChartPoint) => CHART_TICKS.filter((t) => t.level <= p.level).length;

/**
 * 좁은 화면용 점 줄이기 (Dec-84, Dec-85). 기록 점 중
 * - 시작점: 지금 최고(끝점) 구간 바로 아래 구간에 처음 들어간 점. 맨 아래 구간이면 맨 처음 점,
 *   아래 구간을 건너뛰고 올라왔으면 지금 구간에 들어오기 직전 점
 * - 끝점(지금 최고)은 늘, 중간은 시작점과 끝점 사이에서 최근 것부터 maxMiddle개까지
 * 정답·목표 점은 그대로 둔다
 */
export function limitPoints(points: ChartPoint[], maxMiddle: number): ChartPoint[] {
  const records = points.filter((p) => p.kind === "record");
  if (records.length === 0) return points;
  const endBand = bandOf(records[records.length - 1]);
  let start = 0;
  if (endBand > 1) {
    const first = records.findIndex((p) => bandOf(p) >= endBand - 1);
    start = bandOf(records[first]) === endBand ? Math.max(first - 1, 0) : first;
  }
  const segment = records.slice(start);
  const middle = segment.slice(1, -1).slice(-maxMiddle);
  const kept = new Set([segment[0], ...middle, segment[segment.length - 1]]);
  return points.filter((p) => p.kind !== "record" || kept.has(p));
}
