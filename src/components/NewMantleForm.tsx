"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubmittedWord {
  word: string;
  similarity: number;
  rank: number;
  attempt: number;
}

const SimilarityBar: React.FC<{ similarity: number; rank: number }> = ({
  similarity,
  rank,
}) => {
  const barWidth = `${Math.abs(similarity) / 2}%`;
  const barColor = similarity >= 0 ? "bg-blue-500" : "bg-red-500";

  return (
    <div className="w-full">
      <div className="text-center text-xs text-gray-500 font-semibold">
        {rank === -1 ? "순위 밖" : `${rank}위`}
      </div>
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 bottom-0 ${barColor}`}
          style={{
            width: barWidth,
            left: similarity >= 0 ? "50%" : "auto",
            right: similarity < 0 ? "50%" : "auto",
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs text-gray-400  z-10">
          {similarity.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

// const mockSubmitWord = async (
//   word: string,
//   attempt: number
// ): Promise<SubmittedWord> => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const isCorrect = word.toLowerCase() === "정답";
//       resolve({
//         word,
//         similarity: isCorrect ? 100 : Math.random() * 200 - 100,
//         rank: isCorrect ? 1 : Math.floor(Math.random() * 1002) - 1, // -1 to 1000 range
//         attempt,
//       });
//     }, 500);
//   });
// };
const submitWord = async (
  word: string,
  attempt: number
): Promise<SubmittedWord> => {
  const encodedWord = encodeURIComponent(word);
  const response = await fetch(
    `http://43.203.234.62:5000/guess/1/${encodedWord}`
  );
  if (!response.ok) {
    throw new Error("API request failed");
  }
  const data = await response.json();
  return {
    word,
    similarity: data.score,
    rank: data.rank,
    attempt,
    correct: data.correct,
  };
};

export default function NewMantleForm() {
  const [inputWord, setInputWord] = useState("");
  const [submittedWords, setSubmittedWords] = useState<SubmittedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentDate, setCurrentDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    setCurrentDate(`${month}월 ${date}일`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputWord.trim() && !isLoading) {
      setIsLoading(true);
      setAttempts((prev) => prev + 1);
      const currentAttempt = attempts + 1;
      try {
        // const newWord = await mockSubmitWord(inputWord.trim(), currentAttempt);
        const newWord = await submitWord(inputWord.trim(), currentAttempt);

        setSubmittedWords((prev) => {
          if (prev.length === 0) return [newWord];
          const [lastWord, ...restWords] = prev;
          const sortedRestWords = [...restWords, lastWord].sort(
            (a, b) => b.similarity - a.similarity
          );
          return [newWord, ...sortedRestWords];
        });
        setInputWord("");
        // if (newWord.similarity === 100) {
        //   setIsCorrect(true);
        // }
        if (newWord.correct) {
          setIsCorrect(true);
        }
      } catch (error) {
        console.error("Error submitting word:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        alert("링크가 클립보드에 복사되었습니다!");
      })
      .catch((error) => {
        console.error("링크 복사 실패:", error);
      });
  };

  const displayedWords = showAllWords
    ? submittedWords
    : submittedWords.slice(0, 5);

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

        {isCorrect && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 text-center w-full">
            <p className="font-bold">정답을 맞췄습니다!</p>
            <p>{attempts}번째 만에 맞히셨네요.</p>
            <Button onClick={handleCopyLink} className="mt-4">
              링크 복사하기
            </Button>
          </div>
        )}

        <div className="w-full">
          {submittedWords.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-20">🔄</TableHead>
                    <TableHead className="text-center">단어</TableHead>
                    <TableHead className="text-center">유사도</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedWords.map((word, index) => (
                    <TableRow
                      key={index}
                      className={`${
                        word.similarity === 100 ? "bg-green-100" : ""
                      } ${index === 0 ? "bg-blue-50" : ""}`}
                    >
                      <TableCell className="text-center py-2 w-20">
                        {word.attempt}트
                      </TableCell>
                      <TableCell className="text-center py-2">
                        {word.word}
                      </TableCell>
                      <TableCell className="w-1/2 py-2">
                        <SimilarityBar
                          similarity={word.similarity}
                          rank={word.rank}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
