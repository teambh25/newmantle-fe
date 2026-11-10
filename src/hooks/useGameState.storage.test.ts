// 로직 레벨: 저장된 기록 읽기·쓰기 실패 처리 (docs/tasks/bug.md #7)
import { describe, expect, it, vi } from "vitest";
import { GAME_DATE, renderGame } from "@/test/gameHarness";
import { toLegacyDateString } from "@/utils/date";

const STORAGE_KEY = "newmantle_game_data";

// 힌트 / 포기 / 설문 관련 필드가 없던 구버전 형식
function storeOldVersionGame(lastPlayedDate: string) {
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
    })
  );
}

function expectEmptyGame(h: ReturnType<typeof renderGame>) {
  expect(h.game.attempts).toBe(0);
  expect(h.game.submittedWords).toEqual([]);
  expect(h.game.hintUsed).toBe(0);
  expect(h.game.givenUp).toBe(false);
}

/** 게임 기록 키에 대해서만 Storage 메서드가 예외를 던지게 한다 (게스트 ID 등 다른 키는 정상) */
function failStorageFor(method: "getItem" | "setItem") {
  const original = Storage.prototype[method];
  return vi
    .spyOn(Storage.prototype, method)
    .mockImplementation(function (this: Storage, key: string, ...rest: string[]) {
      if (key === STORAGE_KEY) throw new DOMException("blocked", "SecurityError");
      return (original as (...args: string[]) => string | null).call(this, key, ...rest);
    });
}

describe("저장된 기록 읽기", () => {
  it("S-1: 깨진 JSON → 예외 없이 빈 게임", () => {
    localStorage.setItem(STORAGE_KEY, "{abc");
    expectEmptyGame(renderGame());
  });

  it.each(["null", "123", '"abc"', "[]"])(
    "S-2: 객체가 아닌 JSON 값(%s) → 빈 게임",
    (raw) => {
      localStorage.setItem(STORAGE_KEY, raw);
      expectEmptyGame(renderGame());
    }
  );

  it("S-3: 오늘 날짜지만 submittedWords가 배열이 아님 → 빈 게임", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ submittedWords: {}, attempts: 3, lastPlayedDate: GAME_DATE })
    );
    expectEmptyGame(renderGame());
  });

  it("S-4: 오늘 날짜의 구버전 기록 → 기존 단어·시도 횟수 유지, 빠진 필드는 기본값", async () => {
    storeOldVersionGame(GAME_DATE);
    const h = renderGame();
    expect(h.game.attempts).toBe(1);
    expect(h.game.submittedWords.map((w) => w.word)).toEqual(["사과"]);
    expect(h.game.givenUp).toBe(false);
    expect(h.game.initialConsonantHintUsed).toBe(false);
    expect(h.game.answerSurveyVoted).toBeNull();

    await h.hint();
    expect(h.game.hintUsed).toBe(1);
  });

  it("S-5: 이전 날짜 형식(이어받기 대상)의 구버전 기록 → S-4와 같음", async () => {
    storeOldVersionGame(toLegacyDateString(GAME_DATE));
    const h = renderGame();
    expect(h.game.attempts).toBe(1);
    expect(h.game.submittedWords.map((w) => w.word)).toEqual(["사과"]);

    await h.hint();
    expect(h.game.hintUsed).toBe(1);
  });

  it("S-6: 저장소 읽기가 예외를 던짐 → 빈 게임으로 시작", () => {
    storeOldVersionGame(GAME_DATE);
    const spy = failStorageFor("getItem");
    try {
      expectEmptyGame(renderGame());
    } finally {
      spy.mockRestore();
    }
  });
});

describe("기록 저장", () => {
  it("S-7: 저장소 쓰기가 예외를 던짐 → 마운트·단어 제출 정상", async () => {
    const spy = failStorageFor("setItem");
    try {
      const h = renderGame();
      const result = await h.submit("사과", 120);
      expect(result).toEqual({});
      expect(h.game.attempts).toBe(1);
      expect(h.game.submittedWords.map((w) => w.word)).toEqual(["사과"]);
    } finally {
      spy.mockRestore();
    }
  });
});
