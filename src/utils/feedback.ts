import { ensureGuestId } from "@/utils/guestId";

// 피드백으로 시트에 적을 행. Apps Script(apps-script/feedback/Code.gs)로 보낸다 (docs/specs/feedback-migration)

const GAME_DATA_KEY = "newmantle_game_data";

type GameStatus = "playing" | "solved" | "given_up";

/** 클라이언트가 정하는 값만 담는다. 받은 시각은 Apps Script가 적는다 (Dec-7) */
export interface FeedbackRow {
  feedback: string;
  quiz_date: string;
  game_status: GameStatus;
  user_type: "user" | "guest";
  subject_id: string;
}

/** 그 퀴즈 날짜의 게임 기록에서 진행 상태를 읽는다. 게임 기록은 바꾸지 않는다 */
function readGameStatus(quizDate: string): GameStatus {
  try {
    const data = JSON.parse(localStorage.getItem(GAME_DATA_KEY) ?? "null");
    if (!data || data.lastPlayedDate !== quizDate) return "playing";
    if (data.givenUp) return "given_up";
    if (data.gameCompleted) return "solved";
  } catch {
    // 읽지 못하면 진행 중으로 본다
  }
  return "playing";
}

/**
 * 보낼 행을 만든다.
 * - 로그인했으면 Supabase user id, 아니면 게스트 ID. 게스트 ID가 없으면 만든다 (Dec-7, Dec-8)
 * - quizDate는 hook이 열린 게임 화면 기준으로 정해 넘긴다. game_status도 그 날짜로 읽는다 (Dec-9)
 */
export function buildFeedbackRow({
  feedback,
  userId,
  quizDate,
}: {
  feedback: string;
  userId: string | null;
  quizDate: string;
}): FeedbackRow {
  const identity = userId
    ? { user_type: "user" as const, subject_id: userId }
    : { user_type: "guest" as const, subject_id: ensureGuestId() };
  return {
    feedback: feedback.trim(),
    quiz_date: quizDate,
    game_status: readGameStatus(quizDate),
    ...identity,
  };
}
