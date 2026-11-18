import React from "react";
import type { ProgressView } from "@/utils/progressView";

/**
 * 게이지 스위치: 켜면 진행 상황 카드, 끄면 상단바 (docs/specs/progress-view-toggle Dec-12).
 * 표 머리줄 # 칸에 둔다 (카드 모드는 기록 표, 상단바 모드는 상단바). 무엇을 끄는지는 마우스를 올리면 이름으로
 */
export default function ProgressViewToggle({ view, onChange }: { view: ProgressView; onChange: (view: ProgressView) => void }) {
  const on = view === "card";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="게이지 보기"
      title="게이지 보기"
      onClick={() => onChange(on ? "bar" : "card")}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
        on ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}
