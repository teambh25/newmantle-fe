import React from "react";
import { CircleAlert, Flag, Lightbulb, Loader2, Repeat } from "lucide-react";
import type { LatestRow } from "@/utils/board";
import { rankStyle, SelectedWordCell, SELECTED_HEADER } from "./WordTable";

// excel 상단바: 표 머리 바로 아래 시트 한 행. 방금 입력은 선택된 셀 테두리로 드러나 굵은 선은 두지 않는다 (Dec-25). 그래프 제목과 같은 latest를 보여 준다
// (docs/specs/progress-view-toggle Dec-15, Dec-16, Dec-17)

const icon = "h-4 w-4";
const GREEN = "text-[#217346]";

function Mark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span role="img" aria-label={label} className="inline-flex justify-center">
      {children}
    </span>
  );
}

const cell = "excel-cell justify-center text-center";
const formatSimilarity = (s: number | null | undefined) => (s !== null && s !== undefined ? s.toFixed(2) : "N/A");

/** 시도·단어 뒤 칸들. 숫자 대신 상태가 오면 순위·유사도 칸을 합친다 */
function Cells({ row, selected }: { row: LatestRow; selected: boolean }) {
  const word = (text: string, className = "") => (
    <SelectedWordCell role="cell" selected={selected} className={className}>
      {text}
    </SelectedWordCell>
  );

  if (row.kind === "pending") {
    return (
      <>
        <div role="cell" className={`${cell} text-gray-400`}>{row.attempt}</div>
        {word(row.word, "text-gray-400")}
        <div role="cell" className={cell}><Loader2 className={`${icon} animate-spin text-gray-400`} aria-hidden="true" /></div>
        <div role="cell" className={cell}><Loader2 className={`${icon} animate-spin text-gray-400`} aria-hidden="true" /></div>
      </>
    );
  }
  if (row.kind === "notice") {
    if (row.tone === "failed") {
      // 요청 실패: 문구만 (어떤 단어인지는 입력줄에 남아 있다, Dec-8)
      return (
        <>
          <div role="cell" className={cell}><CircleAlert className={`${icon} text-red-600`} aria-hidden="true" /></div>
          <div role="cell" className={`${cell} col-span-3`}>
            <span role="alert" className="font-medium text-red-600">{row.message}</span>
          </div>
        </>
      );
    }
    const marker =
      row.tone === "answer" ? row.attempt
      : row.tone === "consonant" ? <Mark label="초성 힌트"><Lightbulb className={`${icon} text-yellow-600`} aria-hidden="true" /></Mark>
      : row.tone === "givenUp" ? <Mark label="포기"><Flag className={`${icon} text-gray-500`} aria-hidden="true" /></Mark>
      : null;
    const result =
      row.tone === "unknown" ? <span className="text-gray-400">미등록 단어</span>
      : row.tone === "consonant" ? <span className={GREEN}>정답(초성)</span>
      : row.tone === "answer" ? <span className={`font-bold ${GREEN}`}>정답</span>
      : <span className="text-gray-500">정답</span>;
    const wordTone =
      row.tone === "consonant" || row.tone === "answer" ? `font-bold ${GREEN}` : row.tone === "givenUp" ? "font-bold text-gray-600" : "";
    return (
      <>
        <div role="cell" className={cell}>{marker}</div>
        {word(row.word, wordTone)}
        <div role="cell" className={`${cell} col-span-2`}>{result}</div>
      </>
    );
  }
  const w = row.word;
  return (
    <>
      <div role="cell" className={cell}>
        {row.isRepeat ? (
          <Mark label="이미 입력한 단어"><Repeat className={`${icon} text-gray-600`} aria-hidden="true" /></Mark>
        ) : w.attempt === -1 ? (
          <Mark label="힌트로 받은 단어"><Lightbulb className={`${icon} text-yellow-600`} aria-hidden="true" /></Mark>
        ) : (
          w.attempt
        )}
      </div>
      {word(w.word)}
      <div role="cell" className={`${cell} ${rankStyle(w.rank)}`}>{w.rank === -1 ? "순위 밖" : `${w.rank}위`}</div>
      <div role="cell" className={`${cell} ${rankStyle(w.rank)}`}>{formatSimilarity(w.similarity)}</div>
    </>
  );
}

interface TopBarProps {
  rowNumber: number;
  /** 방금 항목. 아직 아무것도 안 했으면 null (빈 행) */
  latest: LatestRow | null;
  /** 선택된 셀이 이 행의 단어 칸인지 (Dec-16) */
  selected: boolean;
}

export function TopBar({ rowNumber, latest, selected }: TopBarProps) {
  return (
    <div role="table" aria-label="방금 입력">
      <div role="row" className="excel-row text-sm sm:text-base bg-white">
        <div role="rowheader" className={`sheet-cell-header ${selected ? SELECTED_HEADER : ""}`}>{rowNumber}</div>
        {latest ? (
          <Cells row={latest} selected={selected} />
        ) : (
          <>
            <div role="cell" className="excel-cell"></div>
            <div role="cell" className="excel-cell"></div>
            <div role="cell" className="excel-cell"></div>
            <div role="cell" className="excel-cell"></div>
          </>
        )}
      </div>
    </div>
  );
}
