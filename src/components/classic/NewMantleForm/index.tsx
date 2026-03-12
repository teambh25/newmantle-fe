"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import WordTable from "./WordTable";
import { GameForm } from "./GameForm";
import { GameResult } from "./GameResult";
import { useGameState } from "@/hooks/useGameState";
import { logEvent } from "@/utils/amplitude";
import { useGameDate } from "@/hooks/useGameDate";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";

export default function NewMantleForm() {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [sharedAttempts, setSharedAttempts] = useState<number | null>(null);
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const { toast } = useToast();
  const gameLogic = useGameState(gameDate, "classic");

  useEffect(() => {
    // Read shared_attempts from URL search params on mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get("shared_attempts");
      if (shared && !isNaN(parseInt(shared))) {
        setSharedAttempts(parseInt(shared));
      }
    }
  }, []);

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
      theme: "classic",
    });
    gameLogic.setAnswerSurveyVoted(isPositive);
  };

  const handleCopyLink = async () => {
    const baseUrl = window.location.origin;
    const utmParams = new URLSearchParams({
      utm_source: "newmantle",
      utm_medium: "share",
      utm_campaign: "game_completion",
      shared_attempts: gameLogic.correctAttempts.toString(),
    });
    const link = `${baseUrl}?${utmParams.toString()}`;
    const shareTitle = "뉴맨틀 게임 결과";
    const shareText = `저는 오늘 뉴맨틀을 ${gameLogic.correctAttempts}트 만에 성공했습니다. 저를 이겨보세요.`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: link,
        });
        logEvent("Result Shared", {
          method: "Native Share",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
        return; // Success! No toast needed for native share.
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled the share, do nothing
          return;
        }
        // Fallback to clipboard if share failed
      }
    }

    navigator.clipboard.writeText(link).then(
      () => {
        toast({
          title: "링크가 복사되었습니다!",
          description: "친구들에게 공유해보세요.",
        });
        logEvent("Result Shared", {
          method: "Link Copy",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
          theme: "classic",
        });
      }
    );
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col items-center mx-0">
        <GameResult
          givenUp={gameLogic.givenUp}
          gameCompleted={gameLogic.gameCompleted}
          attempts={gameLogic.attempts}
          solvedAttempts={gameLogic.solvedAttempts}
          correctAttempts={gameLogic.correctAttempts}
          answerSurveyVoted={gameLogic.answerSurveyVoted}
          onAnswerSurveyVote={handleAnswerSurveyVote}
        />

        {(gameLogic.gameCompleted || gameLogic.givenUp) && (
          <div className="w-full mb-8 text-center">
            <p className="text-gray-700 mb-3 text-sm font-medium">친구는 나보다 빨리 맞힐까요?</p>
            <Button onClick={handleCopyLink} className="mx-auto">
              🥊 도전장 보내기
            </Button>
          </div>
        )}

        {sharedAttempts !== null && (
          <CompetitiveBar
            currentAttempts={gameLogic.solvedAttempts ?? gameLogic.correctAttempts}
            sharedAttempts={sharedAttempts}
            theme="classic"
            gameCompleted={gameLogic.gameCompleted || gameLogic.givenUp}
          />
        )}

        <GameForm
          submitAction={async (word) => {
            let isDone = false;
            const timer = setTimeout(() => {
              if (!isDone) setPendingWord(word);
            }, 300);
            const res = await gameLogic.submitWordAction(word);
            isDone = true;
            clearTimeout(timer);
            setPendingWord(null);
            return res;
          }}
          gameCompleted={gameLogic.gameCompleted}
          displayDate={displayDate}
          hintButton={
            <HintButton
              onHintRequest={gameLogic.requestHint}
              disabled={
                gameLogic.hintDisabled ||
                gameLogic.gameCompleted ||
                gameLogic.givenUp
              }
            />
          }
          giveUpButton={
            <GiveUpButton
              onGiveUp={gameLogic.giveUp}
              disabled={
                gameLogic.gameCompleted || gameLogic.givenUp
              }
              onInitialConsonantHint={gameLogic.requestInitialConsonantHint}
              initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
            />
          }
        />

        <div className="w-full">
          {gameLogic.sortedWords.length > 0 || pendingWord ? (
            <>
              <WordTable 
                words={gameLogic.sortedWords} 
                showAll={showAllWords} 
                pendingWord={pendingWord}
                pendingAttempt={gameLogic.attempts + 1}
              />
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
