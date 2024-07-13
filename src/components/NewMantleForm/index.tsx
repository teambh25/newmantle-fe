//src/components/NewMantleForm/index.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import WordTable from "./WordTable";
import { submitWord, SubmittedWord } from "@/utils/api";
import { logEvent } from "@/utils/amplitude";

export default function NewMantleForm() {
  const [inputWord, setInputWord] = useState("");
  const [submittedWords, setSubmittedWords] = useState<SubmittedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const [currentDate, setCurrentDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [shouldFocus, setShouldFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const now = new Date();
    setCurrentDate(`${now.getMonth() + 1}월 ${now.getDate()}일`);
    logEvent("Game Started", {
      date: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
      setShouldFocus(false);
    }
  }, [shouldFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedWord = inputWord.trim();
    if (trimmedWord && !isLoading) {
      if (
        submittedWords.some(
          (word) => word.word.toLowerCase() === trimmedWord.toLowerCase()
        )
      ) {
        setError("이미 제출한 단어입니다.");
        setInputWord("");
        setShouldFocus(true);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const newWord = await submitWord(trimmedWord, attempts + 1);
        logEvent("Word Submitted", {
          word: trimmedWord,
          attempt: attempts + 1,
          similarity: newWord.similarity,
          isCorrect: newWord.correct,
        });
        setSubmittedWords((prev) => {
          const updatedWords = [newWord, ...prev];
          const sortedWords = updatedWords
            .slice(1)
            .sort(
              (a, b) =>
                (b.similarity ?? -Infinity) - (a.similarity ?? -Infinity)
            );
          return [newWord, ...sortedWords];
        });
        setInputWord("");
        if (newWord.correct) {
          setIsCorrect(true);
          setGameCompleted(true);
          toast({
            title: "축하합니다!",
            description: `${attempts + 1}번째 시도에 정답을 맞히셨습니다.`,
          });
          logEvent("Game Completed", {
            attempts: attempts + 1,
            timeSpent: (Date.now() - startTimeRef.current) / 1000,
          });
        }
        setAttempts((prev) => prev + 1);
      } catch (error) {
        if (error instanceof Error) {
          setError(
            error.message === "Invalid word"
              ? "올바른 단어를 입력해주세요."
              : error.message === "Request timeout"
              ? "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요."
              : "단어 제출 중 오류가 발생했습니다."
          );
        }
      } finally {
        setIsLoading(false);
        setShouldFocus(true);
      }
    }
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
          attempts: attempts,
          timeSpent: (Date.now() - startTimeRef.current) / 1000,
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
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <h2 className="text-2xl font-bold">{currentDate}</h2>
        <h3 className="text-xl mt-2">정답은...?</h3>
      </CardHeader>
      <CardContent className="flex flex-col items-center mx-0">
        <form onSubmit={handleSubmit} className="w-full mb-6">
          <div className="flex flex-col space-y-2">
            <Input
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="단어를 입력하세요"
              className="text-center"
              disabled={isLoading || gameCompleted}
              ref={inputRef}
            />
            <Button
              type="submit"
              disabled={isLoading || gameCompleted}
              className="w-full"
            >
              {isLoading ? "제출 중..." : "제출"}
            </Button>
          </div>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {gameCompleted && (
          <Alert className="mb-6 bg-green-100 border-green-500 text-green-700">
            <AlertDescription>
              <p className="font-bold">정답을 맞췄습니다!</p>
              <p>{attempts}번째 만에 맞히셨네요.</p>
              <p>(내일은 새로운 단어로 도전할 수 있어요!)</p>

              <Button onClick={handleCopyLink} className="mt-4">
                친구에게 공유하기
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full">
          {submittedWords.length > 0 ? (
            <>
              <WordTable words={submittedWords} showAll={showAllWords} />
              {submittedWords.length > 5 && (
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
      </CardContent>
    </Card>
  );
}
