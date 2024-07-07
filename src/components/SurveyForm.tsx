"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SurveyForm: React.FC = () => {
  const [voted, setVoted] = useState<boolean | null>(null);

  const handleVote = (isPositive: boolean) => {
    // Here you would typically send the vote to your backend
    console.log(`User voted: ${isPositive ? "positive" : "negative"}`);
    setVoted(isPositive);
  };

  return (
    <div className="w-full max-w-2xl mt-8">
      <h2 className="text-xl font-semibold mb-2 text-center">
        꼬맨틀과 비교했을 때 더 재미있나요?
      </h2>
      <div className="flex justify-center space-x-4">
        <Button
          variant={voted === true ? "default" : "outline"}
          onClick={() => handleVote(true)}
          disabled={voted !== null}
        >
          <ThumbsUp className="mr-2 h-4 w-4" /> 재밌다
        </Button>
        <Button
          variant={voted === false ? "default" : "outline"}
          onClick={() => handleVote(false)}
          disabled={voted !== null}
        >
          <ThumbsDown className="mr-2 h-4 w-4" /> 재미없다
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
