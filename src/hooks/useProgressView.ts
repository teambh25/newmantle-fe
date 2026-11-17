"use client";
// classic 방금 입력 모양 저장·분석. 테마(useUITheme)와 같은 방식: localStorage + Amplitude 사용자 속성 + 전환 이벤트
// (docs/specs/progress-view-toggle Dec-5, Dec-9)
import { useEffect, useState } from "react";
import { logEvent, setUserProperty } from "@/utils/amplitude";
import { parseProgressView, PROGRESS_VIEW_STORAGE_KEY, type ProgressView } from "@/utils/progressView";

export function useProgressView() {
  const [view, setViewState] = useState<ProgressView>("card");
  // 저장값을 읽기 전에는 방금 입력 자리를 그리지 않는다 (카드가 잠깐 보였다가 바뀌는 깜빡임 방지)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(PROGRESS_VIEW_STORAGE_KEY);
    } catch {
      // 저장소를 못 쓰면 기본값
    }
    const initial = parseProgressView(saved);
    setViewState(initial);
    setUserProperty("progress_view", initial);
    setReady(true);
  }, []);

  const setView = (next: ProgressView) => {
    if (next === view) return;
    setViewState(next);
    try {
      localStorage.setItem(PROGRESS_VIEW_STORAGE_KEY, next);
    } catch {
      // 저장 못 해도 이번 화면에서는 바뀐다
    }
    setUserProperty("progress_view", next);
    logEvent("Progress View Switched", { view: next });
  };

  return { view, setView, ready };
}
