// classic 방금 입력 자리 모양: 진행 상황 카드 / 상단바 (docs/specs/progress-view-toggle Dec-5, Dec-9)

export type ProgressView = "card" | "bar";

export const PROGRESS_VIEW_STORAGE_KEY = "newmantle-progress-view";

/** 저장값 읽기. 없거나 모르는 값이면 카드 (Dec-5) */
export function parseProgressView(raw: string | null): ProgressView {
  return raw === "bar" ? "bar" : "card";
}
