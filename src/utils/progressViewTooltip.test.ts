// 로직: 보기 방식 말풍선을 띄울지 (docs/specs/progress-view-toggle Dec-29, Dec-30, Dec-40)
import { describe, expect, it } from "vitest";
import { PROGRESS_VIEW_CONFIG } from "./progressView";
import { PROGRESS_VIEW_TOOLTIP_DONE_KEY, shouldShowProgressViewTooltip } from "./progressViewTooltip";

function storageWith(values: Record<string, string>): Pick<Storage, "getItem"> {
  return { getItem: (key) => values[key] ?? null };
}

const CLASSIC_VIEW = PROGRESS_VIEW_CONFIG.classic.storageKey;
const EXCEL_VIEW = PROGRESS_VIEW_CONFIG.excel.storageKey;

describe("보기 방식 말풍선을 띄울지", () => {
  it("classic, 아무것도 저장되지 않음 → 띄움", () => {
    expect(shouldShowProgressViewTooltip("classic", storageWith({}))).toBe(true);
  });

  it("classic, classic 보기 방식 저장값이 있음(카드든 상단바든) → 안 띄움", () => {
    expect(shouldShowProgressViewTooltip("classic", storageWith({ [CLASSIC_VIEW]: "card" }))).toBe(false);
    expect(shouldShowProgressViewTooltip("classic", storageWith({ [CLASSIC_VIEW]: "bar" }))).toBe(false);
  });

  it("classic, classic 말풍선을 다 봤음 → 안 띄움", () => {
    expect(
      shouldShowProgressViewTooltip("classic", storageWith({ [PROGRESS_VIEW_TOOLTIP_DONE_KEY.classic]: "1" }))
    ).toBe(false);
  });

  it("excel, classic 말풍선을 다 봤고 classic 보기 방식 저장값도 있음 → 띄움", () => {
    const storage = storageWith({ [PROGRESS_VIEW_TOOLTIP_DONE_KEY.classic]: "1", [CLASSIC_VIEW]: "bar" });
    expect(shouldShowProgressViewTooltip("excel", storage)).toBe(true);
  });

  it("excel, excel 보기 방식 저장값이 있음 → 안 띄움", () => {
    expect(shouldShowProgressViewTooltip("excel", storageWith({ [EXCEL_VIEW]: "chart" }))).toBe(false);
  });

  it("excel, excel 말풍선을 다 봤음 → 안 띄움", () => {
    expect(
      shouldShowProgressViewTooltip("excel", storageWith({ [PROGRESS_VIEW_TOOLTIP_DONE_KEY.excel]: "1" }))
    ).toBe(false);
  });

  it("classic, 저장소를 읽을 수 없음 → 안 띄움", () => {
    const broken: Pick<Storage, "getItem"> = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(shouldShowProgressViewTooltip("classic", broken)).toBe(false);
  });
});
