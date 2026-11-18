"use client";
import React, { useEffect, useRef, useState } from "react";
import { CircleAlert, Lightbulb, Loader2, Repeat } from "lucide-react";
import type { SubmittedWord } from "@/utils/api";
import type { GameEnd, LatestRow } from "@/utils/board";
import { chartPoints, chartTicks, chartTopLevel, limitPoints, visibleLabels, type LabelBox } from "@/utils/rankChart";
import { rankStyle } from "./WordTable";

// classic 진행 상황 카드의 excel 버전: 엑셀 꺾은선 차트 (docs/specs/excel-ui Dec-46~Dec-52)
// 제목 = 방금 입력(classic 배너와 같은 규칙), 점 = 최고 기록을 깬 단어, 가로 간격은 고르게, 세로는 classic 게이지 눈금

const GREEN = "#217346";
const GRAY = "#9ca3af";
const GRID = "#d9d9d9";
/** 그래프 높이 (px) */
const HEIGHT = 150;
/** 그림 영역 여백 (px): 왼쪽은 눈금 숫자, 위는 점 위 단어, 아래는 시도 번호 */
const PAD = { left: 38, right: 14, top: 22, bottom: 20 };
/** 첫·마지막 점이 눈금 숫자·가장자리에 붙지 않게 안쪽 여백 (px) */
const INSET = 18;
const POINT_R = 4;
/** 이 폭보다 좁으면 중간 점 개수를 제한한다 (px) */
const NARROW_WIDTH = 500;
const NARROW_MAX_MIDDLE = 3;
const ANSWER_R = 6;
/** 점 위 단어 글자 크기와 폭 어림 (px) */
const LABEL_FONT = 13;
const labelWidth = (word: string) => word.length * LABEL_FONT + 4;
/** 폭을 모를 때(첫 렌더, 테스트) 쓰는 폭 (px) */
const FALLBACK_WIDTH = 300;

function Mark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span role="img" aria-label={label} className="inline-flex shrink-0">
      {children}
    </span>
  );
}

const formatSimilarity = (s: number | null | undefined) => (s !== null && s !== undefined ? s.toFixed(2) : "N/A");

/** 제목 내용: classic 배너와 같은 규칙 (아이콘 포함, Dec-52) */
function TitleContent({ latest }: { latest: LatestRow }) {
  if (latest.kind === "pending") {
    return (
      <>
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gray-400" aria-hidden="true" />
        <span className="truncate text-gray-500">{latest.word}</span>
      </>
    );
  }
  if (latest.kind === "notice") {
    switch (latest.tone) {
      case "unknown":
        return (
          <>
            <span className="truncate">{latest.word}</span>
            <span className="shrink-0 text-gray-400">미등록 단어</span>
          </>
        );
      case "failed":
        return <Failure text={latest.message ?? ""} />;
      case "consonant":
        return (
          <>
            <Mark label="초성 힌트"><Lightbulb size={18} className="text-yellow-600" aria-hidden="true" /></Mark>
            <span className="truncate font-bold text-[#217346]">{latest.word}</span>
            <span className="shrink-0 text-[#217346]">정답(초성)</span>
          </>
        );
      case "answer":
      case "givenUp": {
        const solved = latest.tone === "answer";
        return (
          <>
            <span className={`truncate font-bold ${solved ? "text-[#217346]" : "text-gray-600"}`}>{latest.word}</span>
            <span className={`shrink-0 ${solved ? "font-bold text-[#217346]" : "text-gray-500"}`}>정답</span>
          </>
        );
      }
    }
  }
  const w = latest.word;
  const mark = latest.isRepeat ? (
    <Mark label="이미 입력한 단어"><Repeat size={18} className="text-gray-600" aria-hidden="true" /></Mark>
  ) : w.attempt === -1 ? (
    <Mark label="힌트로 받은 단어"><Lightbulb size={18} className="text-yellow-600" aria-hidden="true" /></Mark>
  ) : null;
  return (
    <>
      {mark}
      <span className="truncate">{w.word}</span>
      {w.rank === -1 ? (
        <span className={`shrink-0 ${rankStyle(-1)}`}>{formatSimilarity(w.similarity)}점</span>
      ) : (
        <>
          <span className={`shrink-0 ${rankStyle(w.rank)}`}>{w.rank}위</span>
          <span className="shrink-0 text-sm font-normal text-gray-500">({formatSimilarity(w.similarity)})</span>
        </>
      )}
    </>
  );
}

