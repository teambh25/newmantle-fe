import React from "react";
import { Lightbulb } from "lucide-react";
import type { RankTier } from "@/utils/rankTier";
import {
  TRACK_END_POSITION,
  trackCellBottom,
  trackCellSize,
  trackPosition,
  visibleLabels,
  type TrackEnd,
  type TrackMark,
} from "@/utils/rankTrack";
import { TIER_FILL } from "./tierColors";

const TIERS: RankTier[] = [0, 5, 4, 3, 2, 1];
/** 글자 한 줄 높이(px). 이보다 가까우면 겹친다고 본다 */
const LABEL_PX = 13;

interface RankTrackProps {
  marks: TrackMark[];
  end: TrackEnd;
  /** 트랙 높이(px). 크기를 받아 그려서 나중에 자세히 보기에서도 쓴다 (rank-track.md 5) */
  height: number;
  className?: string;
}

/** 위치(0 = 아래, 1 = 위)를 막대 안 top 값으로 */
const top = (pos: number) => `${(1 - pos) * 100}%`;

/**
 * 세로 순위 트랙 (docs/tasks/ui/word-list/rank-track.md 4). 지금은 어디에도 안 붙음: 결과창 플레이 기록에서 쓸 예정 (rank-track.md 5).
 * 왼쪽에 # 글자, 오른쪽에 색 단계 막대. 갱신 표시를 선으로 잇고, 맨 위는 끝점(정답)
 */
const RankTrack: React.FC<RankTrackProps> = ({ marks, end, height, className = "" }) => {
  const shown = visibleLabels(marks, end, LABEL_PX / height);
  const first = marks[0];
  const last = marks[marks.length - 1];
  const pathFrom = first ? trackPosition(first.rank) : null;
  const pathTo = end.kind === "solved" ? TRACK_END_POSITION : last ? trackPosition(last.rank) : null;

  return (
    <div role="img" aria-label="순위 트랙" className={`relative w-10 sm:w-12 ${className}`} style={{ height }}>
      {/* 막대: 오른쪽 끝에서 8px 안쪽, 폭 10px. 칸 색 위로 가운데 2px 길 */}
      <div className="absolute inset-y-0 right-2 w-2.5">
        {TIERS.map((t) => (
          <div
            key={t}
            className={`absolute inset-x-0 border-t border-white ${TIER_FILL[t]} opacity-60`}
            style={{ bottom: `${trackCellBottom(t) * 100}%`, height: `${trackCellSize(t) * 100}%` }}
          />
        ))}
        {pathFrom !== null && pathTo !== null && (
          <div
            className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gray-900"
            style={{ top: top(pathTo), bottom: `${pathFrom * 100}%` }}
          />
        )}
        {marks.map((m, i) => (
          <div key={i} className="absolute -left-0.5 -right-0.5 h-0.5 -translate-y-1/2 bg-gray-900" style={{ top: top(trackPosition(m.rank)) }} />
        ))}
        {/* 끝점: 맞히면 채움, 진행 중·포기는 빈칸 */}
        <div
          className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
            end.kind === "solved" ? "border-gray-900 bg-gray-900" : "border-gray-400 bg-white"
          }`}
          style={{ top: top(TRACK_END_POSITION) }}
        />
      </div>
      {/* 글자: 막대 왼쪽 */}
      <div className="absolute inset-y-0 left-0 right-[22px] text-[11px] leading-3 tabular-nums text-gray-900">
        {marks.map((m, i) =>
          shown[i] ? (
            <span key={i} className="absolute right-0 -translate-y-1/2 flex items-center" style={{ top: top(trackPosition(m.rank)) }}>
              {m.label === "hint" ? <Lightbulb className="h-3 w-3" /> : m.label}
            </span>
          ) : null,
        )}
        {end.kind === "solved" && (
          <span className="absolute right-0 -translate-y-1/2 whitespace-nowrap font-semibold" style={{ top: top(TRACK_END_POSITION) }}>
            {end.attempts}트
          </span>
        )}
      </div>
    </div>
  );
};

export default RankTrack;
