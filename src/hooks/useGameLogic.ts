import { useState, useRef, useEffect, useMemo } from "react";
import {
  submitWord as apiSubmitWord,
  SubmittedWord,
  getHint,
} from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";

const STORAGE_KEY = "newmantle_game_data";

interface GameData {
  submittedWords: SubmittedWord[];
  attempts: number;
  gameCompleted: boolean;
  lastPlayedDate: string;
}

function getInitialGameState(): GameData {
  if (typeof window === "undefined") {
    return {
      submittedWords: [],
      attempts: 0,
      gameCompleted: false,
      lastPlayedDate: new Date().toDateString(),
    };
  }

  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const parsedData: GameData = JSON.parse(storedData);
    const today = new Date().toDateString();
    if (parsedData.lastPlayedDate === today) {
      return parsedData;
    }
  }

  return {
    submittedWords: [],
    attempts: 0,
    gameCompleted: false,
    lastPlayedDate: new Date().toDateString(),
  };
}

export function useGameLogic(gameDate: string) {
  const [inputWord, setInputWord] = useState("");
  const [gameState, setGameState] = useState<GameData>(getInitialGameState);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { toast } = useToast();
  const [hintDisabled, setHintDisabled] = useState(false);

  useEffect(() => {
    logEvent("Game Started", { date: gameDate });
  }, [gameDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const sortedWords = useMemo(() => {
    if (gameState.submittedWords.length <= 1) return gameState.submittedWords;
    const [firstWord, ...restWords] = gameState.submittedWords;
    const sortedRestWords = restWords.sort((a, b) => {
      if (a.rank === -1 && b.rank === -1)
        return (b.similarity ?? 0) - (a.similarity ?? 0);
      if (a.rank === -1) return 1;
      if (b.rank === -1) return -1;
      return a.rank - b.rank;
    });
    return [firstWord, ...sortedRestWords];
  }, [gameState.submittedWords]);

  const submitWord = async () => {
    const trimmedWord = inputWord.trim();
    if (trimmedWord && !isLoading) {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);
      try {
        const existingWordIndex = gameState.submittedWords.findIndex(
          (word) => word.word.toLowerCase() === trimmedWord.toLowerCase()
        );

        if (existingWordIndex !== -1) {
          setIsError(true);
          setErrorMessage("이미 제출한 단어입니다");
          const existingWord = gameState.submittedWords[existingWordIndex];
          setGameState((prev) => ({
            ...prev,
            submittedWords: [
              existingWord,
              ...prev.submittedWords.filter(
                (_, index) => index !== existingWordIndex
              ),
            ],
          }));
        } else {
          const newWord = await apiSubmitWord(
            trimmedWord,
            gameState.attempts + 1,
            gameDate
          );
          logEvent("Word Submitted", {
            word: trimmedWord,
            attempt: gameState.attempts + 1,
            similarity: newWord.similarity,
            isCorrect: newWord.correct,
          });

          setGameState((prev) => ({
            ...prev,
            submittedWords: [newWord, ...prev.submittedWords],
            attempts: prev.attempts + 1,
            gameCompleted: newWord.correct,
          }));

          if (newWord.correct) {
            toast({
              title: "축하합니다!",
              description: `${
                gameState.attempts + 1
              }번째 시도에 정답을 맞히셨습니다.`,
            });
            logEvent("Game Completed", {
              attempts: gameState.attempts + 1,
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

  const requestHint = async () => {
    if (hintDisabled) return;

    const topRankedWord = sortedWords.find((word) => word.rank !== -1);
    let hintRank = 100;

    if (topRankedWord) {
      if (topRankedWord.rank <= 10) {
        setHintDisabled(true);
        return;
      }
      hintRank = Math.max(1, topRankedWord.rank - 10);
    }

    try {
      const hintResponse = await getHint(new Date(gameDate), hintRank);
      const newHintWord: SubmittedWord = {
        word: hintResponse.word,
        similarity: hintResponse.score,
        rank: hintRank,
        attempt: -1, // 힌트 단어는 attempt를 -1로 표시
        correct: false,
      };

      setGameState((prev) => ({
        ...prev,
        submittedWords: [newHintWord, ...prev.submittedWords],
      }));

      logEvent("Hint Requested", { hintRank });
    } catch (error) {
      console.error("힌트 요청 중 오류 발생:", error);
      toast({
        title: "힌트 요청 실패",
        description:
          "힌트를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return {
    inputWord,
    setInputWord,
    submittedWords: gameState.submittedWords,
    isLoading,
    attempts: gameState.attempts,
    gameCompleted: gameState.gameCompleted,
    isError,
    errorMessage,
    sortedWords,
    submitWord,
    hintDisabled,
    requestHint,
  };
}
