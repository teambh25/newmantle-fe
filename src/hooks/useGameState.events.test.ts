// 로직 레벨: Amplitude 이벤트 기록 (docs/tasks/bug.md #8)
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGameState } from "@/hooks/useGameState";
import { amplitudeEvents, GAME_DATE } from "@/test/gameHarness";

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
