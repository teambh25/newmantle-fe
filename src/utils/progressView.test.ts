// 로직 레벨: 저장된 방금 입력 모양 읽기 (docs/specs/progress-view-toggle Dec-5)
import { describe, expect, it } from "vitest";
import { parseProgressView } from "@/utils/progressView";

describe("저장값 읽기", () => {
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
