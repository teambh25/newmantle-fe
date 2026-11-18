import { useCallback, useEffect, useState } from "react";
import type { ProgressViewTheme } from "@/utils/progressView";
import { PROGRESS_VIEW_TOOLTIP_DONE_KEY, shouldShowProgressViewTooltip } from "@/utils/progressViewTooltip";

type TooltipState = "unknown" | "show" | "done";

/**
 * 보기 방식 말풍선 표시 여부 (docs/specs/progress-view-toggle Dec-27~40).
 * 끝나기 전(`done`이 아님)에는 뒤 순서의 헤더·로그인 말풍선이 기다린다 (Dec-32, Dec-34)
 */
export function useProgressViewTooltip(theme: ProgressViewTheme) {
  const [state, setState] = useState<TooltipState>("unknown");

  useEffect(() => {
    let show = false;
    try {
      show = shouldShowProgressViewTooltip(theme, localStorage);
    } catch {
      // localStorage 접근 자체가 막히면 띄우지 않는다 (Dec-40)
    }
    setState(show ? "show" : "done");
  }, [theme]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(PROGRESS_VIEW_TOOLTIP_DONE_KEY[theme], "1");
    } catch {
      // 저장 실패 시 이번 방문에서만 닫는다
    }
    setState("done");
  }, [theme]);

  return { show: state === "show", done: state === "done", dismiss };
}
