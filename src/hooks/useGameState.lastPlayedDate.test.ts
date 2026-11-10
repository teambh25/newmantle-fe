// 로직 레벨: 저장된 기록의 날짜 판단 (docs/tasks/kst-date-fix/verification.md)
import { describe, expect, it } from "vitest";
import { renderGame } from "@/test/gameHarness";
import { KST_AFTERNOON, SAME_DAY, setClock as setEnvironment } from "@/test/clock";

const STORAGE_KEY = "newmantle_game_data";

function storeGame(lastPlayedDate: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      submittedWords: [
        { word: "사과", similarity: 30, rank: 120, attempt: 1, correct: false },
      ],
      attempts: 1,
      solvedAttempts: null,
      gameCompleted: false,
      lastPlayedDate,
      hintUsed: 0,
      givenUp: false,
      initialConsonantHintUsed: false,
      answerSurveyVoted: null,
    })
  );
}

const storedLastPlayedDate = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY)!).lastPlayedDate;

function expectKept(h: ReturnType<typeof renderGame>) {
  expect(h.game.attempts).toBe(1);
  expect(h.game.submittedWords.map((w) => w.word)).toEqual(["사과"]);
  expect(storedLastPlayedDate()).toBe("2026-11-10");
}

function expectReset(h: ReturnType<typeof renderGame>) {
  expect(h.game.attempts).toBe(0);
  expect(h.game.submittedWords).toEqual([]);
  expect(storedLastPlayedDate()).toBe("2026-11-10");
}

describe("저장된 기록의 날짜 판단", () => {
  it("테스트 환경: 시각 고정과 기기 타임존 변경이 로컬 날짜에 반영됨", () => {
    setEnvironment("America/Los_Angeles", KST_AFTERNOON);
    expect(new Date().toISOString()).toBe("2026-11-10T05:00:00.000Z");
    expect(new Date().toDateString()).toBe("Mon Nov 09 2026");
    setEnvironment("America/Los_Angeles", SAME_DAY);
    expect(new Date().toDateString()).toBe("Tue Nov 10 2026");
    setEnvironment("Asia/Seoul", KST_AFTERNOON);
    expect(new Date().toDateString()).toBe("Tue Nov 10 2026");
  });

  it("L-1: 새 형식, KST 오늘 → 그대로 유지", () => {
    setEnvironment("Asia/Seoul", KST_AFTERNOON);
    storeGame("2026-11-10");
    expectKept(renderGame());
  });

  it("L-2: 새 형식, KST 어제 → 초기화", () => {
    setEnvironment("Asia/Seoul", KST_AFTERNOON);
    storeGame("2026-11-09");
    expectReset(renderGame());
  });

  it("L-3: 한국, 이전 형식 오늘 → 이어받음", () => {
    setEnvironment("Asia/Seoul", KST_AFTERNOON);
    storeGame("Tue Nov 10 2026");
    expectKept(renderGame());
  });

  it("L-4: 한국, 이전 형식 어제 → 초기화", () => {
    setEnvironment("Asia/Seoul", KST_AFTERNOON);
    storeGame("Mon Nov 09 2026");
    expectReset(renderGame());
  });

  it("L-5: LA, 이전 형식 로컬 오늘(= KST 어제) → 초기화 (다른 날짜 퀴즈 기록)", () => {
    setEnvironment("America/Los_Angeles", KST_AFTERNOON);
    storeGame("Mon Nov 09 2026");
    expectReset(renderGame());
  });

  it("L-6: LA, 로컬과 KST 모두 같은 날 이전 형식 → 이어받음", () => {
    setEnvironment("America/Los_Angeles", SAME_DAY);
    storeGame("Tue Nov 10 2026");
    expectKept(renderGame());
  });

  it("L-7: LA, 이전 형식 KST 오늘(= 로컬 내일) → 이어받음 (기준은 KST 날짜)", () => {
    setEnvironment("America/Los_Angeles", KST_AFTERNOON);
    storeGame("Tue Nov 10 2026");
    expectKept(renderGame());
  });
});
