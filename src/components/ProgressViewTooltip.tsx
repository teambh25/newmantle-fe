"use client";
import { X } from "lucide-react";
import { useAutoDismiss } from "@/hooks/useAutoDismiss";

/** 테마별 모양 이름만 다르다 (docs/specs/progress-view-toggle Dec-36) */
const MESSAGE = {
  classic: ["스위치를 끄면 카드 대신", "입력한 단어가 표 상단에 보여요"],
  excel: ["스위치를 끄면 그래프 대신", "입력한 단어가 표 상단에 보여요"],
} as const;

const BODY_STYLE = {
  classic: "rounded-md border border-gray-200 bg-white text-gray-700 shadow-md",
  excel: "rounded-sm border border-[#d4d4d4] bg-white text-[#333] shadow-md",
} as const;

/**
 * 보기 방식 말풍선: 게이지 스위치 위, 스위치 왼쪽 끝에 맞춘다 (docs/specs/progress-view-toggle Dec-35).
 * 스위치를 감싼 `relative` 요소 안에 둔다. 본문·X를 누르거나 보인 지 5초면 끝난다 (Dec-31, Dec-39)
 */
export default function ProgressViewTooltip({
  variant,
  onDismiss,
}: {
  variant: "classic" | "excel";
  onDismiss: () => void;
}) {
  // 마운트된 동안만 센다: 실제로 보인 순간부터 5초 (Dec-31)
  useAutoDismiss(true, onDismiss);

  return (
    <div className="absolute bottom-full left-0 mb-2 z-30">
      <button
        type="button"
        aria-label="보기 방식 안내"
        onClick={onDismiss}
        className={`block px-2.5 py-1.5 text-xs font-normal leading-tight text-left whitespace-nowrap cursor-pointer ${BODY_STYLE[variant]}`}
      >
        {MESSAGE[variant][0]}
        <br />
        {MESSAGE[variant][1]}
      </button>
      <button
        type="button"
        aria-label="보기 방식 안내 닫기"
        onClick={onDismiss}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center"
      >
        <X size={10} />
      </button>
      {/* 꼬리: 아래 스위치를 가리킨다 */}
      <div
        aria-hidden="true"
        className={`absolute -bottom-1 left-3 w-2 h-2 rotate-45 bg-white border-r border-b ${
          variant === "excel" ? "border-[#d4d4d4]" : "border-gray-200"
        }`}
      />
    </div>
  );
}
