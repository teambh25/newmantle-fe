// 로직 레벨 테스트 도구: 화면 없이 게임 상태 훅을 조작한다.
import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import * as amplitude from "@amplitude/analytics-browser";
import confetti from "canvas-confetti";
import { useGameState } from "@/hooks/useGameState";
import { useToast } from "@/components/ui/use-toast";
import { getKSTDateString } from "@/utils/date";
import { ANSWER, gameServer } from "./fakeGameServer";

export const GAME_DATE = getKSTDateString();

export function renderGame() {
  const hook = renderHook(() => ({
    game: useGameState(GAME_DATE, "classic"),
    toast: useToast(),
  }));
  // 토스트 상태는 모듈 전역이라 이전 테스트의 토스트를 닫아 둔다
  act(() => hook.result.current.toast.dismiss());

  const g = () => hook.result.current.game;

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    let out!: T;
    await act(async () => {
      out = await fn();
    });
    return out;
  };

  return {
    ...hook,
    get game() {
      return g();
    },
    /** 현재 열려 있는 토스트가 실패(destructive) 안내인지 */
    failureToastShown() {
      return hook.result.current.toast.toasts.some(
        (t) => t.open !== false && t.variant === "destructive"
      );
    },
    dismissToasts() {
      act(() => hook.result.current.toast.dismiss());
    },

    // ---- 행동 ----
    submit(word: string, rank?: number) {
      if (rank !== undefined) gameServer.setRank(word, rank);
      return run(() => g().submitWordAction(word));
    },
    submitAnswer() {
      return run(() => g().submitWordAction(ANSWER.word));
    },
    hint() {
      return run(() => g().requestHint());
    },
    consonant() {
      return run(() => g().requestInitialConsonantHint());
    },
    giveUp() {
      return run(() => g().giveUp());
    },
    /** 응답을 기다리지 않고 요청만 시작한다 (요청 중 상태 재현용) */
    start(action: "hint" | "consonant" | "giveUp" | "submit", word?: string) {
      let p!: Promise<unknown>;
      act(() => {
        const game = g();
        p =
          action === "hint"
            ? game.requestHint()
            : action === "consonant"
            ? game.requestInitialConsonantHint()
            : action === "giveUp"
            ? game.giveUp()
            : game.submitWordAction(word!);
      });
      return p;
    },
    settle(p: Promise<unknown>) {
      return run(async () => {
        await p;
      });
    },
  };
}

export type GameHarness = ReturnType<typeof renderGame>;

// ---- 사전 상태 프리셋 ----

let wordSeq = 0;
const nextWord = () => `단어${++wordSeq}`;

export const presets = {
  /** 순위 밖(-1) 입력 2개 */
  async OUT_ONLY(h: GameHarness) {
    await h.submit(nextWord(), -1);
    await h.submit(nextWord(), -1);
  },
  /** 최고 순위 n위 입력 1개 + 순위 밖 입력 1개 */
  async TOP(h: GameHarness, n: number) {
    await h.submit(nextWord(), n);
    await h.submit(nextWord(), -1);
  },
  /** 초성 힌트만 사용 */
  async CONSONANT_USED(h: GameHarness) {
    await h.consonant();
  },
  /** k번째 입력에 정답 (앞은 순위 밖) */
  async SOLVED(h: GameHarness, k: number) {
    for (let i = 1; i < k; i++) await h.submit(nextWord(), -1);
    await h.submitAnswer();
  },
  /** 순위 밖 입력 n개 후 포기 */
  async GIVEN_UP(h: GameHarness, n: number) {
    for (let i = 0; i < n; i++) await h.submit(nextWord(), -1);
    await h.giveUp();
  },
  /** 겹치지 않는 새 단어 */
  nextWord,
};

// ---- 외부 기록 확인 ----

export function amplitudeEvents(name: string): Record<string, unknown>[] {
  return vi
    .mocked(amplitude.track)
    .mock.calls.filter(([event]) => event === name)
    .map(([, props]) => (props ?? {}) as Record<string, unknown>);
}

/** 축하 효과가 실행됐는지 (효과는 일정 간격으로 그려지므로 그 간격만큼 시간을 진행한다) */
export function confettiFired(): boolean {
  act(() => {
    vi.advanceTimersByTime(500);
  });
  return vi.mocked(confetti).mock.calls.length > 0;
}
