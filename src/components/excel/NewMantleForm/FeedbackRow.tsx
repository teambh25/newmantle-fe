"use client";
import React, { useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { useFeedback } from "@/hooks/useFeedback";

// 결과 블록 아래 피드백 행: 단어 칸이 피드백 입력칸이 되고 나머지 칸은 비운다 (docs/specs/excel-ui Dec-5, Dec-42). 엔터나 오른쪽 버튼으로 보낸다
// 설정 메뉴의 excel 피드백 창(SurveyForm)과 동작은 같다
export function FeedbackRow({ rowNumber }: { rowNumber: number }) {
  const { text, setText, sent, canSend, submit, maxLength } = useFeedback({
    entry: "result",
  });
  // 펼치면 바로 쓸 수 있게 포커스. 보통 빈 셀과 구분되도록 칸은 늘 선택된 셀처럼 녹색 테두리 (Dec-45)
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="excel-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) submit();
      }}
    >
      <div className="sheet-cell-header">{rowNumber}</div>
      <div className="excel-cell max-sm:hidden" />
      {sent ? (
        <div role="status" className="excel-cell max-sm:col-span-4 min-w-0 text-[13px] text-gray-800 whitespace-normal break-keep">
          의견 고마워요! 더 나은 게임을 만드는 데 활용할게요.
        </div>
      ) : (
        <div className="excel-cell max-sm:col-span-4 !p-0 min-w-0 bg-white outline outline-2 outline-[#217346] -outline-offset-2 relative z-[1]">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={maxLength}
            aria-label="피드백 내용"
            placeholder="피드백 입력 (예: 오늘 정답 재밌었어요)"
            autoComplete="off"
            enterKeyHint="send"
            className="min-w-0 flex-1 h-full px-3 outline-none text-[13px] text-gray-800 bg-transparent placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="보내기"
            className="shrink-0 h-full px-2 text-[#217346] disabled:text-gray-300 transition-colors"
          >
            <SendHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {/* 모바일은 단어 칸이 좁아서 시도·순위·유사도 칸까지 넓힌다 (Dec-44) */}
      <div className="excel-cell max-sm:hidden" />
      <div className="excel-cell max-sm:hidden" />
    </form>
  );
}
