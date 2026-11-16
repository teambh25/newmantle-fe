import { useCallback, useEffect, useState } from "react";

// 첫 입력 유도 말풍선을 끝냈는지 (docs/tasks/ui/input/plan.md 2)
export const INPUT_TOOLTIP_DONE_KEY = "newmantle_input_tooltip_done";

type TooltipState = "unknown" | "show" | "done";

/** 이 기능 전부터 쓰던 유저인지: 저장된 기록에 단어가 있거나, 로그인 말풍선을 닫은 적 있음 */
function hasPlayedBefore(): boolean {
  if (localStorage.getItem("login-tooltip-dismissed")) return true;
  try {
    const stored = JSON.parse(localStorage.getItem("newmantle_game_data") ?? "null");
    return Array.isArray(stored?.submittedWords) && stored.submittedWords.length > 0;
  } catch {
    return false;
  }
}

/**
 * 입력창 말풍선 "아무 단어나 입력해보세요" 표시 여부.
 * 단어를 한 번도 입력해 본 적 없는 사람에게만, 첫 단어를 제출할 때까지 보여준다.
 * 헤더 말풍선(로그인·통계)은 이게 끝난 뒤에 보여준다 → `done`.
 *
 * 마운트 직후(게임 화면이 기록을 덮어쓰기 전) 한 번 읽는다.
 */
export function useInputTooltip() {
  const [state, setState] = useState<TooltipState>("unknown");

  useEffect(() => {
    let done = true;
    try {
      done = !!localStorage.getItem(INPUT_TOOLTIP_DONE_KEY);
      if (!done && hasPlayedBefore()) {
        localStorage.setItem(INPUT_TOOLTIP_DONE_KEY, "1");
        done = true;
      }
    } catch {
      // 저장소를 쓸 수 없으면 띄우지 않는다
    }
    setState(done ? "done" : "show");
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(INPUT_TOOLTIP_DONE_KEY, "1");
    } catch {
      // 저장 실패 시 이번 방문에서만 닫는다
    }
    setState("done");
  }, []);

  return { show: state === "show", done: state === "done", dismiss };
}
