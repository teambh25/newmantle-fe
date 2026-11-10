import { useState, useRef, useEffect, useMemo } from "react";
import {
  submitWord as apiSubmitWord,
  SubmittedWord,
  getHint,
  getRecentAnswer,
} from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";
import { triggerConfetti } from "@/utils/confetti";
import { getKSTDateString } from "@/utils/date";
import { getNextHintRank, getTopRank, isHintDisabled } from "@/utils/gameRules";

const STORAGE_KEY = "newmantle_game_data";

function findWordIndex(words: SubmittedWord[], word: string): number {
  const target = word.toLowerCase();
  return words.findIndex((w) => w.word.toLowerCase() === target);
}

function moveWordToTop(words: SubmittedWord[], index: number): SubmittedWord[] {
  return [words[index], ...words.filter((_, i) => i !== index)];
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

function createEmptyGameState(): GameData {
  return {
    submittedWords: [],
    attempts: 0,
    solvedAttempts: null,
    gameCompleted: false,
    // 퀴즈 날짜(KST)와 같은 기준으로 저장해야 해외 접속 시에도 올바른 날에 리셋된다.
    lastPlayedDate: getKSTDateString(),
    hintUsed: 0,
    givenUp: false,
    initialConsonantHintUsed: false,
    answerSurveyVoted: null,
  };
}

function getInitialGameState(): GameData {
  if (typeof window === "undefined") {
    return createEmptyGameState();
  }

  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const parsedData: GameData = JSON.parse(storedData);
    const today = getKSTDateString();
    if (parsedData.lastPlayedDate === today) {
      return parsedData;
    }
    // 이전 버전은 lastPlayedDate를 로컬 toDateString()으로 저장했다.
    // 배포 당일 진행 중이던 기록이 날아가지 않도록 한 번만 새 형식으로 이어받는다.
    if (parsedData.lastPlayedDate === new Date().toDateString()) {
      return { ...parsedData, lastPlayedDate: today };
    }
  }

  return createEmptyGameState();
}

export function useGameState(gameDate: string, theme?: string) {
  const [gameState, setGameState] = useState<GameData>(getInitialGameState);
  const startTimeRef = useRef<number>(Date.now());
  const { toast } = useToast();

  // 요청 중 잠금 (D-2). ref는 같은 틱 안의 연속 호출을 막고, state는 버튼 비활성에 쓴다.
  // 초성 힌트와 포기는 같은 버튼이므로 하나의 잠금을 공유한다.
  const hintPendingRef = useRef(false);
  const giveUpPendingRef = useRef(false);
  const [hintPending, setHintPending] = useState(false);
  const [giveUpPending, setGiveUpPending] = useState(false);

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

  const hintDisabled = useMemo(
    () => isHintDisabled(getTopRank(gameState.submittedWords)),
    [gameState.submittedWords]
  );

  const correctAttempts = useMemo(() => {
    const correctWord = gameState.submittedWords.find((word) => word.correct);
    return correctWord?.attempt ?? gameState.attempts;
  }, [gameState.submittedWords, gameState.attempts]);

  const submitWordAction = async (word: string): Promise<{ error?: string }> => {
    try {
      if (findWordIndex(gameState.submittedWords, word) !== -1) {
        setGameState((prev) => {
          // 인덱스는 최신 상태(prev) 기준으로 다시 계산한다.
          const index = findWordIndex(prev.submittedWords, word);
          if (index === -1) return prev;
          return {
            ...prev,
            submittedWords: moveWordToTop(prev.submittedWords, index),
          };
        });
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
          hintUsed: gameState.hintUsed,
          initialConsonantHintUsed: gameState.initialConsonantHintUsed,
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
    if (hintDisabled || hintPendingRef.current) return;

    // 힌트는 항상 현재 최고 순위보다 높게 주므로, 받은 힌트 단어도 다음 기준이 된다 (A-7).
    const hintRank = getNextHintRank(getTopRank(gameState.submittedWords));

    hintPendingRef.current = true;
    setHintPending(true);
    try {
      const hintResponse = await getHint(gameDate, hintRank);
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
    } finally {
      hintPendingRef.current = false;
      setHintPending(false);
    }
  };

  const requestInitialConsonantHint = async () => {
    // 하루 1회 (B-5). 포기와 잠금을 공유한다 (D-2).
    if (gameState.initialConsonantHintUsed || giveUpPendingRef.current) return;

    giveUpPendingRef.current = true;
    setGiveUpPending(true);
    try {
      const hintResponse = await getHint(gameDate, 0);
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
    } finally {
      giveUpPendingRef.current = false;
      setGiveUpPending(false);
    }
  };

  const giveUp = async () => {
    if (gameState.gameCompleted || gameState.givenUp || giveUpPendingRef.current) {
      return;
    }

    giveUpPendingRef.current = true;
    setGiveUpPending(true);
    try {
      const answerData = await getRecentAnswer(gameDate);
      setGameState((prev) => {
        const currentAttempts = prev.attempts;
        return {
          ...prev,
          submittedWords: [
            {
              word: answerData.word,
              similarity: 100,
              rank: 0,
              // 포기는 입력이 아니므로 +1 하지 않는다 (C-4).
              attempt: currentAttempts,
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
        initialConsonantHintUsed: gameState.initialConsonantHintUsed,
        theme,
      });
    } catch (error) {
      console.error("정답 가져오기 실패:", error);
      toast({
        title: "정답 가져오기 실패",
        description: "정답을 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      giveUpPendingRef.current = false;
      setGiveUpPending(false);
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
    hintPending,
    hintUsed: gameState.hintUsed,
    givenUp: gameState.givenUp,
    giveUp,
    giveUpPending,
    initialConsonantHintUsed: gameState.initialConsonantHintUsed,
    requestInitialConsonantHint,
    answerSurveyVoted: gameState.answerSurveyVoted,
    setAnswerSurveyVoted,
  };
}
