import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmittedWord } from "@/utils/api";
import { Lightbulb } from "lucide-react";
import { getRankTier } from "@/utils/rankTier";
import { TIER_TEXT } from "./tierColors";

/** 기록 표에 기본으로 보이는 줄 수. 넘으면 "더보기" (docs/tasks/ui/word-list/plan.md 5) */
export const VISIBLE_HISTORY_COUNT = 7;

// 두 표의 칸 폭을 맞춘다 (table-fixed는 첫 줄 폭을 따름)
const NUM_W = "w-12 sm:w-16";
const STAT_W = "w-20 sm:w-24";
const COL = {
  num: `text-center py-2 px-1 ${NUM_W}`,
  word: "text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis",
  stat: `text-center py-2 px-1 ${STAT_W}`,
};

/** 기록 표 한 줄 */
function WordRow({ word }: { word: SubmittedWord }) {
  const isHint = word.attempt === -1;
  // 순위·유사도 글씨 색만 단계로: 정렬된 표에서도 높은 순위 단어가 먼저 눈에 들어오게 (word-list/plan.md 2)
  const tone = TIER_TEXT[getRankTier(word.rank)];
  return (
    <TableRow>
      <TableCell className={COL.num}>
        {isHint ? (
          // 힌트 단어: # 칸 전구로만 구분 (아이콘·단어 모두 검정. word-list/plan.md 3)
          <span role="img" aria-label="힌트로 받은 단어" className="inline-flex justify-center w-full">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          word.attempt
        )}
      </TableCell>
      <TableCell className={COL.word}>{word.word}</TableCell>
      <TableCell className={`${COL.stat} ${tone}`}>
        {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
      </TableCell>
      <TableCell className={`${COL.stat} ${tone}`}>
        {word.similarity !== null && word.similarity !== undefined ? word.similarity.toFixed(2) : "N/A"}
      </TableCell>
    </TableRow>
  );
}

interface WordTableProps {
  /** 기록 표: 순위를 아는 모든 단어(입력·힌트, 방금 단어 포함), 순위순 */
  history: SubmittedWord[];
  showAll: boolean;
}

/**
 * 기록 표 (docs/tasks/ui/word-list/plan.md 1). 방금 항목은 진행 상황 카드가 따로 보여 주고, 표는 낸 단어 전체를 순위순으로.
 * 머리줄은 표 맨 위. 기록이 없으면 표 없음
 */
const WordTable: React.FC<WordTableProps> = ({ history, showAll }) => {
  const displayed = showAll ? history : history.slice(0, VISIBLE_HISTORY_COUNT);
  if (displayed.length === 0) return null;
  return (
    <div className="mt-3">
      <Table className="table-fixed" aria-label="기록">
        <TableHeader>
          <TableRow>
            <TableHead className={`text-center px-1 ${NUM_W}`}>#</TableHead>
            <TableHead className="text-center">단어</TableHead>
            <TableHead className={`text-center px-1 ${STAT_W}`}>순위</TableHead>
            <TableHead className={`text-center px-1 ${STAT_W}`}>유사도</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed.map((word) => (
            <WordRow key={`${word.attempt}:${word.word}`} word={word} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WordTable;
