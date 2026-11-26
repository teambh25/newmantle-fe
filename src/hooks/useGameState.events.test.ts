// 로직 레벨: Amplitude 이벤트 기록 (docs/rules/amplitude.md 2장, docs/specs/amplitude-migration/plan.md Verification)
// 하루 1회 판단 규칙 자체는 src/utils/analytics.test.ts에서 본다. 여기서는 훅이 그 규칙대로 보내는지만 본다
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameState } from "@/hooks/useGameState";
import { amplitudeEvents, GAME_DATE, renderGame } from "@/test/gameHarness";
import { gameServer } from "@/test/fakeGameServer";
import { getKSTDateString } from "@/utils/date";

const STORAGE_KEY = "newmantle_game_data";

// useGameDate처럼 gameDate를 ""로 시작해 바꿀 수 있게 렌더한다
function renderWithDate(initialDate: string) {
  return renderHook(({ date }) => useGameState(date), {
    initialProps: { date: initialDate },
  });
}

describe("Game Page Visited", () => {
  it("빈 날짜로 마운트 후 날짜가 채워짐 → 1회, 새로고침해도 그날은 더 보내지 않음", () => {
    const h = renderWithDate("");
    h.rerender({ date: GAME_DATE });
    expect(amplitudeEvents("Game Page Visited")).toHaveLength(1);

    h.unmount();
    renderWithDate(GAME_DATE);
    expect(amplitudeEvents("Game Page Visited")).toHaveLength(1);
  });
});

describe("대표 시나리오: 하루 플레이", () => {
  it("오늘 기록이 없을 때 → 제출 실패, 단어 여러 개 제출, 이미 낸 단어 재입력, 일반 힌트 실패, 일반 힌트 여러 번, 초성 힌트, 새로고침, 테마 전환 후 정답 → 다섯 이벤트가 1회씩", async () => {
    const h = renderGame();
    gameServer.failNext("guess");
    expect(await h.submit("사과", 120)).toHaveProperty("error");
    await h.submit("사과", 120);
    await h.submit("배", 200);
    await h.submit("포도", 300);
    expect(await h.submit("사과")).toHaveProperty("reason", "duplicate");

    gameServer.failNext("hint");
    await h.hint();
    expect(h.failureToastShown()).toBe(true);
    await h.hint();
    await h.hint();
    await h.consonant();

    h.unmount();
    const reloaded = renderGame();
    await reloaded.submit("감", 400);
    await reloaded.hint();

    // 테마 전환은 게임 화면을 다시 마운트한다. 게임 상태 훅은 테마를 받지 않는다
    reloaded.unmount();
    const switched = renderGame();
    await switched.submit("귤", 500);
    await switched.hint();
    await switched.submitAnswer();

    const counts = Object.fromEntries(
      [
        "Game Page Visited",
        "Word Submitted",
        "Hint Requested",
        "Initial Consonant Hint Requested",
        "Game Completed",
      ].map((name) => [name, amplitudeEvents(name).length])
    );
    expect(counts).toEqual({
      "Game Page Visited": 1,
      "Word Submitted": 1,
      "Hint Requested": 1,
      "Initial Consonant Hint Requested": 1,
      "Game Completed": 1,
    });
  });
});

describe("제출 판정 결과", () => {
  it("오늘 기록이 없을 때 → 제출 오류, 없는 단어, 단어 제출 → Word Submitted 1회, result는 unknown_word", async () => {
    const h = renderGame();
    gameServer.failNext("guess");
    expect(await h.submit("사과", 120)).toHaveProperty("reason", "failed");
    gameServer.setUnknown("없는말");
    expect(await h.submit("없는말")).toHaveProperty("reason", "unknownWord");
    await h.submit("배", 200);

    expect(amplitudeEvents("Word Submitted").map((e) => e.result)).toEqual(["unknown_word"]);
  });
});

