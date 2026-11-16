"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import WordTable, { VISIBLE_HISTORY_COUNT } from "./WordTable";
import ProgressCard from "./ProgressCard";
import { buildBoard } from "@/utils/board";
import { GameForm } from "./GameForm";
import { FeedbackDialog, ResultDialog, ResultStrip } from "./GameResult";
import { useGameState, type GameRequestKind } from "@/hooks/useGameState";
import { logEvent } from "@/utils/amplitude";
import { useGameDate } from "@/hooks/useGameDate";
import { formatGameDate } from "@/utils/date";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";
import { fetchSharerStats } from "@/utils/api";
import { createClient } from "@/utils/supabase/client";

/** 요청 실패 안내. 카드 배너에 짧게, 어떤 기능이 실패했는지만 (docs/tasks/ui/progress-card/plan.md 3) */
const REQUEST_ERROR_MESSAGES: Record<GameRequestKind | "submit", string> = {
  submit: "단어 제출 실패",
  hint: "힌트 실패",
  consonantHint: "초성 힌트 실패",
  giveUp: "포기 실패",
};
/** 어떤 요청이든 연속으로 이만큼 실패하면 서버 문제로 보고 토스트 (progress-card/plan.md 3) */
const SERVER_TROUBLE_FAILURES = 2;
/** 정답·포기 후 결과창을 여는 지연 (ms). 화면을 보며 정한다 */
const RESULT_OPEN_DELAY_MS = 700;

interface NewMantleFormProps {
  /** 첫 입력 유도 말풍선 (docs/tasks/ui/input/plan.md 2). 순서는 메인이 정한다 */
  showInputTooltip?: boolean;
  onInputTooltipDone?: () => void;
  /** 결과창 열림 상태를 메인에 알린다 (헤더 로그인 강조, docs/tasks/ui/result-box/plan.md 요구사항 8) */
  onResultOpenChange?: (open: boolean) => void;
}

