// 로직 레벨: 피드백으로 저장할 행 만들기 (docs/specs/feedback-migration)
import { beforeEach, describe, expect, it } from "vitest";
import { buildFeedbackRow } from "./feedback";
import { KST_AFTERNOON, setClock } from "@/test/clock";

const GUEST_ID_KEY = "newmantle_guest_id";
const GAME_DATA_KEY = "newmantle_game_data";
const GUEST_ID = "6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f";
const USER_ID = "0b7e1c9a-2d3f-4e5a-9b8c-7d6e5f4a3b2c";
// KST_AFTERNOON의 KST 날짜
const TODAY = "2026-11-10";
const YESTERDAY = "2026-11-09";

// 퀴즈 날짜는 hook이 열린 게임 화면 기준으로 정해 넘긴다 (Dec-24)
const base = { feedback: "의견", userId: null, quizDate: TODAY } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function storeGame(date: string, extra: Record<string, unknown> = {}) {
  localStorage.setItem(
    GAME_DATA_KEY,
    JSON.stringify({ submittedWords: [], attempts: 1, lastPlayedDate: date, ...extra })
  );
}

beforeEach(() => {
  setClock("Asia/Seoul", KST_AFTERNOON);
});

describe("유저 구분", () => {
  it("로그인한 상태 → user_type은 user, subject_id는 세션의 user id", () => {
    // 로그인 전에 쓰던 게스트 ID가 남아 있어도 user id를 쓴다
    localStorage.setItem(GUEST_ID_KEY, GUEST_ID);
    const row = buildFeedbackRow({ ...base, userId: USER_ID });
    expect(row).toMatchObject({ user_type: "user", subject_id: USER_ID });
  });

  it("로그인하지 않았고 게스트 ID가 있는 상태 → user_type은 guest, subject_id는 그 게스트 ID", () => {
    localStorage.setItem(GUEST_ID_KEY, GUEST_ID);
    const row = buildFeedbackRow(base);
    expect(row).toMatchObject({ user_type: "guest", subject_id: GUEST_ID });
  });

  it("로그인하지 않았고 게스트 ID가 없는 상태 → 게스트 ID가 새로 만들어져 저장되고, subject_id는 그 ID", () => {
    const row = buildFeedbackRow(base);
    const created = localStorage.getItem(GUEST_ID_KEY);
    expect(created).toMatch(UUID);
    expect(row).toMatchObject({ user_type: "guest", subject_id: created });
  });
});

describe("본문과 맥락", () => {
  it("입력 앞뒤에 공백이 있는 상태 → 본문은 앞뒤 공백을 뺀 값", () => {
    const row = buildFeedbackRow({ ...base, feedback: "  순위가 이상해요 \n" });
    expect(row.feedback).toBe("순위가 이상해요");
  });

  it.each([
    ["맞힘", "solved", { gameCompleted: true }],
    ["포기", "given_up", { gameCompleted: true, givenUp: true }],
    ["진행 중", "playing", {}],
  ])("오늘 퀴즈를 %s한 상태 → 오늘을 퀴즈 날짜로 행을 만들면 quiz_date는 오늘, game_status는 %s", (_label, status, extra) => {
    storeGame(TODAY, extra);
    const row = buildFeedbackRow(base);
    expect(row).toMatchObject({ quiz_date: TODAY, game_status: status });
  });

  it("어제 퀴즈를 맞힌 기록이 있고 KST 자정이 지난 상태 → 어제를 퀴즈 날짜로 행을 만들면 quiz_date는 어제, game_status는 solved", () => {
    // KST_AFTERNOON(11/10) 기준으로 기록은 11/9
    storeGame(YESTERDAY, { gameCompleted: true });
    const row = buildFeedbackRow({ ...base, quizDate: YESTERDAY });
    expect(row).toMatchObject({ quiz_date: YESTERDAY, game_status: "solved" });
  });

  it("어떤 상태든 → 행에는 feedback, quiz_date, game_status, user_type, subject_id만 있음", () => {
    const row = buildFeedbackRow({ ...base, userId: USER_ID });
    expect(Object.keys(row).sort()).toEqual(
      ["feedback", "game_status", "quiz_date", "subject_id", "user_type"].sort()
    );
  });
});