function Failure({ text }: { text: string }) {
  return (
    <span role="alert" className="flex items-center gap-1.5 text-red-600">
      <CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="font-medium">{text}</span>
    </span>
  );
}

interface RankChartProps {
  rowNumber: number;
  /** 방금 항목. 아직 아무것도 안 했으면 null */
  latest: LatestRow | null;
  /** 힌트·초성 힌트·포기 실패 안내. 있으면 제목에 방금 항목 대신 (Dec-31) */
  error: string | null;
  /** 저장된 기록 (최근 것이 앞) */
  words: SubmittedWord[];
  end: GameEnd;
}

export function RankChart({ rowNumber, latest, error, words, end }: RankChartProps) {
  // 점 위치·단어 겹침 계산에 그래프 폭이 필요하다
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const w = width || FALLBACK_WIDTH;

  // 좁은 화면(모바일)은 중간 점을 최근 것부터 정한 개수까지만. 단어가 다른 점·선에 얹히지 않게 (Dec-84)
  const allPoints = chartPoints(words, end);
  const points = w < NARROW_WIDTH ? limitPoints(allPoints, NARROW_MAX_MIDDLE) : allPoints;
  const plotLeft = PAD.left + INSET;
  const plotRight = w - PAD.right - INSET;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const xAt = (i: number) =>
    points.length === 1 ? (plotLeft + plotRight) / 2 : plotLeft + ((plotRight - plotLeft) * i) / (points.length - 1);
  // 위 끝: 지금 최고 순위의 다음 단계 눈금까지만. 구간을 넘으면 축이 한 단계 열린다 (Dec-63)
  const top = chartTopLevel(points);
  // 점이 없으면 999위 선 하나만 세로 가운데에 (Dec-64)
  const yAt = (level: number) =>
    points.length === 0 ? PAD.top + plotH / 2 : PAD.top + (1 - level / top) * plotH;
  const placed = points.map((p, i) => ({ ...p, x: xAt(i), y: yAt(p.level), r: p.kind === "record" ? POINT_R : ANSWER_R }));

  // 단어는 점 위 가운데, 그래프 밖으로 나가지 않게 양 끝을 붙인다
  const labels = placed.map((p) => {
    const lw = labelWidth(p.word);
    const cx = Math.min(Math.max(p.x, lw / 2), w - lw / 2);
    const bottom = p.y - p.r - 3;
    return { cx, box: { left: cx - lw / 2, right: cx + lw / 2, top: bottom - LABEL_FONT - 2, bottom } as LabelBox };
  });
  // 단어 겹침 우선순위: 지금 최고(마지막 단어 점) → 목표 점 글자 → 처음 → 나머지는 최근 것부터 (Dec-83)
  const wordIndexes = placed.flatMap((p, i) => (p.kind === "target" ? [] : [i]));
  const targetIndex = placed.findIndex((p) => p.kind === "target");
  const lastIndex = wordIndexes.length > 0 ? wordIndexes[wordIndexes.length - 1] : -1;
  const order = [
    ...(lastIndex >= 0 ? [lastIndex] : []),
    ...(targetIndex >= 0 ? [targetIndex] : []),
    ...(wordIndexes.length > 1 ? [wordIndexes[0]] : []),
    ...wordIndexes.slice(1, -1).reverse(),
  ];
  const shown = visibleLabels(labels.map((l) => l.box), order);
  const labelBox = (i: number) => labels[i].box;
  // 아래 시도 번호: 단어가 보이는 점만, 같은 줄이라 서로 겹치면 같은 우선순위로 숨긴다 (Dec-83)
  const axisBox = (i: number): LabelBox => {
    const p = placed[i];
    const aw = String(p.attempt === -1 ? "힌트" : p.attempt).length * 7 + 4;
    return { left: p.x - aw / 2, right: p.x + aw / 2, top: HEIGHT - 16, bottom: HEIGHT - 4 };
  };
  const axisCandidates = order.filter((i) => shown[i] && placed[i].kind !== "target" && placed[i].attempt !== null);
  // 후보는 이미 우선순위 순서라 그대로 자리를 잡는다
  const axisShownList = visibleLabels(axisCandidates.map(axisBox), axisCandidates.map((_, k) => k));
  const axisShown = placed.map(() => false);
  axisCandidates.forEach((i, k) => (axisShown[i] = axisShownList[k]));
  const givenUp = end === "givenUp";


  return (
    <div className="excel-row">
      <div className="sheet-cell-header">{rowNumber}</div>
      <div className="col-span-4 p-2 sm:p-3 bg-white border-r-0">
        {/* 시트 위에 놓인 엑셀 차트 개체처럼: 옅은 테두리 상자 */}
        <figure className="border border-[#d4d4d4] bg-white px-2 pt-2 pb-1 shadow-sm">
          <figcaption className="flex items-center gap-2 px-1 py-1 text-base sm:text-lg font-semibold">
            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap">
              {error ? (
                <Failure text={error} />
              ) : latest ? (
                <div role="status" aria-label="방금 입력" className="flex min-w-0 items-center gap-1.5">
                  <TitleContent latest={latest} />
                </div>
              ) : (
                <p className="text-sm font-normal text-gray-400">단어를 입력하면 순위 그래프가 그려져요</p>
              )}
            </div>
          </figcaption>

          <div ref={boxRef} className="w-full">
            <svg role="img" aria-label="순위 그래프" width={w} height={HEIGHT} className="block">
              {/* 주 눈금선: 흰 배경에 옅은 회색 가로 실선, 왼쪽에 작은 회색 숫자 (Dec-49) */}
              {chartTicks(points).map((t) => {
                const y = yAt(t.level);
                return (
                  <g key={t.rank}>
                    <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                    {/* 위 끝 눈금 = 다음 목표라 숫자를 조금 진하게 */}
                    <text
                      x={PAD.left - 4}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="#000"
                      fontWeight={t.level === top ? 600 : 400}
                    >
                      {t.rank}위
                    </text>
                  </g>
                );
              })}

              {/* 선: 녹색. 목표 점·포기한 정답 점으로 가는 마지막 선은 회색 점선 (Dec-58) */}
              {placed.slice(1).map((p, i) => {
                const prev = placed[i];
                const toGivenUp = p.kind === "givenUp" || p.kind === "target";
                return (
                  <line
                    key={`l${i}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={p.x}
                    y2={p.y}
                    stroke={toGivenUp ? GRAY : GREEN}
                    strokeWidth={2}
                    strokeDasharray={toGivenUp ? "4 3" : undefined}
                  />
                );
              })}

              {/* 점: 크기는 같게, 마지막(지금 최고·정답)만 속을 채운다. 정답 점은 조금 크게, 포기는 회색 (Dec-51) */}
              {placed.map((p, i) => {
                // 목표 점: 오른쪽 위 끝 정답 자리를 회색 점선 동그라미로 미리 보여 준다 (Dec-55)
                if (p.kind === "target") {
                  return (
                    <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r} fill="#fff" stroke={GRAY} strokeWidth={1.5} strokeDasharray="3 2" />
                  );
                }
                const color = p.kind === "givenUp" ? GRAY : GREEN;
                return (
                  <circle
                    key={`p${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    fill={i === lastIndex ? color : "#fff"}
                    stroke={color}
                    strokeWidth={2}
                  />
                );
              })}

              {/* 점 위 단어: 들어가는 것만 (Dec-47) */}
              {placed.map((p, i) =>
                shown[i] ? (
                  <text
                    key={`t${i}`}
                    x={labels[i].cx}
                    y={labelBox(i).bottom - 2}
                    textAnchor="middle"
                    fontSize={LABEL_FONT}
                    // 선이 글자 뒤로 지나가도 읽히게 흰 테두리 (Dec-84)
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    fill={p.kind === "givenUp" || givenUp ? "#4b5563" : "#1f2937"}
                    fontWeight={i === lastIndex ? 700 : 400}
                  >
                    {p.word}
                  </text>
                ) : null,
              )}

              {/* 가로축 값: 단어가 보이는 점만 아래에 시도 번호, 서로 겹치면 숨김. 목표 점 아래는 비운다. 축 선은 그리지 않는다 (Dec-56, Dec-83) */}
              {placed.map((p, i) =>
                axisShown[i] ? (
                  <text
                    key={`a${i}`}
                    x={p.x}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#000"
                  >
                    {p.attempt === -1 ? "힌트" : p.attempt}
                  </text>
                ) : null,
              )}
            </svg>
          </div>
        </figure>
      </div>
    </div>
  );
}
