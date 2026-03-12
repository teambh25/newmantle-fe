"use client";
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { logEvent } from "@/utils/amplitude";

interface SurveyFormProps {
  startRow?: number;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ startRow = 21 }) => {
  const [voted, setVoted] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = (isPositive: boolean) => {
    logEvent("Survey Vote", {
      vote: isPositive ? "positive" : "negative",
    });
    setVoted(isPositive);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        "https://hook.eu2.make.com/ojb3ezccxcl55rqyhy3lgklp2jlqvxtg",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            feedback,
            timestamp: new Date().toISOString(),
          }),
        }
      );
      if (response.ok) {
        logEvent("Feedback Submitted", { feedback });
        setFeedback("");
        alert("피드백이 제출되었습니다. 감사합니다!");
      } else {
        throw new Error("피드백 제출에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("피드백 제출 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="excel-row bg-white">
        <div className="sheet-cell-header bg-[#e2e2e2] font-bold text-[#217346]">{startRow}</div>
        <div className="excel-cell col-span-4 flex items-center justify-start font-bold text-[13px] text-[#217346] bg-[#e6f2eb]">
          게임이 재미있었나요?
        </div>
      </div>

      <div className="excel-row bg-white !flex">
        <div className="sheet-cell-header flex-shrink-0">{startRow + 1}</div>
        {voted === null ? (
          <div className="flex-grow flex">
            <div
              className="excel-cell flex-1 justify-start font-normal text-[13px] cursor-pointer hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-[#217346] hover:z-10 text-gray-800 bg-white"
              onClick={() => handleVote(true)}
            >
              <ThumbsUp size={14} className="mr-2 text-[#217346]" strokeWidth={2} /> 재밌다
            </div>
            <div
              className="excel-cell flex-1 border-r-0 justify-start font-normal text-[13px] cursor-pointer hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-[#217346] hover:z-10 text-gray-800 bg-white"
              onClick={() => handleVote(false)}
            >
              <ThumbsDown size={14} className="mr-2 text-red-600" strokeWidth={2} /> 재미없다
            </div>
          </div>
        ) : voted === true ? (
          <div className="excel-cell border-r-0 justify-start font-normal text-[13px] text-[#217346] flex-grow bg-[#e6f2eb]">
            투표해 주셔서 감사합니다! 👍
          </div>
        ) : (
          <div className="excel-cell border-r-0 justify-start font-normal text-[13px] text-red-600 flex-grow bg-[#fdf0f0]">
            재미없다 👎
          </div>
        )}
      </div>

      {voted === false && (
        <div className="excel-row bg-white">
          <div className="sheet-cell-header">{startRow + 2}</div>
          <div className="excel-cell px-3 justify-start font-normal text-[13px] text-gray-700 bg-gray-50 border-r border-[#e1e1e1]">
            어떤 점이 별로였나요?
          </div>
          <div className="excel-cell p-0 col-span-2 focus-within:outline focus-within:outline-2 focus-within:outline-[#217346] focus-within:-outline-offset-2 focus-within:z-10 bg-white relative">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="여기에 의견을 작성해주세요."
              className="w-full h-full px-3 py-1 outline-none text-[13px] text-gray-800 bg-transparent placeholder:text-gray-400 absolute inset-0"
            />
          </div>
          <button
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim() || isSubmitting}
            className="excel-cell border-r-0 justify-center bg-[#217346] text-white font-medium text-[13px] hover:bg-[#1a5a37] disabled:bg-[#f3f3f3] disabled:text-[#a0a0a0] transition-colors cursor-pointer uppercase"
          >
            {isSubmitting ? "Wait" : "Enter"}
          </button>
        </div>
      )}
    </>
  );
};

export default SurveyForm;
