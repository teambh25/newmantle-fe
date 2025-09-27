import { useState, useRef, useEffect, useMemo } from "react";
import {
  submitWord as apiSubmitWord,
  SubmittedWord,
  getHint,
  getRecentAnswer,
} from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";

const STORAGE_KEY = "newmantle_game_data";

interface GameData {
  submittedWords: SubmittedWord[];
  attempts: number;
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
      gameCompleted: false,
      lastPlayedDate: new Date().toDateString(),
      hintUsed: 0,
      givenUp: false,
      initialConsonantHintUsed: false,
      answerSurveyVoted: null,
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
    hintUsed: 0,
    givenUp: false,
    initialConsonantHintUsed: false,
    answerSurveyVoted: null,
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
        if (error instanceof Error) {
          if (error.message === "Invalid word") {
            setErrorMessage("없는 단어입니다");
          } else if (error.message === "Invalid date format") {
            setErrorMessage("잘못된 날짜 형식입니다");
          } else {
            setErrorMessage("오류가 발생했습니다");
          }
        } else {
          setErrorMessage("오류가 발생했습니다");
        }
      } finally {
        setInputWord("");
        setIsLoading(false);
      }
    }
  };

  const requestHint = async () => {
    if (hintDisabled) return;

    // 순위가 있는 단어들 중 가장 높은 순위의 단어를 찾습니다.
    const topRankedWord = sortedWords.reduce((highest, current) => {
      if (current.rank === undefined || current.rank === -1) return highest;
      if (!highest || current.rank < highest.rank) return current;
      return highest;
    }, null as SubmittedWord | null);

    let hintRank: number;

    if (!topRankedWord || topRankedWord.rank === -1) {
      // 순위권 내 단어가 없으면 100위 단어를 힌트로 제공
      hintRank = 100;
    } else if (topRankedWord.rank <= 15) {
      // 최고 순위가 15위 이하면 힌트 버튼 비활성화 (5위까지의 여유를 둠)
      setHintDisabled(true);
      return;
    } else {
      // 현재 최고 순위보다 10 순위 높은 단어를 힌트로 제공
      hintRank = topRankedWord.rank - 10;
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

  const requestInitialConsonantHint = async () => {
    try {
      const hintResponse = await getHint(new Date(gameDate), 0);
      const newHintWord: SubmittedWord = {
        word:  hintResponse.hint,
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

      logEvent("Initial Consonant Hint Requested");
    } catch (error) {
      console.error("초성 힌트 요청 중 오류 발생:", error);
      toast({
        title: "초성 힌트 요청 실패",
        description:
          "초성 힌트를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const giveUp = async () => {
    try {
      const answer = await getRecentAnswer(new Date(gameDate));
      setGameState((prev) => ({
        ...prev,
        submittedWords: [
          {
            word: answer,
            similarity: 100,
            rank: 0,
            attempt: prev.attempts + 1,
            correct: true,
          },
          ...prev.submittedWords,
        ],
        gameCompleted: true,
        givenUp: true,
      }));
      logEvent("Game Given Up", {
        attempts: gameState.attempts,
        hintUsed: gameState.hintUsed,
      });
    } catch (error) {
      console.error("정답 가져오기 실패:", error);
      toast({
        title: "정답 가져오기 실패",
        description:
          "정답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
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
    hintUsed: gameState.hintUsed,
    givenUp: gameState.givenUp,
    giveUp,
    initialConsonantHintUsed: gameState.initialConsonantHintUsed,
    requestInitialConsonantHint,
    answerSurveyVoted: gameState.answerSurveyVoted,
    setAnswerSurveyVoted,
  };
}
