"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import WordTable, { SELECTED_HEADER } from "./WordTable";
import { bestSimilarity, selectedCell } from "@/utils/excelSheet";
import { GameForm } from "./GameForm";
import { GameResult, resultRowCount } from "./GameResult";
import { FeedbackRow } from "./FeedbackRow";
import { RankChart } from "./RankChart";
import { ResultTabs, type SlotView } from "./ResultTabs";
import { TopBar } from "./TopBar";
import ProgressViewToggle from "./ProgressViewToggle";
import ProgressViewTooltip from "@/components/ProgressViewTooltip";
import { useProgressView } from "@/hooks/useProgressView";
import type { ExcelProgressView } from "@/utils/progressView";
import { REQUEST_ERROR_MESSAGES, useGameScreen } from "@/hooks/useGameScreen";
import { useShareLink } from "@/hooks/useShareLink";
import { useGameDate } from "@/hooks/useGameDate";
import { excelFileName } from "@/utils/date";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";

/** 기록 아래 빈 행 수 */
const SHEET_FILLER_ROWS = 30;

interface NewMantleFormProps {
  /** 보기 방식 말풍선 (docs/specs/progress-view-toggle Dec-27~40). 순서는 메인이 정한다 */
  showProgressViewTooltip?: boolean;
  onProgressViewTooltipDone?: () => void;
}

