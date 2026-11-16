"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import WordTable, { SELECTED_HEADER } from "./WordTable";
import { latestHistoryIndex, sheetStats } from "@/utils/excelSheet";
import { GameForm } from "./GameForm";
import { GameResult, resultRowCount } from "./GameResult";
import { FeedbackRow } from "./FeedbackRow";
import { RankChart } from "./RankChart";
import { ResultTabs, type SlotView } from "./ResultTabs";
import { REQUEST_ERROR_MESSAGES, useGameScreen } from "@/hooks/useGameScreen";
import { useShareLink } from "@/hooks/useShareLink";
import { useGameDate } from "@/hooks/useGameDate";
import { excelFileName } from "@/utils/date";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";

/** 기록 아래 빈 행 수 */
const SHEET_FILLER_ROWS = 30;

// excel 게임 화면. 게임 동작은 classic과 같은 훅(useGameScreen)을 쓰고, 시트 행으로 그린다 (specs/excel-ui)
export default function NewMantleForm() {
  const gameDate = useGameDate();
  // 결과 블록 아래 피드백 행. 보낸 뒤에도 접지 않는다 (Dec-5)
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 끝난 뒤 결과 자리에 결과와 그래프 중 무엇을 보일지. 끝나는 순간·다시 들어왔을 때는 결과 (Dec-53)
  const [view, setView] = useState<SlotView>("result");
  const [mounted, setMounted] = useState(false);
  const {
    game: gameLogic,
    board,
    result,
    submit,
    startRequest,
    requestError,
    clearRequestError,
  } = useGameScreen(gameDate, "excel");
  const { sharedAttempts, sharerHintCount, isLoadingSharerStats, share } = useShareLink({
    gameDate,
    attempts: gameLogic.correctAttempts,
    theme: "excel",
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

  // 행 번호: 결과 자리(진행 중엔 그래프, 끝나면 결과·그래프 전환) → 피드백 → 친구 비교 → 표 머리 → 기록.
  // classic처럼 입력줄 바로 아래 그래프, 그 아래 표 (Dec-53, Dec-57)
  let row = 1;
  const tabsRow = result.over ? row++ : null;
  const showResult = result.over && view === "result";
  const resultRow = showResult ? row : null;
  if (resultRow !== null) row += resultRowCount(result.answer);
  const feedbackRow = showResult && feedbackOpen ? row++ : null;
  const chartRow = showResult ? null : row++;
  const competitiveRow = sharedAttempts !== null ? row++ : null;
  const headerRow = row++;
  const historyStart = row;

  // 선택된 셀 = 방금 입력한 단어의 단어 칸 (Dec-69)
  const latestIndex = latestHistoryIndex(board.history, board.latest);
  const selectedIndex = latestIndex;
  const cellAddress = selectedIndex >= 0 ? `B${historyStart + selectedIndex}` : "A1";
  const stats = sheetStats(board.history, gameLogic.attempts);

  return (
    <>
      {/* 열 머리 A~D. 선택된 셀의 열(B)을 강조 */}
      <div className="excel-row bg-[#f8f9fa] border-b border-[#d4d4d4] sticky top-0 z-10">
        <div className="excel-col-header border-b border-[#d4d4d4]"></div>
        <div className="excel-col-header border-b border-[#d4d4d4]">A</div>
        <div className={`excel-col-header border-b border-[#d4d4d4] ${selectedIndex >= 0 ? SELECTED_HEADER : ""}`}>B</div>
        <div className="excel-col-header border-b border-[#d4d4d4]">C</div>
        <div className="excel-col-header border-b border-[#d4d4d4] border-r-0">D</div>
      </div>

      {/* 상태 표시줄 상태 메시지: 끝나면 다음 퀴즈 안내 (Dec-75) */}
      {mounted && result.over && document.getElementById("excel-status-message") &&
        createPortal("다음 퀴즈: 오늘 밤 12시", document.getElementById("excel-status-message")!)}

      {/* 상태 표시줄 통계 (Dec-68) */}
      {mounted && stats.count > 0 && document.getElementById("excel-status-stats") &&
        createPortal(
          <>
            <span>개수: {stats.count}</span>
            {stats.best !== null && <span>최고: {stats.best}위</span>}
            {stats.average !== null && <span>평균: {stats.average}위</span>}
          </>,
          document.getElementById("excel-status-stats")!,
        )}
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
        <div className="excel-cell justify-center">시도</div>
        <div className="excel-cell justify-center">단어</div>
        <div className="excel-cell justify-center">순위</div>
        <div className="excel-cell justify-center border-r-0">유사도</div>
      </div>

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
