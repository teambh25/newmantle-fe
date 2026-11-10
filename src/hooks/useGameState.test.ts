// 로직 레벨: 게임 상태 (docs/tasks/hint-giveup-fix/verification.md)
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 훅은 실제 코드를 쓴다.
import { describe, expect, it } from "vitest";
import { gameServer, ANSWER } from "@/test/fakeGameServer";
import { amplitudeEvents, confettiFired, presets, renderGame } from "@/test/gameHarness";

const correctRows = (h: ReturnType<typeof renderGame>) =>
  h.game.submittedWords.filter((w) => w.correct);
const consonantRows = (h: ReturnType<typeof renderGame>) =>
  h.game.submittedWords.filter((w) => w.rank === 0 && !w.correct);
const hintRows = (h: ReturnType<typeof renderGame>) =>
  h.game.submittedWords.filter((w) => w.attempt === -1 && w.rank > 0);

describe("A. 일반 힌트", () => {
  it("A-1-3: 단어 없이 힌트 요청 → 서버에 999위 요청, 목록에 힌트 단어 추가", async () => {
    const h = renderGame();
    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([999]);
    expect(hintRows(h)).toHaveLength(1);
    expect(hintRows(h)[0].rank).toBe(999);
  });

  it("A-1-2: 순위 밖 단어만 있을 때 힌트 요청 → 999위", async () => {
    const h = renderGame();
    await presets.OUT_ONLY(h);
    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([999]);
  });

  it("A-5-1: 힌트를 받을 수 없을 때까지 반복 → 15회, 999부터 20까지 spec 수열", async () => {
    const h = renderGame();
    for (let i = 0; i < 20; i++) await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([
      999, 749, 562, 422, 317, 238, 179, 134, 101, 76, 57, 43, 32, 24, 20,
    ]);
    expect(h.game.hintDisabled).toBe(true);
  });

  it("A-5-2: 300 → 50 → 120 → 순위 밖 순서로 입력 후 힌트 → 38위 (최고 순위는 가장 작은 순위 숫자)", async () => {
    const h = renderGame();
    await h.submit(presets.nextWord(), 300);
    await h.submit(presets.nextWord(), 50);
    await h.submit(presets.nextWord(), 120);
    await h.submit(presets.nextWord(), -1);
    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([38]);
  });

  it("A-6-1: 최고 순위 20이면 힌트 요청해도 서버에 요청하지 않음", async () => {
    const h = renderGame();
    await presets.TOP(h, 20);
    expect(h.game.hintDisabled).toBe(true);
    await h.hint();
    expect(gameServer.count("hint")).toBe(0);
  });

  it("A-7-1: 최고 순위 101에서 힌트 2회 → 76, 57 (받은 힌트가 다음 기준)", async () => {
    const h = renderGame();
    await presets.TOP(h, 101);
    await h.hint();
    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([76, 57]);
  });

  it("A-6 / 용어: 일반 힌트가 막힌 상태(최고 순위 10)에서도 초성 힌트는 받을 수 있음", async () => {
    const h = renderGame();
    await presets.TOP(h, 10);
    await h.consonant();
    expect(gameServer.consonantHintCount()).toBe(1);
    expect(h.game.initialConsonantHintUsed).toBe(true);
  });
});

describe("B. 초성 힌트", () => {
  it("B-2-3: 초성 힌트 요청 → 서버에 0위 요청 1회, 초성 행 추가, 게임 계속", async () => {
    const h = renderGame();
    await h.consonant();
    expect(gameServer.consonantHintCount()).toBe(1);
    expect(consonantRows(h)).toHaveLength(1);
    expect(h.game.initialConsonantHintUsed).toBe(true);
    expect(h.game.gameCompleted).toBe(false);
    expect(h.game.givenUp).toBe(false);
  });

  it("B-3-1: 초성 힌트 사용 후 일반 힌트 → 999위 (초성 행은 기준에서 제외)", async () => {
    const h = renderGame();
    await presets.CONSONANT_USED(h);
    expect(h.game.hintDisabled).toBe(false);
    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([999]);
  });

  it("B-4-1: 일반 힌트 1회 + 초성 힌트 → 프론트 힌트 사용 횟수 1 (초성 미포함)", async () => {
    const h = renderGame();
    await h.hint();
    await h.consonant();
    expect(h.game.hintUsed).toBe(1);
  });

  it("B-5-3: 초성 힌트를 이미 썼으면 다시 요청해도 서버에 요청하지 않음", async () => {
    const h = renderGame();
    await presets.CONSONANT_USED(h);
    await h.consonant();
    expect(gameServer.consonantHintCount()).toBe(1);
    expect(consonantRows(h)).toHaveLength(1);
  });

  it("B-5: 초성 힌트 사용 여부는 새로고침(다시 마운트) 후에도 유지", async () => {
    const h = renderGame();
    await presets.CONSONANT_USED(h);
    h.unmount();

    const reloaded = renderGame();
    expect(reloaded.game.initialConsonantHintUsed).toBe(true);
    await reloaded.consonant();
    expect(gameServer.consonantHintCount()).toBe(1);
  });
});

