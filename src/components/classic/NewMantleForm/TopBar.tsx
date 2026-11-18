import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircleAlert, Flag, Lightbulb, Loader2, Repeat } from "lucide-react";
import { getRankTier } from "@/utils/rankTier";
import type { LatestRow } from "@/utils/board";
import { TIER_TEXT } from "./tierColors";
import { COL, NUM_W, STAT_W } from "./WordTable";

/** # 칸 아이콘 */
function Mark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span role="img" aria-label={label} className="inline-flex justify-center w-full">
      {children}
    </span>
  );
}

const icon = "h-4 w-4";
const ANSWER_TEXT = "text-blue-600";
/** 방금 줄 배경: v1 방금 줄처럼 옅은 회색. 기록 표 줄과 구분한다 (hover로 바뀌지 않게 고정) */
const ROW = "bg-muted hover:bg-muted";

/** 방금 입력 줄. 기록 표와 같은 4칸, 숫자 대신 상태가 오면 순위·유사도 칸을 합친다 (Dec-1, Dec-8) */
function LatestRowView({ row }: { row: LatestRow }) {
  if (row.kind === "pending") {
    return (
      <TableRow className={`${ROW} text-gray-400`}>
        <TableCell className={COL.num}>{row.attempt}</TableCell>
        <TableCell className={COL.word}>{row.word}</TableCell>
        <TableCell className={COL.stat}>
          <Loader2 className={`${icon} animate-spin mx-auto`} aria-hidden="true" />
        </TableCell>
        <TableCell className={COL.stat}>
          <Loader2 className={`${icon} animate-spin mx-auto`} aria-hidden="true" />
        </TableCell>
      </TableRow>
    );
  }
  if (row.kind === "notice") {
    if (row.tone === "failed") {
      // 제출·힌트·초성 힌트·포기 실패: 문구만 (어떤 단어인지는 입력창에 남아 있다)
      return (
        <TableRow className={ROW}>
          <TableCell className={COL.num}>
            <CircleAlert className={`${icon} mx-auto text-red-600`} aria-hidden="true" />
          </TableCell>
          {/* 모바일은 세 칸을 합쳐 가운데, PC는 단어 칸 가운데(순위·유사도 칸 폭 12rem + 칸 여백만큼 오른쪽을 비움) */}
          <TableCell colSpan={3} className="text-center py-2 sm:pr-[13rem]">
            <span role="alert" className="font-medium text-red-600">{row.message}</span>
          </TableCell>
        </TableRow>
      );
    }
    const marker =
      row.tone === "answer" ? row.attempt
      : row.tone === "consonant" ? <Mark label="초성 힌트"><Lightbulb className={icon} aria-hidden="true" /></Mark>
      : row.tone === "givenUp" ? <Mark label="포기"><Flag className={icon} aria-hidden="true" /></Mark>
      : null;
    const result =
      row.tone === "unknown" ? <span className="text-gray-500">미등록 단어</span>
      : row.tone === "consonant" ? <><span className={ANSWER_TEXT}>정답</span> <span className="text-xs text-gray-500">(초성)</span></>
      : row.tone === "answer" ? <span className={ANSWER_TEXT}>정답</span>
      : <span className="text-gray-500">정답</span>;
    return (
      <TableRow className={ROW}>
        <TableCell className={COL.num}>{marker}</TableCell>
        <TableCell className={`${COL.word} font-medium`}>{row.word}</TableCell>
        <TableCell colSpan={2} className="text-center py-2 px-1">{result}</TableCell>
      </TableRow>
    );
  }
  const w = row.word;
  const tone = TIER_TEXT[getRankTier(w.rank)];
  return (
    <TableRow className={ROW}>
      <TableCell className={COL.num}>
        {row.isRepeat ? (
          <Mark label="이미 입력한 단어"><Repeat className={icon} aria-hidden="true" /></Mark>
        ) : w.attempt === -1 ? (
          <Mark label="힌트로 받은 단어"><Lightbulb className={icon} aria-hidden="true" /></Mark>
        ) : (
          w.attempt
        )}
      </TableCell>
      <TableCell className={`${COL.word} font-medium`}>{w.word}</TableCell>
      <TableCell className={`${COL.stat} ${tone}`}>{w.rank === -1 ? "순위 밖" : `${w.rank}위`}</TableCell>
      <TableCell className={`${COL.stat} ${tone}`}>
        {w.similarity !== null && w.similarity !== undefined ? w.similarity.toFixed(2) : "N/A"}
      </TableCell>
    </TableRow>
  );
}

/**
 * 상단바: 머리줄 + 방금 입력 한 줄, 아래 굵은 선. 바로 밑 기록 표와 머리줄을 같이 쓴다 (docs/specs/progress-view-toggle Dec-1).
 * 카드 전 상단바(커밋 75e3d60)의 모양, 표시 규칙은 카드와 같은 latest 계산
 */
export default function TopBar({ latest, gaugeSwitch }: { latest: LatestRow | null; gaugeSwitch?: React.ReactNode }) {
  return (
    <div className="border-t border-t-gray-300 border-b-2 border-b-gray-400">
      <Table className="table-fixed" aria-label="방금 입력">
        <TableHeader>
          <TableRow>
            {/* # 칸: 게이지 스위치 (Dec-12) */}
            <TableHead className={`text-center px-1 ${NUM_W}`}>
              {gaugeSwitch ? <span className="inline-flex justify-center w-full">{gaugeSwitch}</span> : "#"}
            </TableHead>
            <TableHead className="text-center">단어</TableHead>
            <TableHead className={`text-center px-1 ${STAT_W}`}>순위</TableHead>
            <TableHead className={`text-center px-1 ${STAT_W}`}>유사도</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{latest && <LatestRowView row={latest} />}</TableBody>
      </Table>
    </div>
  );
}
