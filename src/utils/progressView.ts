// 방금 입력 자리 모양: classic은 진행 상황 카드 / 상단바, excel은 순위 그래프 / 상단바
// 테마마다 따로 저장한다 (docs/specs/progress-view-toggle Dec-5, Dec-9, Dec-19)

export type ProgressViewTheme = "classic" | "excel";
/** classic 모양 */
export type ProgressView = "card" | "bar";
/** excel 모양 */
export type ExcelProgressView = "chart" | "bar";
export type ProgressViewOf<T extends ProgressViewTheme> = T extends "excel" ? ExcelProgressView : ProgressView;

export const PROGRESS_VIEW_STORAGE_KEY = "newmantle-progress-view";

/** 테마별 저장 키, Amplitude 사용자 속성, 게이지를 켠 값(기본값) */
export const PROGRESS_VIEW_CONFIG = {
  classic: { storageKey: PROGRESS_VIEW_STORAGE_KEY, userProperty: "progress_view", gauge: "card" },
  excel: { storageKey: "newmantle-excel-progress-view", userProperty: "excel_progress_view", gauge: "chart" },
} as const satisfies Record<ProgressViewTheme, { storageKey: string; userProperty: string; gauge: string }>;

/** 저장값 읽기. 없거나 모르는 값이면 게이지(classic 카드, excel 그래프) (Dec-5, Dec-19) */
export function parseProgressView(raw: string | null): ProgressView;
export function parseProgressView<T extends ProgressViewTheme>(raw: string | null, theme: T): ProgressViewOf<T>;
export function parseProgressView(raw: string | null, theme: ProgressViewTheme = "classic"): ProgressView | ExcelProgressView {
  return raw === "bar" ? "bar" : PROGRESS_VIEW_CONFIG[theme].gauge;
}
