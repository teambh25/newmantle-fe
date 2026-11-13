// 개발 전용: 화면 확인용 가짜 기록 (docs/tasks/ui/dev-page/plan.md)
import type { SubmittedWord } from "@/utils/api";

const w = (word: string, rank: number, similarity: number | null, attempt: number): SubmittedWord => ({
  word,
  rank,
  similarity,
  attempt,
  correct: false,
});
const hint = (word: string, rank: number, similarity: number) => w(word, rank, similarity, -1);
const consonant = (): SubmittedWord => w("ㅅㄹ", 0, null, -1);

/** 모든 단계가 한 번씩 나오는 입력 단어 (attempt 순서와 무관하게 정렬됨) */
const spread: SubmittedWord[] = [
  w("책상", 612, 12.04, 1),
  w("바다", -1, 3.21, 2),
  w("사과", 288, 21.5, 3),
  w("구름", 999, 9.87, 4),
  w("의자", 301, 17.3, 5),
  w("기차", -1, 1.02, 6),
  w("우산", 150, 24.11, 7),
  w("하늘", 100, 28.4, 8),
  w("연필", 77, 30.92, 9),
  w("나무", 51, 33.0, 10),
  w("고양이", 50, 33.15, 11),
  w("바람", 45, 34.8, 12),
  w("강아지", 21, 39.6, 13),
  w("햇살", 20, 40.2, 14),
  w("꽃잎", 15, 42.77, 15),
  w("봄비", 3, 55.31, 16),
];
const hints = [hint("들판", 749, 11.2), hint("새싹", 24, 38.9)];

export interface Scenario {
  id: string;
  label: string;
  words: SubmittedWord[];
  solved?: boolean;
  givenUp?: boolean;
}

/** words는 저장 순서(최근 것이 앞). 맨 앞이 "방금 입력" 줄 */
export const SCENARIOS: Scenario[] = [
  {
    id: "spread",
    label: "순위 골고루 (방금 입력 = 37위)",
    words: [w("햇볕", 37, 35.6, 17), ...hints, consonant(), ...[...spread].reverse()],
  },
  {
    id: "hint-latest",
    label: "방금 힌트 받음",
    words: [hint("새순", 20, 40.1), w("햇볕", 37, 35.6, 17), hints[0], consonant(), ...[...spread].reverse()],
  },
  {
    id: "consonant-latest",
    label: "방금 초성 받음",
    words: [consonant(), w("햇볕", 37, 35.6, 17), ...hints, ...[...spread].reverse()],
  },
  {
    id: "solved",
    label: "방금 정답",
    words: [{ ...w("소리", 0, 100, 18), correct: true }, w("햇볕", 37, 35.6, 17), ...hints, consonant(), ...[...spread].reverse()],
    solved: true,
  },
  {
    id: "gave-up",
    label: "포기함",
    // 포기하면 정답이 그때까지의 입력 수를 attempt로 맨 앞에 저장됨 (useGameState giveUp)
    words: [{ ...w("소리", 0, 100, 17), correct: true }, w("햇볕", 37, 35.6, 17), ...hints, consonant(), ...[...spread].reverse()],
    givenUp: true,
  },
  {
    id: "seven",
    label: "단어 7개 (더보기 없이 꽉 참)",
    words: [w("햇볕", 37, 35.6, 7), w("봄비", 3, 55.31, 6), w("바람", 45, 34.8, 5), w("나무", 51, 33.0, 4), w("우산", 150, 24.11, 3), w("의자", 301, 17.3, 2), w("책상", 612, 12.04, 1)],
  },
  {
    id: "few",
    label: "단어 3개 (더보기 없음)",
    words: [w("봄비", 3, 55.31, 3), w("우산", 150, 24.11, 2), w("책상", 612, 12.04, 1)],
  },
];
