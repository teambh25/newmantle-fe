"use client";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface GameResultProps {
  givenUp: boolean;
  gameCompleted: boolean;
  attempts: number;
  correctAttempts: number;
  answerSurveyVoted: boolean | null;
  onAnswerSurveyVote: (isPositive: boolean) => void;
  onCopyLink: () => void;
}

export function GameResult({
  givenUp,
  gameCompleted,
  attempts,
  correctAttempts,
  answerSurveyVoted,
  onAnswerSurveyVote,
  onCopyLink,
}: GameResultProps) {
  if (!gameCompleted && !givenUp) return null;

  return (
    <div className="w-full mb-6 p-4 bg-green-100 border border-green-500 text-green-700 rounded-md">
      <p className="font-bold">
        {givenUp ? "게임을 포기하셨습니다." : "정답을 맞췄습니다!"}
      </p>
      <p>
        {givenUp
          ? `${attempts}번 시도하셨습니다.`
          : `${correctAttempts}번째 만에 맞히셨네요.`}
      </p>
      <p>(내일은 새로운 단어로 도전할 수 있어요!)</p>

      {gameCompleted && !givenUp && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">오늘 정답은 어땠나요?</p>
          <div className="flex justify-center space-x-2">
            <Button
              variant={answerSurveyVoted === true ? "default" : "outline"}
              size="sm"
              onClick={() => onAnswerSurveyVote(true)}
              disabled={answerSurveyVoted !== null}
            >
              <ThumbsUp className="mr-1 h-3 w-3" /> 좋았다
            </Button>
            <Button
              variant={answerSurveyVoted === false ? "default" : "outline"}
              size="sm"
              onClick={() => onAnswerSurveyVote(false)}
              disabled={answerSurveyVoted !== null}
            >
              <ThumbsDown className="mr-1 h-3 w-3" /> 별로였다
            </Button>
          </div>
          {answerSurveyVoted !== null && (
            <p className="text-xs mt-2 text-center">투표해 주셔서 감사합니다!</p>
          )}
        </div>
      )}

      <Button onClick={onCopyLink} className="mt-4">
        친구에게 공유하기
      </Button>
    </div>
  );
}
