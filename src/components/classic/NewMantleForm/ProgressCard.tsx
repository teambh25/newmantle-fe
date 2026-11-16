import React, { useEffect, useRef, useState } from "react";
import { CircleAlert, Lightbulb, Loader2, PartyPopper, Repeat, X } from "lucide-react";
import type { SubmittedWord } from "@/utils/api";
import { getRankTier, type RankTier } from "@/utils/rankTier";
import { TRACK_END_POSITION, trackCellBottom, trackCellSize, trackPosition } from "@/utils/rankTrack";
import { recordBubbles, visibleBubbles } from "@/utils/progressMarks";

/** 말풍선 글자(11px)의 실제 폭 + 좌우 여백·테두리 14px. 겹침 판단용 */
let measureCtx: CanvasRenderingContext2D | null = null;
function measuredBubbleWidth(word: string): number {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return word.length * 11 + 14;
  measureCtx.font = `11px ${getComputedStyle(document.body).fontFamily}`;
  return Math.ceil(measureCtx.measureText(word).width) + 14;
}
import { TIER_TEXT } from "./tierColors";

export type TopRowTone = "unknown" | "failed" | "consonant" | "answer" | "givenUp";

/** 방금 입력 칸에 올 수 있는 것 (docs/tasks/ui/progress-card/plan.md 3, input/plan.md 3) */
export type LatestRow =
  | { kind: "word"; word: SubmittedWord; isRepeat: boolean }
  /** 기록 표에 안 들어가는 항목: 없는 단어·제출 실패(저장 안 함), 초성, 정답 */
  | { kind: "notice"; word: string; tone: TopRowTone; attempt?: number; message?: string }
  /** 제출 중 (0.3초 넘게 걸릴 때) */
  | { kind: "pending"; word: string; attempt: number };

export type GameEnd = "playing" | "solved" | "givenUp";

interface ProgressCardProps {
  /** 방금 항목. 아직 아무것도 안 했으면 null */
  latest: LatestRow | null;
  /** 지금까지의 최고 순위(1~999). 순위 있는 단어가 없으면 null */
  best: number | null;
  /** 힌트·초성 힌트·포기 실패 안내. 있으면 배너에 방금 항목 대신 알림으로 (plan.md 3) */
  error?: string | null;
  /** 지금까지 제출 횟수 (힌트·다시 내기는 안 셈). 카드 오른쪽 위 */
  attempts: number;
  /** 저장된 기록 (최근 것이 앞). 바 아래 지난 기록 말풍선에 쓴다 */
  words: SubmittedWord[];
  end: GameEnd;
}

/** 게이지 막대 끝(1위 칸 위 끝). 그 오른쪽은 정답 자리 */
const BAR_END = trackCellBottom(1) + trackCellSize(1);
/** 단계 경계 (순위 밖 | 301–999 | 101–300 | 51–100 | 21–50 | 1–20) */
const BOUNDARIES: RankTier[] = [5, 4, 3, 2, 1];
/** 숫자 눈금: 경계 오른쪽 칸이 시작하는 순위 (999위 = 순위권 시작) (plan.md 2) */
const TICKS: { tier: RankTier; rank: number }[] = [
  { tier: 5, rank: 999 },
  { tier: 4, rank: 300 },
  { tier: 3, rank: 100 },
  { tier: 2, rank: 50 },
  { tier: 1, rank: 20 },
];

/** 단어의 게이지 위치. 순위 밖은 맨 왼쪽 (plan.md 2) */
const wordPosition = (rank: number) => (rank < 1 ? 0 : trackPosition(rank));

/** 방금 항목의 게이지 위치. 위치가 없는 항목(제출 중·없는 단어·실패·초성)은 null */
function latestPosition(latest: LatestRow | null): number | null {
  if (!latest) return null;
  if (latest.kind === "word") return wordPosition(latest.word.rank);
  if (latest.kind === "notice" && (latest.tone === "answer" || latest.tone === "givenUp")) return TRACK_END_POSITION;
  return null;
}

