import React from "react";
import { MessageSquare, Share2 } from "lucide-react";
import type { AnswerData } from "@/utils/api";

// 결과 블록: 엑셀 레코드처럼 "항목 | 값" 행. 항목은 시도 칸, 값은 단어 칸 (docs/specs/excel-ui Dec-74)
// 순서: 정답 → 예문([분류] 예문) → 시도 횟수 → 공유 → 피드백. 정답 글자는 맞힘 녹색, 포기 회색 + (포기)

interface GameResultProps {
  /** 첫 행 번호 */
  startRow: number;
  givenUp: boolean;
  attempts: number;
  answer: AnswerData | null;
  onShare: () => void;
  feedbackOpen: boolean;
  onFeedbackToggle: () => void;
}

/** 결과 블록이 차지하는 행 수 */
export function resultRowCount(answer: AnswerData | null) {
  return 4 + (answer?.tag || answer?.description ? 1 : 0);
}

/** 항목 | 값 한 행. 모바일은 값 칸이 좁아서 순위·유사도 칸까지 넓힌다 (Dec-44) */
function Row({ row, label, children, valueClass = "" }: { row: number; label: string; children: React.ReactNode; valueClass?: string }) {
  return (
    <div className="excel-row">
      <div className="sheet-cell-header">{row}</div>
      <div className="excel-cell justify-center text-center text-[13px] text-gray-500 bg-[#f8f9fa] whitespace-nowrap">{label}</div>
      <div className={`excel-cell max-sm:col-span-3 !h-auto min-w-0 text-sm ${valueClass}`}>{children}</div>
      <div className="excel-cell max-sm:hidden" />
      <div className="excel-cell max-sm:hidden" />
    </div>
  );
}

/** 엑셀 하이퍼링크처럼 파란 밑줄. 칸 전체가 누르는 영역 */
const LINK_CELL = "!p-0";
const LINK =
  "w-full h-full min-h-[40px] flex items-center gap-1.5 px-3 text-left text-[13px] text-[#0563c1] underline underline-offset-2 hover:bg-[#e5f1fb]";

export function GameResult({ startRow, givenUp, attempts, answer, onShare, feedbackOpen, onFeedbackToggle }: GameResultProps) {
  let row = startRow;
  const explanation = [answer?.tag ? `[${answer.tag}]` : null, answer?.description].filter(Boolean).join(" ");

  return (
    <>
      <Row row={row++} label="정답">
        <span className={`font-bold ${givenUp ? "text-gray-600" : "text-[#217346]"}`}>{answer?.word ?? ""}</span>
        {/* 맞힘/포기 구분: 포기했을 때만 작은 회색 (포기) */}
        {givenUp && <span className="ml-1.5 text-xs text-gray-400">(포기)</span>}
      </Row>
      {explanation && (
        <Row row={row++} label="예문" valueClass="py-2 text-[13px] text-gray-700 break-keep whitespace-normal">
          {explanation}
        </Row>
      )}
      <Row row={row++} label="시도 횟수">
        {attempts}회
      </Row>
      <Row row={row++} label="공유" valueClass={LINK_CELL}>
        <button type="button" onClick={onShare} className={LINK}>
          <Share2 size={12} className="shrink-0" aria-hidden="true" />
          링크 복사
        </button>
      </Row>
      <Row row={row++} label="피드백" valueClass={LINK_CELL}>
        <button type="button" onClick={onFeedbackToggle} aria-expanded={feedbackOpen} className={LINK}>
          <MessageSquare size={12} className="shrink-0" aria-hidden="true" />
          의견 보내기
        </button>
      </Row>
    </>
  );
}
