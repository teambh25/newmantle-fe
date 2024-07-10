"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logEvent } from "@/utils/amplitude";

const SurveyForm: React.FC = () => {
  const [voted, setVoted] = useState<boolean | null>(null);

  const handleVote = (isPositive: boolean) => {
    // 앰플리튜드 이벤트 로깅
    logEvent("Survey Vote", {
      vote: isPositive ? "positive" : "negative",
    });

    console.log(`User voted: ${isPositive ? "positive" : "negative"}`);
    setVoted(isPositive);
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
      {voted !== null && (
        <p className="mt-4 text-center text-sm text-gray-500">
          투표해 주셔서 감사합니다!
        </p>
      )}
    </div>
  );
};

export default SurveyForm;
