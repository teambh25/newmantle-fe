// 로직 레벨: 순위 → 위치 계산 (docs/tasks/ui/word-list/verification.md RT-1). 진행 상황 카드 게이지가 쓴다
import { describe, expect, it } from "vitest";
import { TRACK_END_POSITION, trackCellSize, trackPosition } from "@/utils/rankTrack";

describe("RT-1: 막대 위치", () => {
  it("RT-1-1: 순위가 작을수록 위, 순위 밖이 가장 아래, 끝점이 가장 위", () => {
    for (let r = 1; r < 999; r++) {
      expect(trackPosition(r)).toBeGreaterThan(trackPosition(r + 1));
    }
    expect(trackPosition(999)).toBeGreaterThan(trackPosition(-1));
    expect(TRACK_END_POSITION).toBeGreaterThan(trackPosition(1));
  });

  it("RT-1-2: 정답 쪽 칸일수록 큼", () => {
    const sizes = ([1, 2, 3, 4, 5, 0] as const).map(trackCellSize);
    for (let i = 0; i < sizes.length - 1; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i + 1]);
    }
  });
});

