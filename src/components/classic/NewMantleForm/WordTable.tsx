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
import { CircleAlert, Flag, Lightbulb, Loader2, Repeat } from "lucide-react";
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

export type TopRowTone = "unknown" | "failed" | "consonant" | "answer" | "givenUp";

/** 구분선 위 한 줄의 번호 칸. 정답 맞힘만 진짜 시도라 번호, 나머지는 아이콘 */
function TopRowMarker({ tone, attempt }: { tone: TopRowTone; attempt?: number }) {
  if (tone === "answer") return <>{attempt}</>;
  const [label, icon] =
    tone === "failed" ? ["제출 실패", <CircleAlert key="i" className="h-4 w-4" aria-hidden="true" />]
    : tone === "consonant" ? ["초성 힌트", <Lightbulb key="i" className="h-4 w-4 text-amber-700" aria-hidden="true" />]
    : tone === "givenUp" ? ["포기", <Flag key="i" className="h-4 w-4" aria-hidden="true" />]
    : ["없는 단어", <span key="i" aria-hidden="true">-</span>];
  return (
    <span role="img" aria-label={label} className="inline-flex justify-center w-full">
      {icon}
    </span>
  );
}

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
  pendingWord?: string | null;
  pendingAttempt?: number;
  /** 맨 위 줄이 방금 입력한 항목인지. 맞으면 아래에 굵은 구분선 */
  hasLatestRow?: boolean;
  /** 구분선 위 한 줄: 순위표에 없는 가장 최근 항목. 없는 단어·제출 실패(저장 안 함), 초성, 정답 (docs/tasks/ui/plan.md 12장, word-list.md 3-2) */
  notice?: { word: string; rank: string; similarity: string; tone: TopRowTone; attempt?: number } | null;
  /** 맨 위 줄이 이미 제출한 단어를 다시 낸 것인지. 맞으면 번호 대신 반복 아이콘 (plan.md 12장) */
  latestIsRepeat?: boolean;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll, pendingWord, pendingAttempt, hasLatestRow = words.length > 1, notice = null, latestIsRepeat = false }) => {
  // 제출 중 줄·임시 줄이 보이는 동안에도 전체 줄 수는 그대로 (표 자리 확보, word-list.md 3-5)
  const visibleCount = VISIBLE_WORD_COUNT - (pendingWord || notice ? 1 : 0);
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
        {/* 방금 입력 줄(굵은 구분선 위) 자리. 보통 줄과 같은 4칸이고, 순위·유사도 칸에 숫자 대신 상태를 적는다.
            번호 칸은 TopRowMarker. 순위표에 없는 항목이라 구분선 위에만 */}
        {notice && !pendingWord && (
          <TableRow className="border-b-2 border-b-gray-400">
            <TableCell className="text-center py-2 px-1 w-12 sm:w-16">
              <TopRowMarker tone={notice.tone} attempt={notice.attempt} />
            </TableCell>
            <TableCell
              className={`text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                notice.tone === "consonant" ? "text-amber-700 font-medium" : ""
              }`}
            >
              {notice.word}
            </TableCell>
            <TableCell className="text-center w-20 sm:w-24 py-2">{notice.rank}</TableCell>
            <TableCell className="text-center w-20 sm:w-24 py-2">{notice.similarity}</TableCell>
          </TableRow>
        )}
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
                  // 힌트 단어: 단어 글자와 같은 갈색 전구 (word-list.md 3-3)
                  <span role="img" aria-label="힌트로 받은 단어" className="inline-flex justify-center w-full">
                    <Lightbulb className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  </span>
                ) : index === 0 && latestIsRepeat && !notice ? (
                  <span role="img" aria-label="이미 입력한 단어" className="inline-flex justify-center w-full">
                    <Repeat className="h-4 w-4" aria-hidden="true" />
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
