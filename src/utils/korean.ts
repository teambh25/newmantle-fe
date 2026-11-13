const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 단어 뒤에 붙는 주제 조사 "은/는". 마지막 글자 받침으로 고르고, 한글이 아니면 "은(는)" */
export function topicParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < HANGUL_START || code > HANGUL_END) return "은(는)";
  // 한글 음절 = 0xAC00 + (초성 × 21 + 중성) × 28 + 종성. 종성 0이면 받침 없음
  return (code - HANGUL_START) % 28 === 0 ? "는" : "은";
}

/** 안내 문구에 넣을 단어. 6글자를 넘으면 앞 5글자 + "…" (docs/tasks/ui/input/plan.md 4) */
export function shortenWord(word: string): string {
  const chars = Array.from(word);
  return chars.length > 6 ? chars.slice(0, 5).join("") + "…" : word;
}
