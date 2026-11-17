"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import WordTable, { VISIBLE_HISTORY_COUNT } from "./WordTable";
import ProgressCard from "./ProgressCard";
import TopBar from "./TopBar";
import ProgressViewToggle from "./ProgressViewToggle";
import { useProgressView } from "@/hooks/useProgressView";
import { GameForm } from "./GameForm";
import { FeedbackDialog, ResultDialog, ResultStrip } from "./GameResult";
import { REQUEST_ERROR_MESSAGES, useGameScreen } from "@/hooks/useGameScreen";
import { useShareLink } from "@/hooks/useShareLink";
import { useGameDate } from "@/hooks/useGameDate";
import { formatGameDate } from "@/utils/date";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";

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
  const [resultOpen, setResultOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 정답·포기 순간부터 결과창을 닫을 때까지 입력창 잠금 (요구사항 1)
  const [inputLocked, setInputLocked] = useState(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 방금 입력 자리 모양: 진행 상황 카드 / 상단바 (docs/specs/progress-view-toggle)
  const { view, setView, ready: viewReady } = useProgressView();
  // 게임 상태·게임판·임시 줄·결과 정보·실패 안내는 excel과 같이 쓰는 훅에서. classic만의 것은 결과창 모달 흐름
  const {
    game: gameLogic,
    board,
    result,
    submit,
    startRequest,
    requestError,
    clearRequestError,
  } = useGameScreen(gameDate, "classic", view);
  const { sharedAttempts, sharerHintCount, isLoadingSharerStats, share } = useShareLink({
    gameDate,
    attempts: gameLogic.correctAttempts,
    theme: "classic",
  });
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
    if (gameDate) {
      setDisplayDate(formatGameDate(gameDate));
    }
  }, [gameDate]);

  const gameOver = result.over;
  // 게이지 스위치: 표 머리줄 # 칸. 카드 모드는 기록 표, 상단바 모드는 상단바 (docs/specs/progress-view-toggle Dec-12)
  const toggle = <ProgressViewToggle view={view} onChange={setView} />;

  return (
    // PC는 게임 영역(결과 상자·단어 목록)을 480px로 가운데에, 입력창은 그보다 조금 좁은 420px. 모바일은 화면 폭 그대로 (docs/tasks/ui/input/plan.md 1)
    <div className="w-full max-w-2xl sm:max-w-[480px] sm:mx-auto">
      <div className="flex flex-col items-center mx-0">
        {gameOver && (
          <ResultDialog
            open={resultOpen}
            onOpenChange={handleResultOpenChange}
            givenUp={result.givenUp}
            attempts={result.attempts}
            answer={result.answer}
            onShare={share}
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
            const res = await submit(word);
            if (res.solved) openResultSoon();
            // 없는 단어·제출 실패는 목록 맨 위 임시 줄로(훅). 입력창은 없는 단어면 비우고 placeholder 안내, 실패면 단어를 남기고 빨간 배경 (docs/tasks/ui/input/plan.md 3)
            // 없는 단어: 안내는 카드 배너, 입력창은 비움 (오류로 돌려주지 않음, progress-card/plan.md 3)
            if (res.reason === "unknownWord") return {};
            if (res.reason === "failed") return { error: REQUEST_ERROR_MESSAGES.submit, tone: "error" };
            return res;
          }}
          gameCompleted={gameLogic.gameCompleted}
          displayDate={displayDate}
          reveal={board.reveal}
          showInputTooltip={showInputTooltip}
          onInputTooltipDone={onInputTooltipDone}
          requestError={requestError}
          onInputEdit={clearRequestError}
          inputLocked={inputLocked}
          statusBar={
            gameOver ? (
              <ResultStrip givenUp={result.givenUp} attempts={result.attempts} onReopen={() => setResultOpen(true)} />
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
        {/* 최소 높이는 카드 높이로 두 모양 같게: 전환해도 아래가 출렁이지 않는다 (progress-view-toggle Dec-6).
            저장값을 읽기 전에는 방금 입력 자리를 그리지 않는다 (Dec-5) */}
        <div className="w-full min-h-[130px]">
          {/* 방금 입력 칸 = 진행 상황 카드. 시작할 때도 바로 보여 준다 (docs/tasks/ui/progress-card/plan.md) */}
          {viewReady && view === "card" && (
            <ProgressCard
              latest={board.latest}
              best={board.best}
              end={board.end}
              error={requestError}
              attempts={gameLogic.attempts}
              words={gameLogic.submittedWords}
            />
          )}
          {/* 상단바: 요청 실패도 board.latest로 온다 (Dec-8) */}
          {viewReady && view === "bar" && <TopBar latest={board.latest} gaugeSwitch={toggle} />}
          {viewReady && (
            <WordTable
              history={board.history}
              showAll={showAllWords}
              underTopBar={view === "bar"}
              gaugeSwitch={view === "card" ? toggle : undefined}
            />
          )}
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
