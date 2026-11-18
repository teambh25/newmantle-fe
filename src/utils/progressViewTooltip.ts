// 보기 방식 말풍선: 게이지 스위치가 있다는 걸 알린다 (docs/specs/progress-view-toggle Dec-27~40)
import { PROGRESS_VIEW_CONFIG, type ProgressViewTheme } from "@/utils/progressView";

/** 테마별 "다 봤음" 저장 키 (Dec-30) */
export const PROGRESS_VIEW_TOOLTIP_DONE_KEY: Record<ProgressViewTheme, string> = {
  classic: "newmantle-progress-view-tooltip-done",
  excel: "newmantle-excel-progress-view-tooltip-done",
};

/**
 * 이 테마에서 말풍선을 띄울지.
 * 보기 방식은 스위치를 누를 때만 저장되므로, 저장값이 있으면 스위치를 아는 사람이다 (Dec-29).
 * 테마마다 따로 보고(Dec-30), 저장소를 못 읽으면 띄우지 않는다 (Dec-40)
 */
export function shouldShowProgressViewTooltip(
  theme: ProgressViewTheme,
  storage: Pick<Storage, "getItem">
): boolean {
  try {
    if (storage.getItem(PROGRESS_VIEW_CONFIG[theme].storageKey) !== null) return false;
    return storage.getItem(PROGRESS_VIEW_TOOLTIP_DONE_KEY[theme]) === null;
  } catch {
    return false;
  }
}
