import React from "react";

// 끝난 뒤 결과 자리 위 오른쪽의 결과·그래프 전환 탭. 엑셀 시트 탭처럼 선택된 쪽은 흰 바탕에 녹색 윗줄 (specs/excel-ui Dec-53)

export type SlotView = "result" | "chart";

const TABS: { value: SlotView; label: string }[] = [
  { value: "result", label: "결과" },
  { value: "chart", label: "그래프" },
];

interface ResultTabsProps {
  rowNumber: number;
  view: SlotView;
  onChange: (view: SlotView) => void;
}

export function ResultTabs({ rowNumber, view, onChange }: ResultTabsProps) {
  return (
    <div className="excel-row">
      <div className="sheet-cell-header">{rowNumber}</div>
      <div className="col-span-4 flex items-end justify-end bg-[#f3f2f1] pr-2 sm:pr-3 pt-1">
        <div role="tablist" aria-label="결과 보기" className="flex text-[13px]">
          {TABS.map((t) => {
            const selected = view === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(t.value)}
                className={`px-4 py-1 border border-b-0 border-[#d4d4d4] -ml-px ${
                  selected
                    ? "bg-white border-t-2 border-t-[#217346] text-[#217346] font-bold"
                    : "bg-[#f3f2f1] text-gray-600 hover:bg-[#e1dfdd]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
