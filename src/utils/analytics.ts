// Amplitude로 보낼지·무엇을 보낼지 정하는 규칙 (docs/rules/amplitude.md)
// "하루"는 퀴즈 날짜(KST gameDate) 기준이다 (docs/specs/amplitude-migration Dec-11)
import type { SubmittedWord } from "@/utils/api";
import { parseProgressView, type ProgressViewOf, type ProgressViewTheme } from "@/utils/progressView";

/** `Game Page Visited`를 마지막으로 보낸 퀴즈 날짜 */
export const PAGE_VISIT_LOGGED_KEY = "newmantle_page_visit_logged_date";
/** `Stats Page Visited`를 마지막으로 보낸 KST 날짜 */
export const STATS_VISIT_LOGGED_KEY = "newmantle_stats_visit_logged_date";

/**
 * 방문 이벤트(게임 화면·통계 페이지)를 보낼지. 통계 페이지는 퀴즈 날짜 대신 KST 오늘 날짜를 넘긴다 (Dec-48).
 * 퀴즈 날짜가 정해지기 전(빈 값)에는 보내지 않고, 그 퀴즈 날짜에 이미 보냈으면 보내지 않는다.
 * 기록을 읽을 수 없으면 보낸다 (Dec-10)
 */
export function shouldLogPageVisit(quizDate: string, readLastVisitDate: () => string | null): boolean {
  if (!quizDate) return false;
  try {
    return readLastVisitDate() !== quizDate;
  } catch {
    return true;
  }
}

/** 게임 중 그날 첫 제출(`Word Submitted`)을 보낸 퀴즈 날짜 */
export const WORD_SUBMITTED_LOGGED_KEY = "newmantle_word_submitted_logged_date";
/** 게임이 끝난 뒤 그날 첫 제출(`Post Game Word Submitted`)을 보낸 퀴즈 날짜 */
export const POST_GAME_SUBMITTED_LOGGED_KEY = "newmantle_post_game_submitted_logged_date";

type GameEnd = { gameCompleted: boolean; givenUp: boolean };

const isEnded = (game: GameEnd) => game.gameCompleted || game.givenUp;

/** 그 퀴즈 날짜에 보낸 기록이 없는지. 기록을 읽을 수 없으면 없는 것으로 본다 (Dec-10) */
function notLoggedOn(quizDate: string, readLoggedDate: () => string | null): boolean {
  try {
    return readLoggedDate() !== quizDate;
  } catch {
    return true;
  }
}

/**
 * 게임 중 그날 첫 제출인지. 게임이 끝나지 않았고, 그날 보낸 기록이 없고, 기록에 직접 낸 단어가 없어야 한다.
 * 힌트로 받은 단어(attempt -1)는 세지 않는다 (Dec-2, Dec-43, Dec-46)
 */
export function shouldLogWordSubmitted(
  game: GameEnd & { submittedWords: SubmittedWord[] },
  quizDate: string,
  readLoggedDate: () => string | null
): boolean {
  if (isEnded(game)) return false;
  if (game.submittedWords.some((w) => w.attempt > 0)) return false;
  return notLoggedOn(quizDate, readLoggedDate);
}

/** 게임이 끝난 뒤 그날 첫 제출인지 (Dec-43, Dec-46) */
export function shouldLogPostGameSubmission(
  game: GameEnd,
  quizDate: string,
  readLoggedDate: () => string | null
): boolean {
  return isEnded(game) && notLoggedOn(quizDate, readLoggedDate);
}

/** 게임이 어떻게 끝났나. 포기한 게임도 gameCompleted가 true라 givenUp을 먼저 본다 (Dec-43) */
export function getEndedBy(game: { givenUp: boolean }): "solved" | "given_up" {
  return game.givenUp ? "given_up" : "solved";
}

/** 그날 일반 힌트를 쓴 적이 없으면 첫 일반 힌트. 초성 힌트는 세지 않는다 (Dec-4) */
export function isFirstNormalHint(game: { hintUsed: number; initialConsonantHintUsed: boolean }): boolean {
  return game.hintUsed === 0;
}

/** 저장된 테마. 없거나 모르는 값이면 classic이고 직접 고르지 않은 것(chosen false) (Dec-30) */
export function parseThemeSetting(raw: string | null): { value: "classic" | "excel"; chosen: boolean } {
  if (raw === "classic" || raw === "excel") return { value: raw, chosen: true };
  return { value: "classic", chosen: false };
}

/** 저장된 진행 상황 보기. 그 테마에서 올바른 값일 때만 chosen true (Dec-30) */
export function parseProgressViewSetting<T extends ProgressViewTheme>(
  raw: string | null,
  theme: T
): { value: ProgressViewOf<T>; chosen: boolean } {
  const value = parseProgressView(raw, theme);
  return { value, chosen: raw === value };
}
