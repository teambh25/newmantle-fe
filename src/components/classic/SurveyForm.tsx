"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { logEvent } from "@/utils/amplitude";

const SurveyForm: React.FC = () => {
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
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-xl font-semibold mb-2 text-center">
        게임이 재미있었나요?
      </h2>
      <div className="flex justify-center space-x-4">
        <Button
          variant={voted === false ? "default" : "outline"}
          onClick={() => handleVote(false)}
          disabled={voted !== null}
        >
          <ThumbsDown className="mr-2 h-4 w-4" /> 재미없다
        </Button>
        <Button
          variant={voted === true ? "default" : "outline"}
          onClick={() => handleVote(true)}
          disabled={voted !== null}
        >
          <ThumbsUp className="mr-2 h-4 w-4" /> 재밌다
        </Button>
      </div>
      {voted === false && (
        <div className="mt-4">
          <p className="mb-2 text-center">어떤 점이 별로였나요?</p>
          <p className="mb-2 text-center text-xs">
            피드백은 게임 개선에 큰 도움이 됩니다.
          </p>
          <Input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="여기에 의견을 작성해주세요."
            className="mb-2"
          />
          <Button
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "제출 중..." : "피드백 제출"}
          </Button>
        </div>
      )}
      {voted === true && (
        <p className="mt-4 text-center text-sm text-gray-500">
          투표해 주셔서 감사합니다!
        </p>
      )}
    </div>
  );
};

export default SurveyForm;
