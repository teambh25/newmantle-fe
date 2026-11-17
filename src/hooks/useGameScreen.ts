"use client";
// 게임 화면 상태: 게임 상태(useGameState) + 제출 중 줄, 없는 단어·실패 임시 줄, 반복 표시, 게임판 계산,
// 결과 정보, 실패 안내와 연속 실패 토스트. classic·excel이 같이 쓰고, 어떻게 그릴지만 테마가 정한다
// (docs/specs/excel-ui Dec-2, Dec-7, Dec-30, Dec-31)
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useGameState, type GameRequestKind } from "@/hooks/useGameState";
import { buildBoard, type SubmitNotice } from "@/utils/board";

/** 요청 실패 안내. 짧게, 어떤 기능이 실패했는지만 (docs/tasks/ui/progress-card/plan.md 3) */
export const REQUEST_ERROR_MESSAGES: Record<GameRequestKind | "submit", string> = {
  submit: "단어 제출 실패",
  hint: "힌트 실패",
  consonantHint: "초성 힌트 실패",
  giveUp: "포기 실패",
};
/** 어떤 요청이든 연속으로 이만큼 실패하면 서버 문제로 보고 토스트 (progress-card/plan.md 3) */
const SERVER_TROUBLE_FAILURES = 2;
/** 응답이 이보다 늦으면 제출 중 줄을 보여 준다 (ms) */
const PENDING_DELAY_MS = 300;

/** view: classic 방금 입력 자리 모양 (docs/specs/progress-view-toggle Dec-7). excel은 카드 계산 그대로 */
export function useGameScreen(gameDate: string, theme: "classic" | "excel", view: "card" | "bar" = "card") {
  const { toast } = useToast();
  // 힌트·초성 힌트·포기 실패 안내. 토스트 대신 화면 안에 띄운다 (docs/tasks/ui/input/plan.md 3)
  const [requestError, setRequestError] = useState<string | null>(null);
  // 연속 실패 수. 무엇이든 성공(목록 맨 위가 바뀜, 제출 응답)하면 0으로. 연속이면 서버 문제로 보고 토스트
  const failuresRef = useRef(0);
  const countFailure = () => {
    failuresRef.current += 1;
    if (failuresRef.current === SERVER_TROUBLE_FAILURES) {
      toast({ title: "서버와 연결이 원활하지 않아요", description: "잠시 후 다시 시도해 주세요.", variant: "destructive" });
    }
  };
  const game = useGameState(gameDate, theme, {
    onRequestError: (kind) => {
      setRequestError(REQUEST_ERROR_MESSAGES[kind]);
      countFailure();
    },
  });

  const [pendingWord, setPendingWord] = useState<string | null>(null);
  // 없는 단어·제출 실패를 목록 맨 위에 잠깐 보여 준다. 저장하지 않는다 (docs/tasks/ui/input/plan.md 3)
  const [submitNotice, setSubmitNotice] = useState<Omit<SubmitNotice, "message"> | null>(null);
  // 방금 다시 낸 이미 제출한 단어. 맨 위 줄이 이 단어일 때만 반복 아이콘 (docs/tasks/ui/input/plan.md 3)
  const [repeatedWord, setRepeatedWord] = useState<string | null>(null);

  /** 단어 제출. 결과는 useGameState의 제출 결과 그대로 돌려준다 */
  const submit = async (word: string) => {
    setRequestError(null);
    setRepeatedWord(null);
    let isDone = false;
    const timer = setTimeout(() => {
      if (!isDone) setPendingWord(word);
    }, PENDING_DELAY_MS);
    const res = await game.submitWordAction(word);
    isDone = true;
    clearTimeout(timer);
    setPendingWord(null);
    // 임시 줄은 응답과 함께 바꾼다. 요청 전에 지우면 직전 단어가 방금 입력 칸으로 잠깐 돌아온다
    setSubmitNotice(null);
    if (res.reason === "duplicate") setRepeatedWord(word);
    if (res.reason === "unknownWord") {
      setSubmitNotice({ word, tone: "unknown" });
      return res;
    }
    if (res.reason === "failed") {
      countFailure();
      setSubmitNotice({ word, tone: "failed" });
    } else {
      failuresRef.current = 0;
    }
    return res;
  };

  /** 힌트·초성 힌트·포기 버튼용. 새 요청을 시작하면 이전 실패 안내를 닫는다 */
  const startRequest = (request: () => void) => () => {
    setRequestError(null);
    request();
  };

  // 목록 맨 위에 다른 줄이 올라오면(제출 결과, 이미 낸 단어, 힌트·초성·포기) 임시 줄을 내리고 연속 실패 수를 0으로.
  // 입력창에 글자를 칠 때는 남긴다
  const topWord = game.sortedWords[0];
  const topKey = topWord ? `${topWord.attempt}:${topWord.word}` : "";
  useEffect(() => {
    setSubmitNotice(null);
    failuresRef.current = 0;
  }, [topKey]);

  // 제목·방금 입력 칸·기록 표·게이지에 보일 것 (src/utils/board.ts)
  const board = buildBoard({
    words: game.submittedWords,
    gameCompleted: game.gameCompleted,
    givenUp: game.givenUp,
    attempts: game.attempts,
    notice: submitNotice && {
      ...submitNotice,
      message: submitNotice.tone === "failed" ? REQUEST_ERROR_MESSAGES.submit : undefined,
    },
    pendingWord,
    repeatedWord,
    view,
    requestError,
  });

  // 결과 정보: 시도 횟수와 제출 기록에 저장된 정답 정보 (docs/tasks/ui/result-box/plan.md 요구사항 6)
  const result = {
    over: game.gameCompleted || game.givenUp,
    givenUp: game.givenUp,
    attempts: game.solvedAttempts ?? game.correctAttempts,
    answer: game.sortedWords.find((w) => w.correct)?.answer ?? null,
  };

  return {
    game,
    board,
    result,
    submit,
    startRequest,
    requestError,
    clearRequestError: () => setRequestError(null),
  };
}
