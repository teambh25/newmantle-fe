"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import WordTable from "./WordTable";
import { GameForm } from "./GameForm";
import { GameResult } from "./GameResult";
import { useGameLogic } from "@/hooks/useGameLogic";
import { logEvent } from "@/utils/amplitude";
import { useGameDate } from "@/hooks/useGameDate";
import HintButton from "@/components/HintButton";
import GiveUpButton from "@/components/GiveUpButton";

export default function NewMantleForm() {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const { toast } = useToast();
  const gameLogic = useGameLogic(gameDate);

  useEffect(() => {
    if (gameDate) {
      const [year, month, day] = gameDate.split("-");
      setDisplayDate(`${parseInt(month)}월 ${parseInt(day)}일`);
    }
  }, [gameDate]);

  const handleAnswerSurveyVote = (isPositive: boolean) => {
    logEvent("Answer Word Survey", {
      vote: isPositive ? "positive" : "negative",
      attempts: gameLogic.correctAttempts,
      date: gameDate,
    });
    gameLogic.setAnswerSurveyVoted(isPositive);
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const utmParams = new URLSearchParams({
      utm_source: "newmantle",
      utm_medium: "share",
      utm_campaign: "game_completion",
    });
    const link = `${baseUrl}?${utmParams.toString()}`;
    navigator.clipboard.writeText(link).then(
      () => {
        toast({
          title: "링크가 복사되었습니다!",
          description: "친구들에게 공유해보세요.",
        });
        logEvent("Result Shared", {
          method: "Link Copy",
          attempts: gameLogic.correctAttempts,
        });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
        });
      }
    );
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">{displayDate}</h2>
        <h3 className="text-xl mt-2">정답은...?</h3>
      </div>
      <div className="flex flex-col items-center mx-0">
        <GameResult
          givenUp={gameLogic.givenUp}
          gameCompleted={gameLogic.gameCompleted}
          attempts={gameLogic.attempts}
          correctAttempts={gameLogic.correctAttempts}
          answerSurveyVoted={gameLogic.answerSurveyVoted}
          onAnswerSurveyVote={handleAnswerSurveyVote}
          onCopyLink={handleCopyLink}
        />

        <GameForm
          inputWord={gameLogic.inputWord}
          setInputWord={gameLogic.setInputWord}
          isLoading={gameLogic.isLoading}
          gameCompleted={gameLogic.gameCompleted}
          isError={gameLogic.isError}
          errorMessage={gameLogic.errorMessage}
          submitWord={gameLogic.submitWord}
        />
        <div className="w-full mb-4 flex justify-center">
          <HintButton
            onHintRequest={gameLogic.requestHint}
            disabled={
              gameLogic.hintDisabled ||
              gameLogic.gameCompleted ||
              gameLogic.givenUp
            }
          />
          <GiveUpButton
            onGiveUp={gameLogic.giveUp}
            disabled={
              // gameLogic.hintUsed < 3 ||
              gameLogic.gameCompleted || gameLogic.givenUp
            }
            onInitialConsonantHint={gameLogic.requestInitialConsonantHint}
            initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
          />
        </div>

        <div className="w-full">
          {gameLogic.sortedWords.length > 0 ? (
            <>
              <WordTable words={gameLogic.sortedWords} showAll={showAllWords} />
              {gameLogic.sortedWords.length > 5 && (
                <div className="text-center mt-4">
                  <Button
                    onClick={() => setShowAllWords(!showAllWords)}
                    variant="outline"
                  >
                    {showAllWords ? "접기" : "더보기"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center">
              아직 제출한 단어가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