// excel 게임 화면. 게임 동작은 classic과 같은 훅(useGameScreen)을 쓰고, 시트 행으로 그린다 (docs/specs/excel-ui)
export default function NewMantleForm({ showProgressViewTooltip = false, onProgressViewTooltipDone }: NewMantleFormProps = {}) {
  const gameDate = useGameDate();
  // 결과 블록 아래 피드백 행. 보낸 뒤에도 접지 않는다 (Dec-5)
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 끝난 뒤 결과 자리에 결과와 그래프 중 무엇을 보일지. 끝나는 순간·다시 들어왔을 때는 결과 (Dec-53)
  const [view, setView] = useState<SlotView>("result");
  const [mounted, setMounted] = useState(false);
  // 방금 입력 자리: 순위 그래프 / 상단바. 저장값을 읽기 전에는 둘 다 그리지 않는다 (docs/specs/progress-view-toggle Dec-15, Dec-19, Dec-23)
  const { view: progressView, setView: setProgressView, ready: viewReady } = useProgressView("excel");
  const barMode = progressView === "bar";
  const {
    game: gameLogic,
    board,
    result,
    submit,
    startRequest,
    requestError,
    clearRequestError,
  } = useGameScreen(gameDate, "excel", barMode ? "bar" : "card");
  const { sharedAttempts, sharerHintCount, isLoadingSharerStats, share } = useShareLink({
    gameDate,
    attempts: gameLogic.correctAttempts,
  });

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (result.over) setView("result");
  }, [result.over]);
  // 그래프로 바꾸면 피드백 칸은 접는다
  const changeView = (next: SlotView) => {
    setView(next);
    if (next === "chart") setFeedbackOpen(false);
  };
  // 스위치를 켜면 끝난 뒤 탭이 생기고 결과부터 보인다 (Dec-20)
  const changeProgressView = (next: ExcelProgressView) => {
    if (next === "chart") setView("result");
    setProgressView(next);
    // 스위치를 누르면 보기 방식 말풍선도 끝난다 (progress-view-toggle Dec-31)
    onProgressViewTooltipDone?.();
  };

  // 행 번호: 결과 자리(진행 중엔 그래프, 끝나면 결과·그래프 전환) → 피드백 → 친구 비교 → 표 머리 → (상단바) → 기록.
  // classic처럼 입력줄 바로 아래 그래프, 그 아래 표 (Dec-53, Dec-57)
  // 상단바 모드는 그래프 대신 표 머리 아래 상단바, 끝난 뒤에도 탭 없이 결과만 (progress-view-toggle Dec-17, Dec-20)
  let row = 1;
  const tabsRow = result.over && !barMode ? row++ : null;
  const showResult = result.over && (barMode || view === "result");
  const resultRow = showResult ? row : null;
  if (resultRow !== null) row += resultRowCount(result.answer);
  const feedbackRow = showResult && feedbackOpen ? row++ : null;
  const chartRow = !showResult && !barMode && viewReady ? row++ : null;
  const competitiveRow = sharedAttempts !== null ? row++ : null;
  const headerRow = row++;
  const topBarRow = barMode && viewReady ? row++ : null;
  const historyStart = row;

  // 선택된 셀 = 방금 입력한 단어의 단어 칸. 상단바 모드는 상단바 행 (Dec-69, progress-view-toggle Dec-16, Dec-22)
  const selected = selectedCell(board.history, board.latest, progressView);
  const selectedIndex = selected?.in === "history" ? selected.index : -1;
  const cellAddress =
    selected?.in === "bar" && topBarRow !== null
      ? `B${topBarRow}`
      : selected?.in === "history"
        ? `B${historyStart + selected.index}`
        : "A1";
  const bestSim = bestSimilarity(gameLogic.submittedWords);

  return (
    <>
      {/* 열 머리 A~D. 선택된 셀의 열(B)을 강조 */}
      <div className="excel-row bg-[#f8f9fa] border-b border-[#d4d4d4] sticky top-0 z-10">
        <div className="excel-col-header border-b border-[#d4d4d4]"></div>
        <div className="excel-col-header border-b border-[#d4d4d4]">A</div>
        <div className={`excel-col-header border-b border-[#d4d4d4] ${selected ? SELECTED_HEADER : ""}`}>B</div>
        <div className="excel-col-header border-b border-[#d4d4d4]">C</div>
        <div className="excel-col-header border-b border-[#d4d4d4] border-r-0">D</div>
      </div>

      {/* 상태 표시줄 최고 유사도 (Dec-80) */}
      {mounted && bestSim !== null && document.getElementById("excel-best-similarity") &&
        createPortal(`최고 유사도 ${bestSim.toFixed(2)}`, document.getElementById("excel-best-similarity")!)}

      {/* 상태 표시줄 정보 칸: 끝나면 다음 퀴즈 안내 (Dec-75, Dec-79) */}
      {mounted && result.over && document.getElementById("excel-status-message") &&
        createPortal("새로운 퀴즈는 매일 밤 12시에 열려요", document.getElementById("excel-status-message")!)}

      {tabsRow !== null && <ResultTabs rowNumber={tabsRow} view={view} onChange={changeView} />}

      {resultRow !== null && (
        <GameResult
          startRow={resultRow}
          givenUp={result.givenUp}
          attempts={result.attempts}
          answer={result.answer}
          onShare={share}
          feedbackOpen={feedbackOpen}
          onFeedbackToggle={() => setFeedbackOpen((v) => !v)}
        />
      )}

      {feedbackRow !== null && <FeedbackRow rowNumber={feedbackRow} />}

      {chartRow !== null && (
        <RankChart
          rowNumber={chartRow}
          latest={board.latest}
          error={requestError}
          words={gameLogic.submittedWords}
          end={board.end}
        />
      )}

      {competitiveRow !== null && sharedAttempts !== null && (
        <div className="excel-row">
          <div className="sheet-cell-header">{competitiveRow}</div>
          <div className="excel-cell col-span-4 p-0 bg-white border-b border-[#d4d4d4]">
            <CompetitiveBar
              currentAttempts={result.attempts}
              sharedAttempts={sharedAttempts}
              sharedHintCount={sharerHintCount}
              isLoadingSharerStats={isLoadingSharerStats}
              theme="excel"
              gameCompleted={result.over}
            />
          </div>
        </div>
      )}

      {/* 리본 글꼴·크기 칸 자리의 시도 횟수 (Dec-59) */}
      {mounted && document.getElementById("excel-attempts-count") &&
        createPortal(gameLogic.attempts, document.getElementById("excel-attempts-count")!)}

      {mounted && document.getElementById("excel-formula-bar") && createPortal(
        <GameForm
          submitAction={async (word) => {
            const res = await submit(word);
            // 없는 단어: 안내는 방금 입력 행, 입력창은 비움. 실패: 단어를 남기고 안내 (classic과 같게)
            if (res.reason === "unknownWord") return {};
            if (res.reason === "failed") return { error: REQUEST_ERROR_MESSAGES.submit };
            return res;
          }}
          gameCompleted={gameLogic.gameCompleted}
          onInputEdit={clearRequestError}
          cellAddress={cellAddress}
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
              onGiveUp={startRequest(gameLogic.giveUp)}
              disabled={
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.giveUpPending
              }
              onInitialConsonantHint={startRequest(gameLogic.requestInitialConsonantHint)}
              initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
              fileName={excelFileName(gameDate)}
            />
          }
        />,
        document.getElementById("excel-formula-bar")!
      )}

      {/* 표 머리 */}
      <div className="excel-row bg-[#f3f2f1] text-[#444] font-bold text-sm text-center border-b border-[#d4d4d4]">
        <div className="sheet-cell-header">{headerRow}</div>
        {/* 시도 칸: 그래프 스위치 (Dec-18) */}
        <div className="excel-cell justify-center px-1">
          {viewReady && (
            <span className="relative inline-flex">
              <ProgressViewToggle view={progressView} onChange={changeProgressView} />
              {showProgressViewTooltip && onProgressViewTooltipDone && (
                <ProgressViewTooltip variant="excel" onDismiss={onProgressViewTooltipDone} />
              )}
            </span>
          )}
        </div>
        <div className="excel-cell justify-center">단어</div>
        <div className="excel-cell justify-center">순위</div>
        <div className="excel-cell justify-center border-r-0">유사도</div>
      </div>

      {topBarRow !== null && <TopBar rowNumber={topBarRow} latest={board.latest} selected={selected?.in === "bar"} />}

      <WordTable history={board.history} startIndex={historyStart} selectedIndex={selectedIndex} />

      {/* 시트 느낌용 빈 행: 마지막 행 바로 다음 번호부터 (Dec-13, Dec-72) */}
      {Array.from({ length: SHEET_FILLER_ROWS }, (_, i) => (
        <div key={`f${i}`} className="excel-row bg-white">
          <div className="sheet-cell-header">{historyStart + board.history.length + i}</div>
          <div className="excel-cell h-6 border-b-0"></div>
          <div className="excel-cell h-6 border-b-0"></div>
          <div className="excel-cell h-6 border-b-0"></div>
          <div className="excel-cell h-6 border-b-0"></div>
        </div>
      ))}
    </>
  );
}