const pct = (pos: number) => `${pos * 100}%`;

const icon = "h-4 w-4 shrink-0";

/** 단어 앞 아이콘 (힌트·다시 내기·초성·없는 단어·실패) */
function Mark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span role="img" aria-label={label} className="shrink-0 inline-flex">
      {children}
    </span>
  );
}

/**
 * 배너 한 줄 [아이콘 단어 순위 (유사도)], 실제 글자만 카드 가운데 (plan.md 3).
 * 칸 폭을 미리 잡지 않음: 빈 자리가 가운데를 끌어당겨 치우쳐 보였음. 글자 수가 바뀌면 그 차이의 절반만큼 움직임
 */
function BannerRow({ mark, word, stat, sub }: { mark?: React.ReactNode; word: string; stat?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <>
      {mark && <span className="inline-flex shrink-0">{mark}</span>}
      <span className="shrink-0 font-medium text-gray-900">{word}</span>
      {(stat || sub) && (
        <span className="inline-flex shrink-0 items-baseline gap-1.5 tabular-nums">
          {stat && <span className="font-semibold">{stat}</span>}
          {sub && <span className="text-sm text-gray-500">{sub}</span>}
        </span>
      )}
    </>
  );
}

/** 요청 실패 배너: 경고 아이콘 + 짧은 실패 문구, 빨강, 알림. 굵기는 평소 단어와 같게 (plan.md 3) */
function BannerFailure({ text }: { text: string }) {
  return (
    <span role="alert" className="flex items-center gap-1.5 whitespace-nowrap text-base leading-6">
      <CircleAlert className={`${icon} text-red-600`} aria-hidden="true" />
      <span className="font-medium text-red-600">{text}</span>
    </span>
  );
}

/** 정답 글자 색: 맞힘·초성(사실상 정답)은 맞힘 폭죽·채움과 같은 파랑, 포기는 회색 */
const ANSWER_TEXT = "text-blue-600";

/** 배너 내용 (plan.md 3 표). 아이콘 단어 순위 (유사도), 순위권 밖은 아이콘 단어 점수. 제출 횟수는 카드 오른쪽 위가 맡는다 */
function BannerContent({ latest }: { latest: LatestRow }) {
  if (latest.kind === "pending") {
    return <BannerRow mark={<Loader2 className={`${icon} animate-spin text-gray-400`} aria-hidden="true" />} word={latest.word} />;
  }
  if (latest.kind === "notice") {
    switch (latest.tone) {
      case "unknown":
        // 단어 목록에 없는 단어: 정상 제출처럼 "단어 + 결과", 아이콘 없이 순위 자리에 회색 글자 (문구는 여기서 고침)
        return <BannerRow word={latest.word} stat={<span className="text-gray-500">미등록 단어</span>} />;
      case "failed":
        // 어떤 단어인지는 입력창에 남아 있어서 문구만
        return <BannerFailure text={latest.message ?? ""} />;
      case "consonant":
        // "ㅅㄹ 정답(초성)": 초성이 크게, 무엇인지는 뒤에 작게
        return (
          <BannerRow
            mark={<Mark label="초성 힌트"><Lightbulb className={icon} aria-hidden="true" /></Mark>}
            word={latest.word}
            stat={<span className={ANSWER_TEXT}>정답</span>}
            sub={<span className="text-xs">(초성)</span>}
          />
        );
      case "answer":
        // "소리 정답"
        return <BannerRow word={latest.word} stat={<span className={ANSWER_TEXT}>정답</span>} />;
      case "givenUp":
        return <BannerRow word={latest.word} stat={<span className="text-gray-500">정답</span>} />;
    }
  }
  const w = latest.word;
  const tone = TIER_TEXT[getRankTier(w.rank)];
  const similarity = w.similarity !== null && w.similarity !== undefined ? w.similarity.toFixed(2) : "N/A";
  // 아이콘은 평소와 다를 때만: 힌트 전구, 다시 낸 단어 반복 (힌트 단어여도, 방금 한 행동이 다시 내기라서). 새로 낸 단어는 없음
  const mark = latest.isRepeat ? (
    <Mark label="이미 입력한 단어"><Repeat className={icon} aria-hidden="true" /></Mark>
  ) : w.attempt === -1 ? (
    <Mark label="힌트로 받은 단어"><Lightbulb className={icon} aria-hidden="true" /></Mark>
  ) : null;
  // 순위권: 순위 + 끝에 작은 유사도. 순위권 밖: 순위 자리에 유사도 점수
  return w.rank === -1 ? (
    <BannerRow mark={mark} word={w.word} stat={<span className={tone}>{similarity}점</span>} />
  ) : (
    <BannerRow mark={mark} word={w.word} stat={<span className={tone}>{w.rank}위</span>} sub={`(${similarity})`} />
  );
}

