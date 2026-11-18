// 로직 레벨: 저장된 방금 입력 모양 읽기 (docs/specs/progress-view-toggle Dec-5)
import { describe, expect, it } from "vitest";
import { parseProgressView } from "@/utils/progressView";

describe("저장값 읽기 (classic)", () => {
  it("저장값이 상단바 → 상단바", () => {
    expect(parseProgressView("bar")).toBe("bar");
  });
  it("저장값이 카드 → 카드", () => {
    expect(parseProgressView("card")).toBe("card");
  });
  it("저장값 없음 → 카드", () => {
    expect(parseProgressView(null)).toBe("card");
  });
  it("모르는 값 → 카드", () => {
    expect(parseProgressView("graph")).toBe("card");
  });
});

describe("저장값 읽기 (excel, classic과 따로 저장, Dec-19)", () => {
  it("저장값이 상단바 → 상단바", () => {
    expect(parseProgressView("bar", "excel")).toBe("bar");
  });
  it("저장값 없음 → 그래프", () => {
    expect(parseProgressView(null, "excel")).toBe("chart");
  });
  it("모르는 값 → 그래프", () => {
    expect(parseProgressView("card", "excel")).toBe("chart");
  });
});
