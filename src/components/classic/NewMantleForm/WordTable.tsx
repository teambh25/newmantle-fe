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
import { CircleAlert, Flag, History, Lightbulb, Loader2, Repeat } from "lucide-react";
import { getRankTier } from "@/utils/rankTier";
import { TIER_TEXT } from "./tierColors";

/** 기록 표에 기본으로 보이는 줄 수. 방금 입력 칸 1줄과 합쳐 7줄. 넘으면 "더보기" (docs/tasks/ui/word-list/plan.md 5) */
export const VISIBLE_HISTORY_COUNT = 6;

// 두 표의 칸 폭을 맞춘다 (table-fixed는 첫 줄 폭을 따름)
const NUM_W = "w-12 sm:w-16";
const STAT_W = "w-20 sm:w-24";
const COL = {
  num: `text-center py-2 px-1 ${NUM_W}`,
  word: "text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis",
  stat: `text-center py-2 px-1 ${STAT_W}`,
};

/** 소제목: 선 아이콘 + 짧은 글, 회색 */
const SUBHEAD = "flex items-center justify-center gap-1 px-2 py-3 text-xs font-medium leading-4 text-gray-500";

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
    : tone === "consonant" ? ["초성 힌트", <Lightbulb key="i" className="h-4 w-4" aria-hidden="true" />]
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
  // 순위·유사도 글씨 색만 단계로 (줄 배경 없음, rank-track.md 3)
  const tone = TIER_TEXT[getRankTier(word.rank)];
  return (
    <TableRow>
      <TableCell className={COL.num}>
        {isHint ? (
          // 힌트 단어: # 칸 전구로만 구분 (아이콘·단어 모두 검정. word-list/plan.md 3)
          <span role="img" aria-label="힌트로 받은 단어" className="inline-flex justify-center w-full">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : isRepeat ? (
          <span role="img" aria-label="이미 입력한 단어" className="inline-flex justify-center w-full">
            <Repeat className="h-4 w-4" aria-hidden="true" />
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
      <TableCell className={COL.word}>{row.word}</TableCell>
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
      {/* 방금 칸과 기록 표는 기록 표 소제목이 나눈다 (구분선 없음, word-list/plan.md 1). 표 이름이 같은 뜻이라 읽지 않음 */}
      <div>
        <Table className="table-fixed" aria-label="방금 입력">
          <TableHeader>
            <TableRow>
              <TableHead className={`text-center px-1 ${NUM_W}`}>#</TableHead>
              <TableHead className="text-center">단어</TableHead>
              <TableHead className={`text-center px-1 ${STAT_W}`}>순위</TableHead>
              <TableHead className={`text-center px-1 ${STAT_W}`}>유사도</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{latest && <LatestRowView row={latest} />}</TableBody>
        </Table>
      </div>
      {displayed.length > 0 && (
        <>
          <div aria-hidden="true" className={SUBHEAD}>
            <History className="h-3.5 w-3.5" />
            지난 기록 · 순위순
          </div>
          <Table className="table-fixed" aria-label="기록">
          <TableBody>
            {displayed.map((word) => (
              <WordRow key={`${word.attempt}:${word.word}`} word={word} />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default WordTable;