/**
 * 진행 상황 카드 (docs/tasks/ui/progress-card/plan.md). 방금 입력 칸을 대체한다.
 * 위 줄은 배너(이번 항목, 가운데 고정), 아래 줄은 게이지(왼쪽 순위 밖 → 오른쪽 정답 자리). 1단계: 연출 없음
 */
const ProgressCard: React.FC<ProgressCardProps> = ({ latest, best, end, error = null, attempts, words }) => {
  const pos = latestPosition(latest);
  // 맞히면 끝까지 채운다 (그 뒤 단어를 내도 그대로). 포기는 최고 순위까지
  const solved = end === "solved";
  const fill = solved ? BAR_END : best === null ? 0 : trackPosition(best);
  const atEnd = pos === TRACK_END_POSITION;
  // 말풍선 겹침 판단에 카드 안쪽 폭이 필요하다
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  // 방금 낸 새 단어만 뺀다. 다시 낸 단어는 그대로 둔다
  const fresh = latest?.kind === "word" && !latest.isRepeat ? latest.word : null;
  const bubbles = recordBubbles(words, fresh);
  // 폭을 모르면(jsdom 등) 최고만 보여서 글자를 잴 일이 없다
  const shown = visibleBubbles(bubbles, width, width > 0 ? measuredBubbleWidth : undefined);

  return (
    <section aria-label="방금 입력" className="relative w-full rounded-lg border border-gray-200 bg-white px-4 pt-2 pb-3">
      {/* 제출 횟수: 오른쪽 위 배지 (색 대신 옅은 회색 배경 + 굵은 진회색, 파랑은 "가깝다" 뜻이라 안 씀). 힌트·다시 내기에도 그대로 (plan.md 1). 아직 안 냈으면 없음 */}
      {attempts > 0 && (
        <span aria-label="제출 횟수" className="absolute right-2.5 top-1.5 rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 tabular-nums text-gray-700">
          {attempts}트
        </span>
      )}
      {/* 배너 줄: 글자만 가운데. 비어 있어도 높이를 지킨다 (plan.md 3) */}
      <div className="flex h-10 items-center justify-center pb-1.5">
        {error ? (
          // 힌트·초성 힌트·포기 실패: 방금 항목 대신 알림. 다음 요청이나 입력창에 글자를 치면 사라짐
          <div role="status" className="flex shrink-0 items-center">
            <BannerFailure text={error} />
          </div>
        ) : latest ? (
          <div role="status" className="flex min-w-0 max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap text-base leading-6">
            <BannerContent latest={latest} />
          </div>
        ) : (
          // 처음: 폭죽 컨셉으로 첫 입력을 부른다 (문구는 여기서 고침)
          <p className="text-xs text-gray-400">단어를 입력해서 폭죽을 채워 보세요</p>
        )}
      </div>

      <div className="relative h-6">
        <div
          role="meter"
          aria-label="진행 상황"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={solved ? 100 : Math.round(fill * 1000) / 10}
          aria-valuetext={solved ? "정답" : best === null ? "기록 없음" : `최고 ${best}위`}
          className="absolute top-1/2 left-0 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-gray-200"
          style={{ width: pct(BAR_END) }}
        >
          {/* 채움: 최고 순위까지 파랑 한 색 */}
          <div className="absolute inset-y-0 left-0 bg-blue-600" style={{ width: pct(fill / BAR_END) }} />
          {/* 단계 경계 금 */}
          {BOUNDARIES.map((t) => (
            <div
              key={t}
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-white"
              style={{ left: pct(trackCellBottom(t) / BAR_END) }}
            />
          ))}
        </div>
        {/* 방금 단어 자리 핀: ▼ + 바를 관통하는 바늘 (흰 테두리로 파란 채움 위에서도 또렷). 정답·포기는 폭죽(✕) 위 ▼만 */}
        {pos !== null && (
          <span aria-hidden="true" className="absolute inset-y-0 -translate-x-1/2" style={{ left: pct(pos) }}>
            <span
              className={`absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-gray-900 ${
                atEnd ? "-top-3.5" : "-top-1.5"
              }`}
            />
            {!atEnd && (
              <span className="absolute left-1/2 top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-gray-900 shadow-[0_0_0_1px_white]" />
            )}
          </span>
        )}
        {/* 정답 자리: 진행 중 회색 폭죽, 맞힘 진한 폭죽, 포기 회색 ✕ */}
        <span
          role="img"
          aria-label={end === "solved" ? "정답" : end === "givenUp" ? "포기" : "정답 자리"}
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 ${end === "solved" ? "text-blue-600" : "text-gray-400"}`}
          style={{ left: pct(TRACK_END_POSITION) }}
        >
          {end === "givenUp" ? <X className="h-5 w-5" aria-hidden="true" /> : <PartyPopper className="h-5 w-5" aria-hidden="true" />}
        </span>
      </div>

      {/* 숫자 눈금: 경계 금 아래 */}
      <div aria-hidden="true" className="relative h-4 text-[10px] leading-4 text-gray-500 tabular-nums">
        {TICKS.map(({ tier, rank }) => (
          <span key={rank} className="absolute -translate-x-1/2" style={{ left: pct(trackCellBottom(tier)) }}>
            {rank}위
          </span>
        ))}
      </div>

      {/* 지난 기록 말풍선: 최고 기록을 깬 단어, 한 줄. 겹치면 오래된 쪽을 숨김(자리에 아무것도 안 남김) (plan.md 2) */}
      <div ref={innerRef} aria-hidden="true" className="relative mt-1 h-6">
        {bubbles.map((b, i) => {
          if (!shown[i]) return null;
          const p = trackPosition(b.rank);
          return (
            <div
              key={`${b.rank}:${b.word}`}
              className="absolute top-1"
              style={{ left: pct(p), transform: `translateX(-${p * 100}%)` }}
            >
              <span
                className="block whitespace-nowrap rounded border border-gray-300 bg-white px-1.5 text-[11px] leading-4 text-gray-900"
              >
                {b.word}
              </span>
              {/* 꼬리: 회색 세모 위에 흰 세모를 1px 내려 겹쳐, 몸통 윗테두리만 덮고 글자는 안 가림 */}
              <span
                className="absolute -top-[5px] h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[5px] border-x-transparent border-b-gray-300"
                style={{ left: `clamp(7px, ${p * 100}%, calc(100% - 7px))` }}
              />
              <span
                className="absolute -top-[3px] h-0 w-0 -translate-x-1/2 border-x-[4px] border-b-[4px] border-x-transparent border-b-white"
                style={{ left: `clamp(7px, ${p * 100}%, calc(100% - 7px))` }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProgressCard;
