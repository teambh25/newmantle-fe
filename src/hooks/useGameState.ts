import { useState, useRef, useEffect, useMemo } from "react";
import {
  submitWord as apiSubmitWord,
  SubmittedWord,
  getHint,
  getRecentAnswer,
} from "@/utils/api";
import { formatDate } from "@/utils/date";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";
import { triggerConfetti } from "@/utils/confetti";

const STORAGE_KEY = "newmantle_game_data";

function getTopRankedWord(words: SubmittedWord[]): SubmittedWord | null {
  return words.reduce((highest, current) => {
    if (current.rank === undefined || current.rank <= 0) return highest;
    if (!highest || current.rank < highest.rank) return current;
    return highest;
  }, null as SubmittedWord | null);
}

export interface GameData {
  submittedWords: SubmittedWord[];
  attempts: number;
  solvedAttempts: number | null;
  gameCompleted: boolean;
  lastPlayedDate: string;
  hintUsed: number;
  givenUp: boolean;
  initialConsonantHintUsed: boolean;
  answerSurveyVoted: boolean | null;
}

function getInitialGameState(): GameData {
  if (typeof window === "undefined") {
    return {
      submittedWords: [],
      attempts: 0,
      solvedAttempts: null,
      gameCompleted: false,
      lastPlayedDate: formatDate(new Date()),
      hintUsed: 0,
      givenUp: false,
      initialConsonantHintUsed: false,
      answerSurveyVoted: null,
    };
  }

  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const parsedData: GameData = JSON.parse(storedData);
    const today = formatDate(new Date());
    if (parsedData.lastPlayedDate === today) {
      return parsedData;
    }
  }

  return {
    submittedWords: [],
    attempts: 0,
    solvedAttempts: null,
    gameCompleted: false,
    lastPlayedDate: formatDate(new Date()),
    hintUsed: 0,
    givenUp: false,
    initialConsonantHintUsed: false,
    answerSurveyVoted: null,
  };
}

