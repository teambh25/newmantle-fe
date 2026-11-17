// 게임판에 보일 것 계산: 날짜 제목에 드러낼 단어, 방금 입력 칸(진행 상황 카드), 기록 표, 게이지 최고 순위, 게임 끝 상태.
// 저장된 기록과 화면 상태만 받아 계산하는 순수 함수 (docs/tasks/ui/word-list/plan.md 1·4, input/plan.md 3, progress-card/plan.md 2·3)
import type { SubmittedWord } from "@/utils/api";
import { compareByRank, getTopRank } from "@/utils/gameRules";
import { trackCellBottom, trackCellSize, trackPosition } from "@/utils/rankTrack";

export type TopRowTone = "unknown" | "failed" | "consonant" | "answer" | "givenUp";

/** 방금 입력 칸에 올 수 있는 것 (docs/tasks/ui/progress-card/plan.md 3, input/plan.md 3) */
export type LatestRow =
  | { kind: "word"; word: SubmittedWord; isRepeat: boolean }
  /** 기록 표에 안 들어가는 항목: 없는 단어·제출 실패(저장 안 함), 초성, 정답 */
  | { kind: "notice"; word: string; tone: TopRowTone; attempt?: number; message?: string }
  /** 제출 중 (0.3초 넘게 걸릴 때) */
  | { kind: "pending"; word: string; attempt: number };

export type GameEnd = "playing" | "solved" | "givenUp";

/** 없는 단어·제출 실패 임시 줄. 저장하지 않는다 (input/plan.md 3) */
export type SubmitNotice = { word: string; tone: "unknown" | "failed"; message?: string };

export interface BoardInput {
  /** 저장된 기록 (최근 것이 앞) */
  words: SubmittedWord[];
  gameCompleted: boolean;
  givenUp: boolean;
  /** 지금까지 제출 횟수. 제출 중 줄의 시도 번호에 쓴다 */
  attempts: number;
  notice: SubmitNotice | null;
  /** 응답이 늦은 제출 중 단어 */
  pendingWord: string | null;
  /** 방금 다시 낸 이미 제출한 단어 */
  repeatedWord: string | null;
  /** 방금 입력 자리 모양. 기본은 카드 (docs/specs/progress-view-toggle Dec-7) */
  view?: "card" | "bar";
  /** 힌트·초성 힌트·포기 실패 안내. 상단바는 방금 입력 줄에 보여 준다 (카드는 배너가 따로 받음, Dec-8) */
  requestError?: string | null;
}

export interface Board {
  /** 날짜 제목에 드러낼 단어: 진행 중이면 초성, 끝나면 정답. 없으면 null */
  reveal: string | null;
  /** 방금 입력 칸. 아직 아무것도 안 했으면 null */
  latest: LatestRow | null;
  /** 기록 표: 순위를 아는 단어(입력·힌트), 순위순. 카드는 전부, 상단바는 방금 입력 칸의 단어를 뺀다 */
  history: SubmittedWord[];
  /** 게이지 최고 순위. 순위 있는 단어가 없으면 null */
  best: number | null;
  end: GameEnd;
}

const isConsonant = (w: SubmittedWord) => w.attempt === -1 && w.rank === 0;
/** 초성·정답은 제목에 보이므로 기록 표에서 뺀다 */
const inHeading = (w: SubmittedWord) => isConsonant(w) || w.correct;

export function buildBoard({
  words,
  gameCompleted,
  givenUp,
  attempts,
  notice,
  pendingWord,
  repeatedWord,
  view = "card",
  requestError = null,
}: BoardInput): Board {
  const gameOver = gameCompleted || givenUp;
  const answerWord = words.find((w) => w.correct)?.word;
  const consonantWord = words.find(isConsonant)?.word;
  const reveal = (gameOver ? answerWord : consonantWord) ?? null;

  // 방금 입력 칸은 늘 가장 최근 항목. 기록 표에 없는 것(임시 줄, 초성, 정답)은 방금 칸에만 둔다
  const last = words[0];
  // 상단바는 요청 실패도 방금 입력 줄에 (카드는 배너가 error로 따로 받는다)
  const failure: SubmitNotice | null =
    view === "bar" && requestError ? { word: "", tone: "failed", message: requestError } : null;
  const shownNotice = failure ?? notice;
  const notInTable: Extract<LatestRow, { kind: "notice" }> | null = shownNotice
    ? { kind: "notice", ...shownNotice }
    : last && isConsonant(last)
      ? { kind: "notice", word: last.word, tone: "consonant" }
      : last?.correct
        ? { kind: "notice", word: last.word, tone: givenUp ? "givenUp" : "answer", attempt: last.attempt }
        : null;
  const latest: LatestRow | null = pendingWord
    ? { kind: "pending", word: pendingWord, attempt: attempts + 1 }
    : notInTable
      ? notInTable
      : last
        ? { kind: "word", word: last, isRepeat: repeatedWord !== null && last.word === repeatedWord }
        : null;

  // 상단바는 머리줄을 같이 쓰는 한 표처럼 보여서, 방금 입력 칸의 단어는 다음 항목이 올 때 기록으로 옮긴다 (Dec-7)
  const inLatest = view === "bar" && latest?.kind === "word" ? latest.word : null;
  const history = words.filter((w) => !inHeading(w) && w !== inLatest).sort(compareByRank);

  // 포기도 gameCompleted가 true라 포기를 먼저 본다
  const end: GameEnd = givenUp ? "givenUp" : gameCompleted ? "solved" : "playing";

  return { reveal, latest, history, best: getTopRank(words), end };
}

/** 게이지 막대 끝(1위 칸 위 끝). 그 오른쪽은 정답 자리 */
export const GAUGE_BAR_END = trackCellBottom(1) + trackCellSize(1);

/** 게이지 채움 끝 위치 (0 ~ GAUGE_BAR_END). 맞히면 끝까지(그 뒤 단어를 내도 그대로), 아니면 최고 순위까지 (progress-card/plan.md 2) */
export function gaugeFill(best: number | null, end: GameEnd): number {
  if (end === "solved") return GAUGE_BAR_END;
  return best === null ? 0 : trackPosition(best);
}