export default function NewMantleForm({ showInputTooltip = false, onInputTooltipDone, onResultOpenChange }: NewMantleFormProps = {}) {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [sharedAttempts, setSharedAttempts] = useState<number | null>(null);
  const [sharerHintCount, setSharerHintCount] = useState<number | null>(null);
  const [isLoadingSharerStats, setIsLoadingSharerStats] = useState(false);
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  // 없는 단어·제출 실패를 목록 맨 위에 잠깐 보여 준다. 저장하지 않는다 (docs/tasks/ui/input/plan.md 3)
  const [submitNotice, setSubmitNotice] = useState<{ word: string; tone: "unknown" | "failed" } | null>(null);
  // 방금 다시 낸 이미 제출한 단어. 맨 위 줄이 이 단어일 때만 반복 아이콘 (docs/tasks/ui/input/plan.md 3)
  const [repeatedWord, setRepeatedWord] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 정답·포기 순간부터 결과창을 닫을 때까지 입력창 잠금 (요구사항 1)
  const [inputLocked, setInputLocked] = useState(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  // 힌트·초성 힌트·포기 실패 안내. 토스트 대신 입력창 아래에 띄운다 (docs/tasks/ui/input/plan.md 3)
  const [requestError, setRequestError] = useState<string | null>(null);
  // 연속 실패 수. 무엇이든 성공(목록 맨 위가 바뀜, 제출 응답)하면 0으로. 연속이면 서버 문제로 보고 토스트
  const failuresRef = useRef(0);
  const countFailure = () => {
    failuresRef.current += 1;
    if (failuresRef.current === SERVER_TROUBLE_FAILURES) {
      toast({ title: "서버와 연결이 원활하지 않아요", description: "잠시 후 다시 시도해 주세요.", variant: "destructive" });
    }
  };
  const gameLogic = useGameState(gameDate, "classic", {
    onRequestError: (kind) => {
      setRequestError(REQUEST_ERROR_MESSAGES[kind]);
      countFailure();
    },
  });
  // 새 요청을 시작하면 이전 실패 안내를 닫는다
  const startRequest = (request: () => void) => () => {
    setRequestError(null);
    request();
  };

  // 결과창은 정답·포기 그 순간에만 자동으로 연다. 꽃가루와 제목의 정답이 먼저 보이게 짧게 늦춘다 (docs/tasks/ui/result-box/plan.md 요구사항 1)
  const openResultSoon = () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    setInputLocked(true);
    resultTimerRef.current = setTimeout(() => setResultOpen(true), RESULT_OPEN_DELAY_MS);
  };
  // 어떤 방법으로 닫든(계속 플레이·X·바깥·ESC) 입력창을 다시 연다
  const handleResultOpenChange = (open: boolean) => {
    setResultOpen(open);
    if (!open) setInputLocked(false);
  };
  useEffect(() => () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
  }, []);
  useEffect(() => {
    onResultOpenChange?.(resultOpen);
  }, [resultOpen, onResultOpenChange]);

  // 피드백은 결과창을 닫고 연다 (모달을 겹치지 않는다, 요구사항 3)
  const openFeedback = () => {
    handleResultOpenChange(false);
    setFeedbackOpen(true);
  };
  // 이 피드백 창은 결과창에서만 열린다. 닫으면(보냈든 안 보냈든) 결과창으로 돌아간다 (docs/tasks/ui/feedback/decision.md Dec-18)
  const handleFeedbackOpenChange = (open: boolean) => {
    setFeedbackOpen(open);
    if (!open) setResultOpen(true);
  };

  useEffect(() => {
    // Read shared_attempts from URL search params on mount
    if (typeof window !== "undefined" && gameDate) {
      const params = new URLSearchParams(window.location.search);
      const sharedDate = params.get("game_date");
      
      // 공유된 링크의 날짜가 현재 게임 날짜와 다르면 무시
      if (sharedDate && sharedDate !== gameDate) {
        return;
      }

      const shared = params.get("shared_attempts");
      if (shared && !isNaN(parseInt(shared))) {
        setSharedAttempts(parseInt(shared));
      }

      const sharerType = params.get("sharer_type") as "guest" | "user" | null;
      const sharerId = params.get("sharer_id");
      const fetchDate = sharedDate ?? gameDate;
      if (sharerType && sharerId && fetchDate) {
        setIsLoadingSharerStats(true);
        fetchSharerStats(sharerType, sharerId, fetchDate)
          .then((stats) => setSharerHintCount(stats.hint_count))
          .catch(() => {})
          .finally(() => setIsLoadingSharerStats(false));
      }

      // 파라미터를 읽은 후 URL을 클린하게 정리
      if (params.has("shared_attempts") || params.has("sharer_id")) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [gameDate]);

  useEffect(() => {
    if (gameDate) {
      setDisplayDate(formatGameDate(gameDate));
    }
  }, [gameDate]);

  // 제목·방금 입력 칸·기록 표·게이지에 보일 것 (src/utils/board.ts)
  const gameOver = gameLogic.gameCompleted || gameLogic.givenUp;
  const board = buildBoard({
    words: gameLogic.submittedWords,
    gameCompleted: gameLogic.gameCompleted,
    givenUp: gameLogic.givenUp,
    attempts: gameLogic.attempts,
    // 제출 실패 배너 문구 (progress-card/plan.md 3)
    notice: submitNotice && {
      ...submitNotice,
      message: submitNotice.tone === "failed" ? REQUEST_ERROR_MESSAGES.submit : undefined,
    },
    pendingWord,
    repeatedWord,
  });

  // 목록 맨 위에 다른 줄이 올라오면(제출 결과, 이미 낸 단어, 힌트·초성·포기) 임시 줄을 내린다. 입력창에 글자를 칠 때는 남긴다
  const topWord = gameLogic.sortedWords[0];
  const topKey = topWord ? `${topWord.attempt}:${topWord.word}` : "";
  useEffect(() => {
    setSubmitNotice(null);
    failuresRef.current = 0;
  }, [topKey]);
  // 결과창 정보: 시도 횟수와 제출 기록에 저장된 정답 정보 (요구사항 6)
  const resultAttempts = gameLogic.solvedAttempts ?? gameLogic.correctAttempts;
  const answerInfo = gameLogic.sortedWords.find((w) => w.correct)?.answer ?? null;

  const handleCopyLink = async () => {
    const baseUrl = window.location.origin;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    let sharerId: string | null = null;
    let sharerType: "guest" | "user" = "guest";
    if (session?.user?.id) {
      sharerId = session.user.id;
      sharerType = "user";
    } else {
      sharerId = localStorage.getItem('newmantle_guest_id');
    }

    const utmParams = new URLSearchParams({
      utm_source: "newmantle",
      utm_medium: "share",
      utm_campaign: "game_completion",
      shared_attempts: gameLogic.correctAttempts.toString(),
      game_date: gameDate,
      ...(sharerId ? { sharer_type: sharerType, sharer_id: sharerId } : {}),
    });
    const link = `${baseUrl}?${utmParams.toString()}`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          url: link,
        });
        logEvent("Result Shared", {
          method: "Native Share",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
        return; // Success! No toast needed for native share.
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled the share, do nothing
          return;
        }
        // Fallback to clipboard if share failed
      }
    }

    navigator.clipboard.writeText(link).then(
      () => {
        toast({
          title: "링크가 복사되었습니다!",
          description: "친구들에게 공유해보세요.",
        });
        logEvent("Result Shared", {
          method: "Link Copy",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
          theme: "classic",
        });
      }
    );
  };

  return (
    // PC는 게임 영역(결과 상자·단어 목록)을 480px로 가운데에, 입력창은 그보다 조금 좁은 420px. 모바일은 화면 폭 그대로 (docs/tasks/ui/input/plan.md 1)
    <div className="w-full max-w-2xl sm:max-w-[480px] sm:mx-auto">
      <div className="flex flex-col items-center mx-0">
        {gameOver && (
          <ResultDialog
            open={resultOpen}
            onOpenChange={handleResultOpenChange}
            givenUp={gameLogic.givenUp}
            attempts={resultAttempts}
            answer={answerInfo}
            onShare={handleCopyLink}
            onFeedback={openFeedback}
          />
        )}
        <FeedbackDialog open={feedbackOpen} onOpenChange={handleFeedbackOpenChange} />

        {sharedAttempts !== null && (
          <CompetitiveBar
            currentAttempts={gameLogic.solvedAttempts ?? gameLogic.correctAttempts}
            sharedAttempts={sharedAttempts}
            sharedHintCount={sharerHintCount}
            isLoadingSharerStats={isLoadingSharerStats}
            theme="classic"
            gameCompleted={gameLogic.gameCompleted || gameLogic.givenUp}
          />
        )}

        <GameForm
          submitAction={async (word) => {
            setRequestError(null);
            setRepeatedWord(null);
            let isDone = false;
            const timer = setTimeout(() => {
              if (!isDone) setPendingWord(word);
            }, 300);
            const res = await gameLogic.submitWordAction(word);
            isDone = true;
            clearTimeout(timer);
            setPendingWord(null);
            // 임시 줄은 응답과 함께 바꾼다. 요청 전에 지우면 직전 단어가 방금 입력 칸으로 잠깐 돌아온다 (V-13)
            setSubmitNotice(null);
            if (res.solved) openResultSoon();
            // 없는 단어·제출 실패는 목록 맨 위 임시 줄로. 입력창은 없는 단어면 비우고 placeholder 안내, 실패면 단어를 남기고 빨간 배경 (docs/tasks/ui/input/plan.md 3)
            if (res.reason === "duplicate") setRepeatedWord(word);
            // 없는 단어: 안내는 카드 배너, 입력창은 비움 (오류로 돌려주지 않음, progress-card/plan.md 3)
            if (res.reason === "unknownWord") {
              setSubmitNotice({ word, tone: "unknown" });
              return {};
            }
            if (res.reason !== "failed") failuresRef.current = 0;
            if (res.reason === "failed") {
              countFailure();
              setSubmitNotice({ word, tone: "failed" });
              return { error: REQUEST_ERROR_MESSAGES.submit, tone: "error" };
            }
            return res;
          }}
          gameCompleted={gameLogic.gameCompleted}
          displayDate={displayDate}
          reveal={board.reveal}
          showInputTooltip={showInputTooltip}
          onInputTooltipDone={onInputTooltipDone}
          requestError={requestError}
          onInputEdit={() => setRequestError(null)}
          inputLocked={inputLocked}
          statusBar={
            gameOver ? (
              <ResultStrip givenUp={gameLogic.givenUp} attempts={resultAttempts} onReopen={() => setResultOpen(true)} />
            ) : null
          }
          hintButton={
            <HintButton
              onHintRequest={startRequest(gameLogic.requestHint)}
              disabled={
                gameLogic.hintDisabled ||
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.hintPending
              }
            />
          }
          giveUpButton={
            <GiveUpButton
              onGiveUp={startRequest(async () => {
                if (await gameLogic.giveUp()) openResultSoon();
              })}
              disabled={
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.giveUpPending
              }
              onInitialConsonantHint={startRequest(gameLogic.requestInitialConsonantHint)}
              initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
            />
          }
        />

        {/* 표 자리를 미리 잡지 않는다: 푸터는 화면 맨 아래에 있다가 목록이 거기까지 자라면 밀려 내려간다 (docs/tasks/ui/word-list/plan.md 5) */}
        <div className="w-full">
          {/* 방금 입력 칸 = 진행 상황 카드. 시작할 때도 바로 보여 준다 (docs/tasks/ui/progress-card/plan.md) */}
          <ProgressCard
            latest={board.latest}
            best={board.best}
            end={board.end}
            error={requestError}
            attempts={gameLogic.attempts}
            words={gameLogic.submittedWords}
          />
          <WordTable history={board.history} showAll={showAllWords} />
          {board.history.length > VISIBLE_HISTORY_COUNT && (
            <div className="text-center mt-4">
              <Button
                onClick={() => setShowAllWords(!showAllWords)}
                variant="outline"
              >
                {showAllWords ? "접기" : "더보기"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