describe("C. 포기", () => {
  it("C-1: 입력 0개여도 포기 가능 → 정답 공개, 게임 종료", async () => {
    const h = renderGame();
    await h.giveUp();
    expect(gameServer.count("give-up")).toBe(1);
    expect(h.game.givenUp).toBe(true);
    expect(correctRows(h).map((w) => w.word)).toEqual([ANSWER.word]);
  });

  it("C-4-1: 입력 3개 후 포기 → 기록 시도 횟수 3, 정답 행 시도 번호 3", async () => {
    const h = renderGame();
    await presets.GIVEN_UP(h, 3);
    expect(h.game.solvedAttempts).toBe(3);
    expect(h.game.correctAttempts).toBe(3);
    expect(correctRows(h)[0].attempt).toBe(3);
  });

  it("C-4-2: 입력 0개 후 포기 → 기록 시도 횟수 0", async () => {
    const h = renderGame();
    await h.giveUp();
    expect(h.game.solvedAttempts).toBe(0);
    expect(h.game.correctAttempts).toBe(0);
    expect(correctRows(h)[0].attempt).toBe(0);
  });

  it("C-4-5: 입력 3개 + 일반 힌트 2회 + 초성 힌트 후 포기 → 기록·정답 행·Game Given Up 모두 3 (힌트는 세지 않음)", async () => {
    const h = renderGame();
    for (let i = 0; i < 3; i++) await h.submit(presets.nextWord(), -1);
    await h.hint();
    await h.hint();
    await h.consonant();
    await h.giveUp();
    expect(h.game.solvedAttempts).toBe(3);
    expect(h.game.correctAttempts).toBe(3);
    expect(correctRows(h)[0].attempt).toBe(3);
    expect(amplitudeEvents("Game Given Up")).toEqual([
      expect.objectContaining({ attempts: 3 }),
    ]);
  });

  it("C-5-1: 포기 후 단어 2개 더 제출 → 목록에 들어가지만 기록·포기 상태 유지, 축하 효과 없음", async () => {
    const h = renderGame();
    await presets.GIVEN_UP(h, 3);
    const a = presets.nextWord();
    const b = presets.nextWord();
    await h.submit(a, 300);
    await h.submit(b, -1);

    const words = h.game.submittedWords.map((w) => w.word);
    expect(words).toEqual(expect.arrayContaining([a, b]));
    expect(h.game.solvedAttempts).toBe(3);
    expect(h.game.givenUp).toBe(true);
    expect(confettiFired()).toBe(false);
  });

  it("C-5-2: 포기 후 정답 단어 제출 → 이미 제출한 단어로 처리 (요청·새 행 없음, 기록 유지, 축하 효과 없음)", async () => {
    const h = renderGame();
    await presets.GIVEN_UP(h, 3);
    const rowsBefore = h.game.submittedWords.length;
    const guessesBefore = gameServer.count("guess");

    const res = await h.submitAnswer();

    expect(res.error).toBeTruthy();
    expect(gameServer.count("guess")).toBe(guessesBefore);
    expect(h.game.submittedWords).toHaveLength(rowsBefore);
    expect(h.game.solvedAttempts).toBe(3);
    expect(h.game.givenUp).toBe(true);
    expect(confettiFired()).toBe(false);
  });
});

describe("D-1. 정답 후", () => {
  it("대조군: 포기하지 않고 정답을 맞히면 축하 효과가 실행된다", async () => {
    const h = renderGame();
    await presets.SOLVED(h, 1);
    expect(confettiFired()).toBe(true);
  });

  it("D-1-1: 2번째에 정답 후 단어 2개 더 제출 → 목록에 들어가고 기록 시도 횟수 2 유지", async () => {
    const h = renderGame();
    await presets.SOLVED(h, 2);
    const a = presets.nextWord();
    const b = presets.nextWord();
    await h.submit(a, 50);
    await h.submit(b, -1);

    const words = h.game.submittedWords.map((w) => w.word);
    expect(words).toEqual(expect.arrayContaining([a, b]));
    expect(h.game.solvedAttempts).toBe(2);
    expect(h.game.gameCompleted).toBe(true);
  });
});