describe("끝난 뒤 제출", () => {
  it("정답 후 → 이미 낸 단어 재입력, 제출 오류 → 0회. 이어서 없는 단어, 단어 여러 개, 새로고침 후 제출 → 1회, Word Submitted는 정답 전 1회 그대로", async () => {
    const h = renderGame();
    await h.submit("사과", 120);
    await h.submitAnswer();

    expect(await h.submit("사과")).toHaveProperty("reason", "duplicate");
    gameServer.failNext("guess");
    expect(await h.submit("배", 200)).toHaveProperty("reason", "failed");
    expect(amplitudeEvents("Post Game Word Submitted")).toHaveLength(0);

    gameServer.setUnknown("없는말");
    await h.submit("없는말");
    await h.submit("배", 200);
    await h.submit("포도", 300);
    h.unmount();
    const reloaded = renderGame();
    await reloaded.submit("감", 400);

    expect(amplitudeEvents("Post Game Word Submitted")).toHaveLength(1);
    expect(amplitudeEvents("Word Submitted")).toHaveLength(1);
  });

  it("입력 0개에서 포기한 뒤 → 단어 제출 → Post Game Word Submitted 1회, Word Submitted 0회", async () => {
    const h = renderGame();
    await h.giveUp();
    await h.submit("사과", 120);

    expect(amplitudeEvents("Post Game Word Submitted")).toHaveLength(1);
    expect(amplitudeEvents("Word Submitted")).toHaveLength(0);
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

const solveTimes = () => amplitudeEvents("Game Completed").map((e) => e.time_to_solve);

const storedFirstActionAt = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY)!).firstActionAt;

describe("Game Completed time_to_solve", () => {
  beforeEach(() => {
    freezeClock();
  });

  it("제출 → 60초 → 새로고침 → 30초 → 정답 → 첫 행동부터 90초", async () => {
    const h = renderGame();
    await h.submit("사과", 120);
    passSeconds(60);
    h.unmount();

    const reloaded = renderGame();
    passSeconds(30);
    await reloaded.submitAnswer();
    expect(solveTimes()).toEqual([90]);
  });

  it("일반 힌트로 시작 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    await h.hint();
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("초성 힌트로 시작 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    await h.consonant();
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("첫 행동이 정답 → 0초", async () => {
    const h = renderGame();
    passSeconds(5);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([0]);
  });

  it("제출 실패 → 20초 → 제출 성공 → 10초 → 정답 → 10초 (실패는 첫 행동이 아님)", async () => {
    const h = renderGame();
    gameServer.failNext("guess");
    expect(await h.submit("사과", 120)).toHaveProperty("error");
    passSeconds(20);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("힌트 실패 → 20초 → 제출 → 10초 → 정답 → 10초", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.hint();
    expect(h.failureToastShown()).toBe(true);
    passSeconds(20);
    await h.submit("사과", 120);
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("두 번째 이후 행동은 첫 행동 시각을 바꾸지 않음 (저장값 확인)", async () => {
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

  it("첫 행동 시각이 없는 오늘 기록(배포 당일) → 배포 후 첫 행동부터 잼", async () => {
    storeTodayWithoutFirstActionAt();
    const h = renderGame();
    passSeconds(30);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("첫 행동 시각이 없는 기록에서 이미 있는 단어 재제출 → 20초 → 새 단어 → 10초 → 정답 → 10초 (재제출은 첫 행동이 아님)", async () => {
    storeTodayWithoutFirstActionAt();
    const h = renderGame();
    expect(await h.submit("사과")).toHaveProperty("error");
    expect(gameServer.count("guess")).toBe(0);
    passSeconds(20);
    await h.submit("배", 200);
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });

  it("초성 힌트 실패 → 20초 → 제출 → 10초 → 정답 → 10초 (실패는 첫 행동이 아님)", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.consonant();
    expect(h.failureToastShown()).toBe(true);
    expect(h.game.initialConsonantHintUsed).toBe(false);
    passSeconds(20);
    await h.submit("사과", 120);
    passSeconds(10);
    await h.submitAnswer();
    expect(solveTimes()).toEqual([10]);
  });
});

describe("Game Given Up time_to_give_up", () => {
  beforeEach(() => {
    freezeClock();
  });

  it("단어 제출 → 60초 → 새로고침 → 30초 → 포기 → 90초", async () => {
    const h = renderGame();
    await h.submit("사과", 120);
    passSeconds(60);
    h.unmount();

    const reloaded = renderGame();
    passSeconds(30);
    await reloaded.giveUp();
    expect(amplitudeEvents("Game Given Up").map((e) => e.time_to_give_up)).toEqual([90]);
  });
});
