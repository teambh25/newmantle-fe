// 진행 상황 카드: 바 아래 지난 기록 말풍선 (docs/tasks/ui/progress-card/plan.md 2)
import type { SubmittedWord } from "@/utils/api";
import { trackPosition } from "@/utils/rankTrack";

/** 최고 기록을 깬 단어 하나 */
export type RecordBubble = { word: string; rank: number };

/**
 * 저장 순서(최근 것이 앞)를 시간 순으로. 이미 낸 단어를 다시 내면 저장에서 맨 앞으로 옮겨지므로(useGameState moveWordToTop)
 * 입력 단어는 시도 번호로 줄 세운다. 힌트는 번호가 없어서, 저장에서 바로 앞(더 오래된 쪽)에 있던 입력 번호 뒤에 둔다
 */
function chronological(words: SubmittedWord[]): SubmittedWord[] {
  let lastAttempt = 0;
  const keyed = [...words].reverse().map((w, i) => {
    if (w.attempt >= 1) lastAttempt = Math.max(lastAttempt, w.attempt);
    return { w, key: w.attempt >= 1 ? w.attempt : lastAttempt + 0.5, i };
  });
  return keyed.sort((a, b) => a.key - b.key || a.i - b.i).map((k) => k.w);
}

/**
 * 최고 기록을 깬 단어들, 시간 순 (먼저 한 것이 앞).
 * 순위 밖·초성·정답은 빼고 힌트는 넣는다. 게임이 끝난 뒤 낸 단어도, 방금 낸 새 최고도 넣는다 (채움과 같은 기준).
 * words는 저장 형태 (최근 것이 앞)
 */
export function recordBubbles(words: SubmittedWord[]): RecordBubble[] {
  const out: RecordBubble[] = [];
  let best = Infinity;
  for (const w of chronological(words)) {
    if (w.correct || w.rank < 1) continue;
    if (w.rank >= best) continue;
    best = w.rank;
    out.push({ word: w.word, rank: w.rank });
  }
  return out;
}

/** 말풍선 글자 크기(px)·좌우 여백(px)·사이 간격(px). 폭은 글자 수로 어림 */
const CHAR_PX = 11;
const PAD_PX = 14;
const GAP_PX = 4;

export const bubbleWidth = (word: string) => word.length * CHAR_PX + PAD_PX;

/** 몸통 [왼쪽, 오른쪽]. left p% + translateX(-p%)로 놓여 양 끝에서도 카드 안 */
function span(b: RecordBubble, width: number, widthOf: (word: string) => number): [number, number] {
  const w = widthOf(b.word);
  const left = trackPosition(b.rank) * (width - w);
  return [left, left + w];
}

/**
 * 말풍선마다 보일지. 지금 최고(마지막)는 늘, 처음 것은 최고와 안 겹치면, 나머지는 최근 것부터 안 겹치면 보인다.
 * width는 카드 안쪽 폭(px). 모르면(0) 최고만. widthOf는 말풍선 폭(px), 화면에서는 실제 글자 폭을 잰다
 */
export function visibleBubbles(
  bubbles: RecordBubble[],
  width: number,
  widthOf: (word: string) => number = bubbleWidth,
): boolean[] {
  const shown = bubbles.map(() => false);
  if (bubbles.length === 0) return shown;
  const last = bubbles.length - 1;
  shown[last] = true;
  if (width <= 0) return shown;
  const taken = [span(bubbles[last], width, widthOf)];
  const fits = (s: [number, number]) => taken.every(([l, r]) => s[1] + GAP_PX <= l || s[0] >= r + GAP_PX);
  const order = [0, ...Array.from({ length: last }, (_, k) => last - 1 - k).filter((i) => i !== 0)];
  for (const i of order) {
    if (i === last) continue;
    const s = span(bubbles[i], width, widthOf);
    if (fits(s)) {
      shown[i] = true;
      taken.push(s);
    }
  }
  return shown;
}
