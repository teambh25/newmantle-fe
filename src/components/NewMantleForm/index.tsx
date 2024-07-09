"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import WordTable from "./WordTable";
import { submitWord, SubmittedWord } from "@/utils/api";

export default function NewMantleForm() {
  const [inputWord, setInputWord] = useState("");
  const [submittedWords, setSubmittedWords] = useState<SubmittedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentDate, setCurrentDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${now.getMonth() + 1}월 ${now.getDate()}일`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputWord.trim() && !isLoading) {
      // 이미 제출한 단어인지 확인
      const alreadySubmitted = submittedWords.some(
        (word) => word.word.toLowerCase() === inputWord.trim().toLowerCase()
      );

      if (alreadySubmitted) {
        setError("이미 제출한 단어입니다.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const newWord = await submitWord(inputWord.trim(), attempts + 1);
        setSubmittedWords((prev) => {
          const updatedWords = [newWord, ...prev].sort(
            (a, b) => (b.similarity ?? -Infinity) - (a.similarity ?? -Infinity)
          );
          return updatedWords;
        });
        setInputWord("");
        if (newWord.correct) {
          setIsCorrect(true);
          toast({
            title: "축하합니다!",
            description: `${attempts + 1}번째 시도에 정답을 맞추셨습니다.`,
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
      }
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(
      () => toast({ title: "링크가 복사되었습니다!" }),
      () => toast({ title: "링크 복사 실패", variant: "destructive" })
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
              disabled={isLoading || isCorrect}
            />
            <Button
              type="submit"
              disabled={isLoading || isCorrect}
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

        {isCorrect && (
          <Alert className="mb-6 bg-green-100 border-green-500 text-green-700">
            <AlertDescription>
              <p className="font-bold">정답을 맞췄습니다!</p>
              <p>{attempts}번째 만에 맞히셨네요.</p>
              <Button onClick={handleCopyLink} className="mt-4">
                링크 복사하기
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
