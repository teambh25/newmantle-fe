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
    <div className="w-full mb-8 relative z-0">
      {/* 지글거리는 배경 레이어 */}
      <div className="absolute inset-0 z-[-1] bg-lime-400 border-4 border-game-brown shadow-[6px_6px_0px_0px_theme(colors.game.brown)] rounded-sm" />
      
      <div className="relative z-10 p-6 flex flex-col items-center text-game-brown">
        <p className="text-2xl font-black uppercase tracking-widest mb-2">
          {givenUp ? "게임을 포기하셨습니다 😢" : "정답을 맞췄습니다! 🎯"}
        </p>
        <p className="text-lg font-bold mb-1">
          {givenUp
            ? `${attempts}번 시도하셨습니다.`
            : `${correctAttempts}번째 만에 맞히셨네요.`}
        </p>
        <p className="text-sm font-bold text-gray-800 uppercase">(내일은 새로운 단어로 도전할 수 있어요!)</p>

        {gameCompleted && !givenUp && (
          <div className="mt-6 w-full p-4 bg-white border-2 border-game-brown border-dashed rounded-sm">
            <p className="text-base font-black mb-3 text-center uppercase">오늘 정답은 어땠나요?</p>
            <div className="flex justify-center space-x-3">
              <Button
                variant={answerSurveyVoted === true ? "default" : "outline"}
                size="sm"
                onClick={() => onAnswerSurveyVote(true)}
                disabled={answerSurveyVoted !== null}
                className="relative overflow-hidden font-black border-none rounded-none bg-transparent group h-10 px-4"
              >
                <div className={`absolute inset-0 z-0 border-2 border-game-brown ${answerSurveyVoted === true ? 'bg-game-brown' : 'bg-white'} rounded-sm`} />
                <span className={`relative z-10 flex items-center ${answerSurveyVoted === true ? 'text-white' : 'text-black'}`}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> 좋았다
                </span>
              </Button>
              <Button
                variant={answerSurveyVoted === false ? "default" : "outline"}
                size="sm"
                onClick={() => onAnswerSurveyVote(false)}
                disabled={answerSurveyVoted !== null}
                className="relative overflow-hidden font-black border-none rounded-none bg-transparent group h-10 px-4"
              >
                <div className={`absolute inset-0 z-0 border-2 border-game-brown ${answerSurveyVoted === false ? 'bg-game-brown' : 'bg-white'} rounded-sm`} />
                <span className={`relative z-10 flex items-center ${answerSurveyVoted === false ? 'text-white' : 'text-black'}`}>
                  <ThumbsDown className="mr-2 h-4 w-4" /> 별로였다
                </span>
              </Button>
            </div>
            {answerSurveyVoted !== null && (
              <p className="text-sm font-black mt-3 text-center uppercase text-pink-500">투표해 주셔서 감사합니다! ❤️</p>
            )}
          </div>
        )}

        <Button onClick={onCopyLink} className="mt-6 w-full h-12 relative overflow-hidden border-none rounded-none bg-transparent group">
          <div className="absolute inset-0 z-0 bg-game-brown border-4 border-game-brown hover:bg-opacity-90 transition-colors rounded-sm" />
          <span className="relative z-10 text-lg font-black uppercase text-white">
            친구에게 공유하기 🚀
          </span>
        </Button>
      </div>
    </div>
  );
}
