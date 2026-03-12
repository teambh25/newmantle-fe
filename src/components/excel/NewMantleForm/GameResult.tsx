import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface GameResultProps {
  givenUp: boolean;
  gameCompleted: boolean;
  attempts: number;
  solvedAttempts: number | null;
  correctAttempts: number;
  answerSurveyVoted: boolean | null;
  onAnswerSurveyVote: (isPositive: boolean) => void;
}

export function GameResult({
  givenUp,
  gameCompleted,
  attempts,
  solvedAttempts,
  correctAttempts,
  answerSurveyVoted,
  onAnswerSurveyVote,
}: GameResultProps) {
  if (!gameCompleted && !givenUp) return null;

  const displaySolvedAttempts = solvedAttempts ?? correctAttempts;

  return (
    <div className="w-full bg-[#f3f9f5] flex flex-col items-center text-center p-6">
      <div className="bg-[#217346] text-white px-2 py-0.5 text-xs font-bold uppercase mb-4">
        GAME_RESULT: {givenUp ? "GIVEN_UP" : "COMPLETED"}
      </div>

      <p className="text-2xl font-bold text-[#217346] mb-2 text-center w-full">
        {givenUp ? "게임을 포기하셨습니다." : "정답을 맞혔습니다!"}
      </p>
      <p className="text-base text-gray-700 mb-1 text-center w-full">
        {givenUp
          ? `${displaySolvedAttempts}번 시도 후 포기하셨습니다.`
          : `${displaySolvedAttempts}번째 만에 맞히셨네요.`}
      </p>
      <p className="text-sm text-gray-500 italic mb-4 text-center w-full">
        (내일은 새로운 단어로 도전할 수 있어요!)
      </p>

      {gameCompleted && !givenUp && (
        <div className="w-full max-w-md pt-4 border-t border-gray-200 mt-4">
          <p className="text-base font-bold text-gray-700 mb-3 text-center w-full">
            오늘 정답은 어땠나요?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => onAnswerSurveyVote(true)}
              disabled={answerSurveyVoted !== null}
              className={`flex items-center space-x-2 px-4 py-2 border text-sm font-bold transition-colors ${answerSurveyVoted === true
                ? "bg-[#217346] text-white border-[#217346]"
                : "bg-white text-gray-700 border-gray-300 hover:bg-[#f3f2f1] disabled:opacity-50"
                }`}
            >
              <ThumbsUp size={16} /> <span>좋았다</span>
            </button>
            <button
              onClick={() => onAnswerSurveyVote(false)}
              disabled={answerSurveyVoted !== null}
              className={`flex items-center space-x-2 px-4 py-2 border text-sm font-bold transition-colors ${answerSurveyVoted === false
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-[#f3f2f1] disabled:opacity-50"
                }`}
            >
              <ThumbsDown size={16} /> <span>별로였다</span>
            </button>
          </div>
          {answerSurveyVoted !== null && (
            <p className="text-sm mt-3 text-[#217346] font-bold">
              투표해 주셔서 감사합니다!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