describe("D-2. 요청 중 잠금", () => {
  it("D-2-1: 힌트 응답 전에 다시 힌트 요청 → 서버 요청 1회", async () => {
    const h = renderGame();
    const held = gameServer.holdNext("hint");

    const first = h.start("hint");
    expect(h.game.hintPending).toBe(true);
    const second = h.start("hint"); // 다시 렌더된 뒤의 요청

    await held.release();
    await h.settle(Promise.all([first, second]));

    expect(gameServer.count("hint")).toBe(1);
    expect(hintRows(h)).toHaveLength(1);
    expect(h.game.hintPending).toBe(false);
  });

  it("D-2-5: 초성 힌트 응답 전 초성 힌트 / 포기 요청 → 초성 1회, 포기 0회 (잠금 공유)", async () => {
    const h = renderGame();
    const held = gameServer.holdNext("hint");

    const first = h.start("consonant");
    expect(h.game.giveUpPending).toBe(true);
    const again = h.start("consonant");
    const giveUp = h.start("giveUp");

    await held.release();
    await h.settle(Promise.all([first, again, giveUp]));

    expect(gameServer.consonantHintCount()).toBe(1);
    expect(gameServer.count("give-up")).toBe(0);
    expect(consonantRows(h)).toHaveLength(1);
    expect(h.game.givenUp).toBe(false);
  });

  it("D-2-6: 포기 응답 전 포기 / 초성 힌트 요청 → 포기 1회, 초성 0회, 정답 행 1개", async () => {
    const h = renderGame();
    const held = gameServer.holdNext("give-up");

    const first = h.start("giveUp");
    expect(h.game.giveUpPending).toBe(true);
    const again = h.start("giveUp");
    const consonant = h.start("consonant");

    await held.release();
    await h.settle(Promise.all([first, again, consonant]));

    expect(gameServer.count("give-up")).toBe(1);
    expect(gameServer.consonantHintCount()).toBe(0);
    expect(correctRows(h)).toHaveLength(1);
  });

  it("D-2-9: 초성 힌트 응답 전 일반 힌트 요청 → 일반 힌트는 정상 진행 (잠금이 서로 별개)", async () => {
    const h = renderGame();
    const held = gameServer.holdNext("hint", (r) => r.rank === 0); // 초성 힌트 요청만 붙잡음

    const consonant = h.start("consonant");
    await h.hint();

    expect(gameServer.normalHintRanks()).toEqual([999]);
    expect(hintRows(h)).toHaveLength(1);

    await held.release();
    await h.settle(consonant);
    expect(consonantRows(h)).toHaveLength(1);
  });
});

describe("D-3. 요청 실패", () => {
  it("D-3-1: 힌트 실패 → 실패 안내, 목록·힌트 횟수 변화 없음, 재요청은 같은 순위(999)", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.hint();

    expect(h.failureToastShown()).toBe(true);
    expect(h.game.submittedWords).toHaveLength(0);
    expect(h.game.hintUsed).toBe(0);
    expect(h.game.hintPending).toBe(false);

    await h.hint();
    expect(gameServer.normalHintRanks()).toEqual([999, 999]);
    expect(hintRows(h)).toHaveLength(1);
  });

  it("D-3-2: 초성 힌트 실패 → 실패 안내, 미사용 상태 유지 → 다시 받을 수 있음", async () => {
    const h = renderGame();
    gameServer.failNext("hint");
    await h.consonant();

    expect(h.failureToastShown()).toBe(true);
    expect(h.game.initialConsonantHintUsed).toBe(false);
    expect(h.game.giveUpPending).toBe(false);

    await h.consonant();
    expect(gameServer.consonantHintCount()).toBe(2);
    expect(h.game.initialConsonantHintUsed).toBe(true);
  });

  it("D-3-3: 포기 실패 → 실패 안내, 게임 진행 중 유지", async () => {
    const h = renderGame();
    gameServer.failNext("give-up");
    await h.giveUp();

    expect(h.failureToastShown()).toBe(true);
    expect(h.game.givenUp).toBe(false);
    expect(h.game.gameCompleted).toBe(false);
    expect(h.game.giveUpPending).toBe(false);
    expect(correctRows(h)).toHaveLength(0);
  });
});

describe("E-1. Amplitude", () => {
  it("E-1-1: 힌트 없이 정답 → Game Completed에 힌트 0, 초성 false", async () => {
    const h = renderGame();
    await presets.SOLVED(h, 1);
    expect(amplitudeEvents("Game Completed")).toEqual([
      expect.objectContaining({ hintUsed: 0, initialConsonantHintUsed: false }),
    ]);
  });

  it("E-1-2: 일반 힌트 2회 + 초성 힌트 후 정답 → Game Completed에 힌트 2, 초성 true", async () => {
    const h = renderGame();
    await h.hint();
    await h.hint();
    await h.consonant();
    await h.submitAnswer();
    expect(amplitudeEvents("Game Completed")).toEqual([
      expect.objectContaining({ hintUsed: 2, initialConsonantHintUsed: true }),
    ]);
  });

  it("E-1-3: 일반 힌트 1회 + 초성 힌트 후 포기 → Game Given Up에 힌트 1, 초성 true", async () => {
    const h = renderGame();
    await h.hint();
    await h.consonant();
    await h.giveUp();
    expect(amplitudeEvents("Game Given Up")).toEqual([
      expect.objectContaining({ hintUsed: 1, initialConsonantHintUsed: true }),
    ]);
  });

  it("E-1-5: 초성 힌트 요청 성공 → Initial Consonant Hint Requested 1회", async () => {
    const h = renderGame();
    await h.consonant();
    expect(amplitudeEvents("Initial Consonant Hint Requested")).toHaveLength(1);
  });

  it("E-1-4: 힌트 없이 포기 → Game Given Up에 힌트 0, 초성 false", async () => {
    const h = renderGame();
    await h.giveUp();
    expect(amplitudeEvents("Game Given Up")).toEqual([
      expect.objectContaining({ hintUsed: 0, initialConsonantHintUsed: false }),
    ]);
  });
});
