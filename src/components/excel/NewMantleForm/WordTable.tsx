import React from "react";
import { SubmittedWord } from "@/utils/api";

/** 순위 글씨 색. 정답은 null */
export function rankStyle(rank: number | null) {
  if (rank === null) return "text-[#217346] font-bold";
  if (rank === -1) return "text-gray-400";
  if (rank <= 10) return "text-[#217346] font-bold bg-[#e6f2ea]";
  if (rank <= 100) return "text-[#217346] font-semibold";
  return "text-gray-600";
}

interface WordTableProps {
  /** 기록: 순위를 아는 단어(입력·힌트) 전부, 순위순. 초성·정답은 빠져 있다 (src/utils/board.ts) */
  history: SubmittedWord[];
  startIndex: number;
  /** 선택된 셀(방금 입력한 단어)의 줄. 없으면 -1 */
  selectedIndex: number;
}

/** 선택된 행 머리·열 머리: 엑셀처럼 옅은 녹색 바탕 + 녹색 글자 (Dec-69) */
export const SELECTED_HEADER = "!bg-[#d3f0e0] !text-[#217346] font-bold";

const WordTable: React.FC<WordTableProps> = ({ history, startIndex, selectedIndex }) => {
  // 접지 않고 전부 보여 준다. 시트 안에서 스크롤한다 (specs/excel-ui Dec-72)
  const displayed = history;

  return (
    <>
      {displayed.map((word, index) => {
        const selected = index === selectedIndex;
        return (
        <div key={`${word.attempt}:${word.word}`} className="excel-row text-sm sm:text-base hover:bg-[#f3f2f1] transition-colors">
          <div className={`sheet-cell-header ${selected ? SELECTED_HEADER : ""}`}>{index + startIndex}</div>
          <div className="excel-cell justify-center text-center">
            {/* 힌트로 받은 단어는 시도 번호 대신 "힌트" (specs/excel-ui Dec-77) */}
            {word.attempt === -1 ? <span className="text-[13px] text-gray-500">힌트</span> : word.attempt}
          </div>
          {/* 선택된 셀: 녹색 테두리 + 오른쪽 아래 채우기 핸들 (Dec-69) */}
          <div
            className={`excel-cell justify-center text-center whitespace-nowrap relative ${
              selected ? "outline outline-2 outline-[#217346] -outline-offset-2 bg-white z-[1]" : "overflow-hidden text-ellipsis"
            }`}
          >
            <span className="overflow-hidden text-ellipsis">{word.word}</span>
            {selected && (
              <span className="absolute -right-[3px] -bottom-[3px] w-[6px] h-[6px] bg-[#217346] border border-white" aria-hidden="true" />
            )}
          </div>
          <div className={`excel-cell justify-center text-center ${rankStyle(word.rank)}`}>
            {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
          </div>
          <div className={`excel-cell justify-center text-center ${rankStyle(word.rank)}`}>
            {word.similarity !== null && word.similarity !== undefined ? word.similarity.toFixed(2) : "N/A"}
          </div>
        </div>
        );
      })}
    </>
  );
};

export default WordTable;