export function useGameState(gameDate: string, theme?: string) {
  const [gameState, setGameState] = useState<GameData>(getInitialGameState);
  const startTimeRef = useRef<number>(Date.now());
  const { toast } = useToast();

  useEffect(() => {
    logEvent("Game Started", { date: gameDate, theme });
  }, [gameDate, theme]);

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

  const hintDisabled = useMemo(() => {
    const topRankedWord = getTopRankedWord(sortedWords);
    return topRankedWord ? topRankedWord.rank <= 20 : false;
  }, [sortedWords]);

  const correctAttempts = useMemo(() => {
    const correctWord = gameState.submittedWords.find((word) => word.correct);
    return correctWord?.attempt ?? gameState.attempts;
  }, [gameState.submittedWords, gameState.attempts]);

  const submitWordAction = async (word: string): Promise<{ error?: string }> => {
    try {
      const existingWordIndex = gameState.submittedWords.findIndex(
        (w) => w.word.toLowerCase() === word.toLowerCase()
      );

      if (existingWordIndex !== -1) {
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
        return { error: "이미 제출한 단어입니다" };
      }

      const newWord = await apiSubmitWord(
        word,
        gameState.attempts + 1,
        gameDate
      );

      logEvent("Word Submitted", {
        word: word,
        attempt: gameState.attempts + 1,
        similarity: newWord.similarity,
        isCorrect: newWord.correct,
        theme,
      });

      setGameState((prev) => {
        const isCorrect = newWord.correct;
        const alreadyCompleted = prev.gameCompleted || prev.givenUp;
        const newSolvedAttempts = alreadyCompleted
          ? prev.solvedAttempts
          : (isCorrect ? prev.attempts + 1 : null);

        return {
          ...prev,
          submittedWords: [newWord, ...prev.submittedWords],
          attempts: prev.attempts + 1,
          gameCompleted: prev.gameCompleted || isCorrect,
          solvedAttempts: newSolvedAttempts,
        };
      });

      if (newWord.correct) {
        toast({
          title: "축하합니다!",
          description: `${gameState.attempts + 1}번째 시도에 정답을 맞히셨습니다.`,
        });
        logEvent("Game Completed", {
          attempts: gameState.attempts + 1,
          timeSpent: (Date.now() - startTimeRef.current) / 1000,
          theme,
        });
        if (!gameState.givenUp) {
          triggerConfetti();
        }
      }

      return {}; // success
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid guess request") {
          return { error: "없는 단어입니다" };
        } else if (error.message === "Invalid date format") {
          return { error: "잘못된 날짜 형식입니다" };
        }
      }
      return { error: "오류가 발생했습니다" };
    }
  };

  const requestHint = async () => {
    if (hintDisabled) return;

    const topRankedWord = getTopRankedWord(sortedWords);

    let hintRank: number;

    if (!topRankedWord || topRankedWord.rank === -1) {
      hintRank = 900;
    } else {
      const subtract = topRankedWord.rank > 100 ? 100 : 20;
      hintRank = Math.max(20, topRankedWord.rank - subtract);
    }

    try {
      const hintResponse = await getHint(new Date(gameDate), hintRank);
      const newHintWord: SubmittedWord = {
        word: hintResponse.hint,
        similarity: hintResponse.score,
        rank: hintRank,
        attempt: -1,
        correct: false,
      };

      setGameState((prev) => ({
        ...prev,
        submittedWords: [newHintWord, ...prev.submittedWords],
        hintUsed: prev.hintUsed + 1,
      }));

      logEvent("Hint Requested", { hintRank, theme });
    } catch (error) {
      console.error("힌트 요청 중 오류 발생:", error);
      toast({
        title: "힌트 요청 실패",
        description: "힌트를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const requestInitialConsonantHint = async () => {
    try {
      const hintResponse = await getHint(new Date(gameDate), 0);
      const newHintWord: SubmittedWord = {
        word: hintResponse.hint,
        similarity: hintResponse.score,
        rank: 0,
        attempt: -1,
        correct: false,
      };

      setGameState((prev) => ({
        ...prev,
        submittedWords: [newHintWord, ...prev.submittedWords],
        initialConsonantHintUsed: true,
      }));

      toast({
        title: "💪 정답 초성 힌트를 알려드릴게요! 거의 다 왔어요!",
        description: "",
      });

      logEvent("Initial Consonant Hint Requested", { theme });
    } catch (error) {
      console.error("초성 힌트 요청 중 오류 발생:", error);
      toast({
        title: "초성 힌트 요청 실패",
        description: "초성 힌트를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const giveUp = async () => {
    try {
      const answerData = await getRecentAnswer(new Date(gameDate));
      setGameState((prev) => {
        const currentAttempts = prev.attempts;
        return {
          ...prev,
          submittedWords: [
            {
              word: answerData.word,
              similarity: 100,
              rank: 0,
              attempt: currentAttempts + 1,
              correct: true,
              answer: answerData,
            },
            ...prev.submittedWords,
          ],
          gameCompleted: true,
          givenUp: true,
          solvedAttempts: prev.solvedAttempts ?? currentAttempts,
        };
      });
      logEvent("Game Given Up", {
        attempts: gameState.attempts,
        hintUsed: gameState.hintUsed,
        theme,
      });
    } catch (error) {
      console.error("정답 가져오기 실패:", error);
      toast({
        title: "정답 가져오기 실패",
        description: "정답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const setAnswerSurveyVoted = (voted: boolean | null) => {
    setGameState((prev) => ({
      ...prev,
      answerSurveyVoted: voted,
    }));
  };

  return {
    submittedWords: gameState.submittedWords,
    attempts: gameState.attempts,
    solvedAttempts: gameState.solvedAttempts,
    correctAttempts,
    gameCompleted: gameState.gameCompleted,
    sortedWords,
    submitWordAction,
    hintDisabled,
    requestHint,
    hintUsed: gameState.hintUsed,
    givenUp: gameState.givenUp,
    giveUp,
    initialConsonantHintUsed: gameState.initialConsonantHintUsed,
    requestInitialConsonantHint,
    answerSurveyVoted: gameState.answerSurveyVoted,
    setAnswerSurveyVoted,
  };
}
