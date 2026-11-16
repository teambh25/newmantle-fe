"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import WordTable from "./WordTable";
import { GameForm } from "./GameForm";
import { GameResult } from "./GameResult";
import { useGameState } from "@/hooks/useGameState";
import { logEvent } from "@/utils/amplitude";
import { useGameDate } from "@/hooks/useGameDate";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";
import { useShareLink } from "@/hooks/useShareLink";

export default function NewMantleForm() {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const gameLogic = useGameState(gameDate, "excel");
  // 공유 링크 읽기·보내기는 classic과 같은 훅 (specs/excel-ui Dec-2)
  const { sharedAttempts, sharerHintCount, isLoadingSharerStats, share: handleCopyLink } = useShareLink({
    gameDate,
    attempts: gameLogic.correctAttempts,
    theme: "excel",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const showGameResult = gameLogic.gameCompleted || gameLogic.givenUp;
  let currentIndex = 2;
  const gameResultIndex = showGameResult ? currentIndex++ : null;
  const challengeLinkIndex = showGameResult ? currentIndex++ : null;
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
            />
          </div>
        </div>
      )}

      {challengeLinkIndex !== null && (
        <div className="excel-row">
          <div className="sheet-cell-header">{challengeLinkIndex}</div>
          <div className="excel-cell col-span-4 p-5 flex flex-col items-center">
            <p className="text-[13px] text-gray-700 font-bold mb-3">
              친구는 나보다 빨리 맞힐까요?
            </p>
            <button
              onClick={handleCopyLink}
              className="px-8 py-2 bg-[#217346] text-white text-sm font-bold hover:bg-[#1a5a37] transition-all border border-[#1a5a37]"
            >
              🥊 도전장 보내기
            </button>
          </div>
        </div>
      )}

      {competitiveBarIndex !== null && sharedAttempts !== null && (
        <div className="excel-row">
          <div className="sheet-cell-header">{competitiveBarIndex}</div>
          <div className="excel-cell col-span-4 p-0 bg-white border-b border-[#d4d4d4]">
            <CompetitiveBar
              currentAttempts={gameLogic.solvedAttempts ?? gameLogic.correctAttempts}
              sharedAttempts={sharedAttempts}
              sharedHintCount={sharerHintCount}
              isLoadingSharerStats={isLoadingSharerStats}
              theme="excel"
              gameCompleted={gameLogic.gameCompleted || gameLogic.givenUp}
            />
          </div>
        </div>
      )}

      {mounted && document.getElementById("excel-formula-bar") && createPortal(
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
                gameLogic.givenUp ||
                gameLogic.hintPending
              }
            />
          }
          giveUpButton={
            <GiveUpButton
              onGiveUp={gameLogic.giveUp}
              disabled={
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.giveUpPending
              }
              onInitialConsonantHint={gameLogic.requestInitialConsonantHint}
              initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
            />
          }
        />,
        document.getElementById("excel-formula-bar")!
      )}

      {gameLogic.sortedWords.length > 0 || pendingWord ? (
        <>
          <WordTable 
            words={gameLogic.sortedWords} 
            showAll={showAllWords} 
            startIndex={wordTableStartIndex} 
            pendingWord={pendingWord}
            pendingAttempt={gameLogic.attempts + 1}
          />
          {gameLogic.sortedWords.length > 5 && (
            <div className="excel-row bg-white cursor-pointer hover:bg-gray-50" onClick={() => setShowAllWords(!showAllWords)}>
              <div className="sheet-cell-header">{gameLogic.sortedWords.length + wordTableStartIndex + (pendingWord ? 1 : 0)}</div>
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
