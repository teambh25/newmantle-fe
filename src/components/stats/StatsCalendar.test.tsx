// 화면 레벨: 통계 달력이 KST 오늘까지 표시하는지 (docs/tasks/kst-date-fix/verification.md)
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { KST_AFTERNOON, setClock } from "@/test/clock";
import { StatsCalendar } from "./StatsCalendar";

describe("통계 달력", () => {
  it("S-1: 기기 로컬 날짜가 KST보다 하루 늦어도(LA 11/9) KST 오늘(11/10) 칸이 표시됨", () => {
    setClock("America/Los_Angeles", KST_AFTERNOON);
    const { container } = render(
      <StatsCalendar calendar={[{ date: "2026-11-10", status: "SUCCESS_WITHOUT_HINT" }]} />
    );
    expect(container.querySelectorAll(".bg-blue-600")).toHaveLength(1);
  });
});
