// 로직 레벨: Amplitude 이벤트 기록 (docs/tasks/game-state-fix/bug.md #8, #11)
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameState } from "@/hooks/useGameState";
import { amplitudeEvents, GAME_DATE, renderGame } from "@/test/gameHarness";
import { gameServer } from "@/test/fakeGameServer";
import { getKSTDateString } from "@/utils/date";

const STORAGE_KEY = "newmantle_game_data";

// useGameDate처럼 gameDate를 ""로 시작해 바꿀 수 있게 렌더한다
function renderWithDate(initialDate: string) {
  return renderHook(({ date }) => useGameState(date, "classic"), {
    initialProps: { date: initialDate },
  });
}

describe("Game Started", () => {
  it("G-1: 빈 날짜로 마운트 후 날짜가 채워짐 → 1회, 채워진 날짜로 기록", () => {
    const h = renderWithDate("");
    h.rerender({ date: GAME_DATE });
    expect(amplitudeEvents("Game Started")).toEqual([
      expect.objectContaining({ date: GAME_DATE, theme: "classic" }),
    ]);
  });

  it("G-2: 날짜가 빈 상태로만 렌더 → 기록하지 않음", () => {
    renderWithDate("");
    expect(amplitudeEvents("Game Started")).toEqual([]);
  });
});

// ---- #11 플레이 시간 ----

// 현재 시각에서 Date만 멈춘다. setup.ts가 interval만 가짜로 설치해 둬서 Date까지 포함해 다시 설치한다
function freezeClock() {
  const now = Date.now();
  vi.useRealTimers();
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(now);
}

const passSeconds = (sec: number) => vi.setSystemTime(Date.now() + sec * 1000);

function completedTimes() {
  return amplitudeEvents("Game Completed").map((e) => ({
    timeSpent: e.timeSpent,
    timeSinceFirstAction: e.timeSinceFirstAction,
  }));
}

const storedFirstActionAt = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY)!).firstActionAt;

describe("Game Completed 플레이 시간", () => {
  beforeEach(() => {
    freezeClock();
  });

  it("T-1: 제출 → 60초 → 새로고침 → 30초 → 정답 → 첫 행동부터 90초, 연속 플레이 30초", async () => {
    const h = renderGame();
    await h.submit("사과", 120);
    passSeconds(60);
    h.unmount();

    const reloaded = renderGame();
    passSeconds(30);
    await reloaded.submitAnswer();
    expect(completedTimes()).toEqual([{ timeSpent: 30, timeSinceFirstAction: 90 }]);
  });

  it("T-2: 일반 힌트로 시작 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    await h.hint();
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-3: 초성 힌트로 시작 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    await h.consonant();
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-4: 첫 행동이 정답 → 0초", async () => {
    const h = renderGame();
    passSeconds(5);
    await h.submitAnswer();
    expect(completedTimes()).toEqual([{ timeSpent: 5, timeSinceFirstAction: 0 }]);
  });

  it("T-5: 제출 실패 → 20초 → 제출 성공 → 10초 → 정답 → 10초 (실패는 첫 행동이 아님)", async () => {
    const h = renderGame();
    gameServer.failNext("guess");
    expect(await h.submit("사과", 120)).toHaveProperty("error");
    passSeconds(20);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-6: 힌트 실패 → 20초 → 제출 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.hint();
    expect(h.failureToastShown()).toBe(true);
    passSeconds(20);
    await h.submit("사과", 120);
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-7: 두 번째 이후 행동은 첫 행동 시각을 바꾸지 않음 (저장값 확인)", async () => {
    const h = renderGame();
    await h.submit("사과", 120);
    const first = storedFirstActionAt();
    expect(first).toBe(Date.now());

    passSeconds(10);
    await h.hint();
    passSeconds(10);
    await h.consonant();
    passSeconds(10);
    await h.submit("배", 200);
    expect(storedFirstActionAt()).toBe(first);
  });

  // 배포 전 형식: firstActionAt이 없는 오늘 기록
  function storeTodayWithoutFirstActionAt() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        submittedWords: [
          { word: "사과", similarity: 30, rank: 120, attempt: 1, correct: false },
        ],
        attempts: 1,
        solvedAttempts: null,
        gameCompleted: false,
        lastPlayedDate: getKSTDateString(),
        hintUsed: 0,
        givenUp: false,
        initialConsonantHintUsed: false,
        answerSurveyVoted: null,
      })
    );
  }

  it("T-8: 첫 행동 시각이 없는 오늘 기록(배포 당일) → 배포 후 첫 행동부터 잼", async () => {
    storeTodayWithoutFirstActionAt();
    const h = renderGame();
    passSeconds(30);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-9: 첫 행동 시각이 없는 기록에서 이미 있는 단어 재제출 → 20초 → 새 단어 → 10초 → 정답 → 10초 (재제출은 첫 행동이 아님)", async () => {
    storeTodayWithoutFirstActionAt();
    const h = renderGame();
    expect(await h.submit("사과")).toHaveProperty("error");
    expect(gameServer.count("guess")).toBe(0);
    passSeconds(20);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });

  it("T-10: 초성 힌트 실패 → 20초 → 제출 → 10초 → 정답 → 10초 (실패는 첫 행동이 아님)", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.consonant();
    expect(h.failureToastShown()).toBe(true);
    expect(h.game.initialConsonantHintUsed).toBe(false);
    passSeconds(20);
    await h.submit("사과", 120);
    passSeconds(10);
    await h.submitAnswer();
    expect(completedTimes()[0].timeSinceFirstAction).toBe(10);
  });
});
