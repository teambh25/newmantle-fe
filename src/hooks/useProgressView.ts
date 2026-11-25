"use client";
// 방금 입력 모양 저장·분석. 테마(useUITheme)와 같은 방식: localStorage + Amplitude 사용자 속성(전환 이벤트 없음, docs/specs/amplitude-migration Dec-29)
// 테마마다 따로 저장한다 (docs/specs/progress-view-toggle Dec-5, Dec-9, Dec-19)
import { useEffect, useState } from "react";
import { setUserProperties } from "@/utils/amplitude";
import { parseProgressViewSetting } from "@/utils/analytics";
import {
  parseProgressView,
  PROGRESS_VIEW_CONFIG,
  type ProgressViewOf,
  type ProgressViewTheme,
} from "@/utils/progressView";

export function useProgressView<T extends ProgressViewTheme = "classic">(theme: T = "classic" as T) {
  const { storageKey, userProperty } = PROGRESS_VIEW_CONFIG[theme];
  const [view, setViewState] = useState<ProgressViewOf<T>>(() => parseProgressView(null, theme));
  // 저장값을 읽기 전에는 방금 입력 자리를 그리지 않는다 (게이지가 잠깐 보였다가 바뀌는 깜빡임 방지)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      // 저장소를 못 쓰면 기본값
    }
    const { value: initial, chosen } = parseProgressViewSetting(saved, theme);
    setViewState(initial);
    setUserProperties({ [userProperty]: initial, [`${userProperty}_chosen`]: chosen });
    setReady(true);
  }, [storageKey, userProperty, theme]);

  const setView = (next: ProgressViewOf<T>) => {
    if (next === view) return;
    setViewState(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // 저장 못 해도 이번 화면에서는 바뀐다
    }
    setUserProperties({ [userProperty]: next, [`${userProperty}_chosen`]: true });
  };

  return { view, setView, ready };
}
