// src/components/NewMantleForm/index.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import WordTable from "./WordTable";
import { GameForm } from "./GameForm";
import { useGameLogic } from "@/hooks/useGameLogic";
import { logEvent } from "@/utils/amplitude";

export default function NewMantleForm() {
  const [currentDate, setCurrentDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const { toast } = useToast();
  const gameLogic = useGameLogic();

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${now.getMonth() + 1}월 ${now.getDate()}일`);
  }, []);

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
          attempts: gameLogic.attempts,
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
        <h2 className="text-2xl font-bold">{currentDate}</h2>
        <h3 className="text-xl mt-2">정답은...?</h3>
      </div>
      <div className="flex flex-col items-center mx-0">
        <GameForm
          inputWord={gameLogic.inputWord}
          setInputWord={gameLogic.setInputWord}
          isLoading={gameLogic.isLoading}
          gameCompleted={gameLogic.gameCompleted}
          isError={gameLogic.isError}
          errorMessage={gameLogic.errorMessage}
          submitWord={gameLogic.submitWord}
        />

        {gameLogic.gameCompleted && (
          <div className="mb-6 p-4 bg-green-100 border border-green-500 text-green-700 rounded-md">
            <p className="font-bold">정답을 맞췄습니다!</p>
            <p>{gameLogic.attempts}번째 만에 맞히셨네요.</p>
            <p>(내일은 새로운 단어로 도전할 수 있어요!)</p>

            <Button onClick={handleCopyLink} className="mt-4">
              친구에게 공유하기
            </Button>
          </div>
        )}

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
