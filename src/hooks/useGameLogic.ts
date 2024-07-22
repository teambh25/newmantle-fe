import { useState, useRef, useEffect, useMemo } from "react";
import { submitWord as apiSubmitWord, SubmittedWord } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";

export function useGameLogic(gameDate: string) {
  const [inputWord, setInputWord] = useState("");
  const [submittedWords, setSubmittedWords] = useState<SubmittedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    logEvent("Game Started", { date: gameDate });
  }, [gameDate]);

  const sortedWords = useMemo(() => {
    if (submittedWords.length <= 1) return submittedWords;
    const [firstWord, ...restWords] = submittedWords;
    const sortedRestWords = restWords.sort((a, b) => {
      if (a.rank === -1 && b.rank === -1)
        return (b.similarity ?? 0) - (a.similarity ?? 0);
      if (a.rank === -1) return 1;
      if (b.rank === -1) return -1;
      return a.rank - b.rank;
    });
    return [firstWord, ...sortedRestWords];
  }, [submittedWords]);

  const submitWord = async () => {
    const trimmedWord = inputWord.trim();
    if (trimmedWord && !isLoading) {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);
      try {
        const existingWordIndex = submittedWords.findIndex(
          (word) => word.word.toLowerCase() === trimmedWord.toLowerCase()
        );

        if (existingWordIndex !== -1) {
          setIsError(true);
          setErrorMessage("이미 제출한 단어입니다");
          const existingWord = submittedWords[existingWordIndex];
          setSubmittedWords((prev) => [
            existingWord,
            ...prev.filter((_, index) => index !== existingWordIndex),
          ]);
        } else {
          const newWord = await apiSubmitWord(
            trimmedWord,
            attempts + 1,
            gameDate
          );
          logEvent("Word Submitted", {
            word: trimmedWord,
            attempt: attempts + 1,
            similarity: newWord.similarity,
            isCorrect: newWord.correct,
          });

          setSubmittedWords((prev) => [newWord, ...prev]);
          setAttempts((prev) => prev + 1);

          if (newWord.correct) {
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
        }
      } catch (error) {
        setIsError(true);
        setErrorMessage(
          error instanceof Error && error.message === "Invalid word"
            ? "없는 단어입니다"
            : "오류가 발생했습니다"
        );
      } finally {
        setInputWord("");
        setIsLoading(false);
      }
    }
  };

  return {
    inputWord,
    setInputWord,
    submittedWords,
    isLoading,
    attempts,
    gameCompleted,
    isError,
    errorMessage,
    sortedWords,
    submitWord,
  };
}
