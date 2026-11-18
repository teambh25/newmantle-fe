import React from "react";
import type { ExcelProgressView } from "@/utils/progressView";

/**
 * 그래프 스위치: 켜면 순위 그래프, 끄면 상단바 (docs/specs/progress-view-toggle Dec-18).
 * 표 머리 "시도" 칸에 둔다. classic 게이지 스위치와 같은 모양, 켜짐 색은 엑셀 녹색. 무엇을 끄는지는 마우스를 올리면 이름으로
 */
export default function ProgressViewToggle({
  view,
  onChange,
}: {
  view: ExcelProgressView;
  onChange: (view: ExcelProgressView) => void;
}) {
  const on = view === "chart";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="그래프 보기"
      title="그래프 보기"
      onClick={() => onChange(on ? "bar" : "chart")}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#217346] focus-visible:ring-offset-1 ${
        on ? "bg-[#217346]" : "bg-gray-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}
