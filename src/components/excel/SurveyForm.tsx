"use client";
import React from "react";
import { FeedbackEntry, useFeedback } from "@/hooks/useFeedback";

interface SurveyFormProps {
  entry: FeedbackEntry;
  startRow?: number;
}

// excel 피드백 창 내용. 셀 모양은 유지하고 동작은 classic과 같다 (docs/tasks/ui/feedback/decisions.md Dec-5)
const SurveyForm: React.FC<SurveyFormProps> = ({ entry, startRow = 21 }) => {
  const { text, setText, sending, sent, canSend, submit, maxLength } = useFeedback({
    entry,
    theme: "excel",
  });

  return (
    <>
      <div className="excel-row bg-white">
        <div className="sheet-cell-header bg-[#e2e2e2] font-bold text-[#217346]">{startRow}</div>
        <div className="excel-cell col-span-4 flex items-center justify-start font-bold text-[13px] text-[#217346] bg-[#e6f2eb]">
          피드백
        </div>
      </div>

      {sent ? (
        <div className="excel-row bg-white !flex">
          <div className="sheet-cell-header flex-shrink-0">{startRow + 1}</div>
          <div
            role="status"
            className="excel-cell border-r-0 justify-start font-normal text-[13px] text-[#217346] flex-grow bg-[#e6f2eb]"
          >
            의견 고마워요! 더 나은 게임을 만드는 데 활용할게요.
          </div>
        </div>
      ) : (
        <>
          <div className="excel-row bg-white !flex">
            <div className="sheet-cell-header flex-shrink-0">{startRow + 1}</div>
            <div className="excel-cell border-r-0 justify-start font-normal text-[12px] text-gray-700 flex-grow bg-gray-50 !h-auto py-1 whitespace-normal">
              무엇이든 적어주세요. 게임 개선에 큰 도움이 돼요.
            </div>
          </div>

          <div className="excel-row bg-white !flex !h-auto">
            <div className="sheet-cell-header flex-shrink-0 !h-auto">{startRow + 2}</div>
            <div className="excel-cell border-r-0 p-0 flex-grow !h-auto focus-within:outline focus-within:outline-2 focus-within:outline-[#217346] focus-within:-outline-offset-2 focus-within:z-10 bg-white">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={maxLength}
                rows={4}
                aria-label="피드백 내용"
                placeholder={"예) 오늘 정답 단어 재밌었어요\n유사도 순위가 이상해요\n이런 기능이 있으면 좋겠어요\n버그를 발견했어요"}
                className="w-full resize-none px-3 py-1 outline-none text-[13px] text-gray-800 bg-transparent placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="excel-row bg-white !flex">
            <div className="sheet-cell-header flex-shrink-0">{startRow + 3}</div>
            <div className="excel-cell justify-end font-normal text-[12px] text-gray-400 flex-grow bg-white">
              {text.length}/{maxLength}
            </div>
            <button
              onClick={submit}
              disabled={!canSend}
              aria-label="보내기"
              className="excel-cell border-r-0 w-24 flex-shrink-0 justify-center bg-[#217346] text-white font-medium text-[13px] hover:bg-[#1a5a37] disabled:bg-[#f3f3f3] disabled:text-[#a0a0a0] transition-colors cursor-pointer uppercase"
            >
              {sending ? "Wait" : "Enter"}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default SurveyForm;
