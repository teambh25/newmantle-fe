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
import { Loader2 } from "lucide-react";
import { getRankTier, RankTier } from "@/utils/rankTier";

/** 기본으로 보이는 줄 수. 넘으면 "더보기" (docs/tasks/ui/word-list.md 3-5) */
export const VISIBLE_WORD_COUNT = 7;

// 줄 배경: 정답에 가까울수록 진한 파랑 (word-list.md 3-1)
const TIER_ROW: Record<RankTier, string> = {
  1: "bg-blue-200",
  2: "bg-blue-100",
  3: "bg-blue-50",
  4: "bg-slate-50",
  5: "",
  0: "",
};
const TIER_RANK_TEXT: Record<RankTier, string> = {
  1: "", 2: "", 3: "", 4: "",
  5: "text-gray-500",
  0: "text-gray-400",
};

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
  pendingWord?: string | null;
  pendingAttempt?: number;
  /** 맨 위 줄이 방금 입력한 항목인지. 맞으면 아래에 굵은 구분선 */
  hasLatestRow?: boolean;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll, pendingWord, pendingAttempt, hasLatestRow = words.length > 1 }) => {
  // 제출 중 줄이 보이는 동안에도 전체 줄 수는 그대로 (표 자리 확보, word-list.md 3-5)
  const visibleCount = VISIBLE_WORD_COUNT - (pendingWord ? 1 : 0);
  const displayedWords = showAll ? words : words.slice(0, visibleCount);
  const rowClass = (word: SubmittedWord, index: number) => {
    // 정답은 표에 오지 않는다 (날짜 제목에 보임, word-list.md 3-4)
    const bg = TIER_ROW[getRankTier(word.rank)];
    const latest = index === 0 && hasLatestRow ? "border-b-2 border-b-gray-400" : "";
    return `${bg} ${latest}`;
  };

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-12 sm:w-16">#</TableHead>
          <TableHead className="text-center">단어</TableHead>
          <TableHead className="text-center w-20 sm:w-24">순위</TableHead>
          <TableHead className="text-center w-20 sm:w-24">유사도</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingWord && pendingAttempt && (
          <TableRow className="bg-muted/50 text-gray-400">
            <TableCell className="text-center py-2 w-12 sm:w-16">
              {pendingAttempt}
            </TableCell>
            <TableCell className="text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {pendingWord}
            </TableCell>
            <TableCell className="text-center w-20 sm:w-24 py-2">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
            </TableCell>
            <TableCell className="text-center w-20 sm:w-24 py-2">
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
            </TableCell>
          </TableRow>
        )}
        {displayedWords.map((word, index) => {
          const isHint = word.attempt === -1;
          const tier = getRankTier(word.rank);
          return (
            <TableRow key={index} className={rowClass(word, index)}>
              <TableCell className="text-center py-2 px-1 w-12 sm:w-16">
                {isHint ? (
                  <span role="img" aria-label="힌트로 받은 단어" className="text-xs font-semibold text-amber-700 whitespace-nowrap">
                    힌트
                  </span>
                ) : (
                  word.attempt
                )}
              </TableCell>
              <TableCell
                className={`text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                  isHint ? "text-amber-700 font-medium" : ""
                }`}
              >
                {word.word}
              </TableCell>
              <TableCell
                className={`text-center w-20 sm:w-24 py-2 ${TIER_RANK_TEXT[tier]}`}
              >
                {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
              </TableCell>
              <TableCell
                className="text-center w-20 sm:w-24 py-2 text-gray-500"
              >
                {word.similarity !== null && word.similarity !== undefined
                  ? word.similarity.toFixed(2)
                  : "N/A"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default WordTable;
