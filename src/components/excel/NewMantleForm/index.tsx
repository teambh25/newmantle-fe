"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const { toast } = useToast();
  const gameLogic = useGameState(gameDate, "excel");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      theme: "excel",
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
    const shareText = `제가 뉴맨틀 단어를 ${gameLogic.correctAttempts}번 만에 맞혔습니다! 당신의 실력은?`;

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
          theme: "excel",
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
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
          theme: "excel",
        });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
          theme: "excel",
        });
      }
    );
  };

  const showGameResult = gameLogic.gameCompleted || gameLogic.givenUp;
  let currentIndex = 2;
  const gameResultIndex = showGameResult ? currentIndex++ : null;
  const competitiveBarIndex = sharedAttempts !== null ? currentIndex++ : null;
  const wordTableStartIndex = currentIndex;

  return (
    <>
      {gameResultIndex !== null && (
        <div className="excel-row">
          <div className="sheet-cell-header">{gameResultIndex}</div>
          <div className="excel-cell col-span-4 p-0 border-b-0 border-[#d4d4d4]">
            <GameResult
              givenUp={gameLogic.givenUp}
              gameCompleted={gameLogic.gameCompleted}
              attempts={gameLogic.attempts}
              solvedAttempts={gameLogic.solvedAttempts}
              correctAttempts={gameLogic.correctAttempts}
              answerSurveyVoted={gameLogic.answerSurveyVoted}
              onAnswerSurveyVote={handleAnswerSurveyVote}
              onCopyLink={handleCopyLink}
            />
          </div>
        </div>
      )}

      {competitiveBarIndex !== null && sharedAttempts !== null && (
        <div className="excel-row">
          <div className="sheet-cell-header">{competitiveBarIndex}</div>
          <div className="excel-cell col-span-4 p-0 bg-white border-[#d4d4d4]">
            <CompetitiveBar
              currentAttempts={gameLogic.attempts}
              sharedAttempts={sharedAttempts}
              theme="excel"
              gameCompleted={gameLogic.gameCompleted || gameLogic.givenUp}
            />
          </div>
        </div>
      )}

      {mounted && document.getElementById("excel-formula-bar") && createPortal(
        <GameForm
          submitAction={gameLogic.submitWordAction}
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
        />,
        document.getElementById("excel-formula-bar")!
      )}

      {gameLogic.sortedWords.length > 0 ? (
        <>
          <WordTable words={gameLogic.sortedWords} showAll={showAllWords} startIndex={wordTableStartIndex} />
          {gameLogic.sortedWords.length > 5 && (
            <div className="excel-row bg-white cursor-pointer hover:bg-gray-50" onClick={() => setShowAllWords(!showAllWords)}>
              <div className="sheet-cell-header">{gameLogic.sortedWords.length + wordTableStartIndex}</div>
              <div className="excel-cell justify-center"></div>
              <div className="excel-cell justify-center text-[#217346] font-bold text-sm underline">
                {showAllWords ? "접기" : "더보기"}
              </div>
              <div className="excel-cell justify-center"></div>
              <div className="excel-cell justify-center border-r-0"></div>
            </div>
          )}
        </>
      ) : (
        <div className="excel-row bg-white">
          <div className="sheet-cell-header">{wordTableStartIndex}</div>
          <div className="excel-cell col-span-4 justify-center text-gray-400 py-12 bg-gray-50 text-sm text-center border-b border-gray-100 italic">
            제출된 데이터가 없습니다. (Empty Sheet)
          </div>
        </div>
      )}
    </>
  );
}
