// 로직 레벨: 퀴즈 날짜가 KST 기준으로 정해지고 모든 게임 요청에 그대로 쓰이는지 (docs/tasks/kst-date-fix/verification.md P-1)
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameDate } from "@/hooks/useGameDate";
import { useGameState } from "@/hooks/useGameState";
import { gameServer } from "@/test/fakeGameServer";
import { KST_AFTERNOON, setClock } from "@/test/clock";

// 앱과 같이 게임 날짜 훅의 값을 게임 상태 훅에 넘긴다
function renderGameWithDate() {
  return renderHook(() => {
    const gameDate = useGameDate();
    return { gameDate, game: useGameState(gameDate, "classic") };
  });
}

describe("퀴즈 날짜", () => {
  it("Q-1: LA(로컬 11/9) → 게임 날짜는 KST 오늘 2026-11-10", async () => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    const h = renderGameWithDate();
    await waitFor(() => expect(h.result.current.gameDate).toBe("2026-11-10"));
  });

  it("Q-2: LA(로컬 11/9) → 제출·힌트·초성·포기 요청 경로의 날짜가 모두 2026-11-10", async () => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    const h = renderGameWithDate();
    await waitFor(() => expect(h.result.current.gameDate).toBe("2026-11-10"));

    const run = (fn: () => Promise<unknown>) =>
      act(async () => {
        await fn();
      });
    await run(() => h.result.current.game.submitWordAction("사과"));
    await run(() => h.result.current.game.requestHint());
    await run(() => h.result.current.game.requestInitialConsonantHint());
    await run(() => h.result.current.game.giveUp());

    const kinds = gameServer.requests.map((r) => r.kind);
    expect(kinds).toEqual(["guess", "hint", "hint", "give-up"]);
    for (const r of gameServer.requests) {
      expect(r.path).toMatch(/^\/v2\/quizzes\/2026-11-10\//);
    }
  });
});
