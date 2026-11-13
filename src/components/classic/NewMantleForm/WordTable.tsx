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

/** 기록 표에 기본으로 보이는 줄 수. 방금 입력 칸 1줄과 합쳐 7줄. 넘으면 "더보기" (docs/tasks/ui/word-list/plan.md 5) */
export const VISIBLE_HISTORY_COUNT = 6;

// 줄 배경: 정답에 가까울수록 진한 파랑 (word-list/plan.md 2)
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

// 두 표의 칸 폭을 맞춘다 (table-fixed는 첫 줄 폭을 따름)
const COL = {
  num: "text-center py-2 px-1 w-12 sm:w-16",
  word: "text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis",
  stat: "text-center py-2 w-20 sm:w-24",
};

export type TopRowTone = "unknown" | "failed" | "consonant" | "answer" | "givenUp";

/** 방금 입력 칸에 올 수 있는 것 (docs/tasks/ui/word-list/plan.md 1, input/plan.md 3) */
export type LatestRow =
  | { kind: "word"; word: SubmittedWord; isRepeat: boolean }
  /** 기록 표에 안 들어가는 항목: 없는 단어·제출 실패(저장 안 함), 초성, 정답 */
  | { kind: "notice"; word: string; rank: string; similarity: string; tone: TopRowTone; attempt?: number }
  /** 제출 중 (0.3초 넘게 걸릴 때) */
  | { kind: "pending"; word: string; attempt: number };

/** 방금 입력 칸 번호 자리. 정답 맞힘만 진짜 시도라 번호, 나머지는 아이콘 */
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

/** 단어 한 줄 (방금 입력 칸·기록 표 공용) */
function WordRow({ word, isRepeat = false }: { word: SubmittedWord; isRepeat?: boolean }) {
  const isHint = word.attempt === -1;
  const tier = getRankTier(word.rank);
  return (
    <TableRow className={TIER_ROW[tier]}>
      <TableCell className={COL.num}>
        {isHint ? (
          // 힌트 단어: 단어 글자와 같은 갈색 전구 (word-list/plan.md 3)
          <span role="img" aria-label="힌트로 받은 단어" className="inline-flex justify-center w-full">
            <Lightbulb className="h-4 w-4 text-amber-700" aria-hidden="true" />
          </span>
        ) : isRepeat ? (
          <span role="img" aria-label="이미 입력한 단어" className="inline-flex justify-center w-full">
            <Repeat className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          word.attempt
        )}
      </TableCell>
      <TableCell className={`${COL.word} ${isHint ? "text-amber-700 font-medium" : ""}`}>{word.word}</TableCell>
      <TableCell className={`${COL.stat} ${TIER_RANK_TEXT[tier]}`}>
        {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
      </TableCell>
      <TableCell className={`${COL.stat} text-gray-500`}>
        {word.similarity !== null && word.similarity !== undefined ? word.similarity.toFixed(2) : "N/A"}
      </TableCell>
    </TableRow>
  );
}

function LatestRowView({ row }: { row: LatestRow }) {
  if (row.kind === "word") return <WordRow word={row.word} isRepeat={row.isRepeat} />;
  if (row.kind === "pending") {
    return (
      <TableRow className="bg-muted/50 text-gray-400">
        <TableCell className={COL.num}>{row.attempt}</TableCell>
        <TableCell className={COL.word}>{row.word}</TableCell>
        <TableCell className={COL.stat}>
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
        </TableCell>
        <TableCell className={COL.stat}>
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-400" />
        </TableCell>
      </TableRow>
    );
  }
  // 보통 줄과 같은 4칸. 순위·유사도 칸에 숫자 대신 상태
  return (
    <TableRow>
      <TableCell className={COL.num}>
        <TopRowMarker tone={row.tone} attempt={row.attempt} />
      </TableCell>
      <TableCell className={`${COL.word} ${row.tone === "consonant" ? "text-amber-700 font-medium" : ""}`}>
        {row.word}
      </TableCell>
      <TableCell className={COL.stat}>{row.rank}</TableCell>
      <TableCell className={COL.stat}>{row.similarity}</TableCell>
    </TableRow>
  );
}

interface WordTableProps {
  /** 방금 입력 칸. 아직 아무것도 안 했으면 null */
  latest: LatestRow | null;
  /** 기록 표: 방금 입력 칸에 없는 순위를 아는 단어, 순위순 */
  history: SubmittedWord[];
  showAll: boolean;
}

/**
 * 위는 방금 입력 칸(머리줄 + 한 줄, 위아래 선만), 아래는 기록 표 (docs/tasks/ui/word-list/plan.md 1).
 * 다음 항목이 오면 방금 칸의 단어가 기록 표 순위 자리로 들어간다
 */
const WordTable: React.FC<WordTableProps> = ({ latest, history, showAll }) => {
  const displayed = showAll ? history : history.slice(0, VISIBLE_HISTORY_COUNT);
  return (
    <div>
      <div className="border-t border-t-gray-300 border-b-2 border-b-gray-400">
        <Table className="table-fixed" aria-label="방금 입력">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-12 sm:w-16">#</TableHead>
              <TableHead className="text-center">단어</TableHead>
              <TableHead className="text-center w-20 sm:w-24">순위</TableHead>
              <TableHead className="text-center w-20 sm:w-24">유사도</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{latest && <LatestRowView row={latest} />}</TableBody>
        </Table>
      </div>
      {displayed.length > 0 && (
        <Table className="table-fixed" aria-label="기록">
          <TableBody>
            {displayed.map((word) => (
              <WordRow key={`${word.attempt}:${word.word}`} word={word} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default WordTable;
