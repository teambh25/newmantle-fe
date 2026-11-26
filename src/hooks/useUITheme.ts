"use client";
import { useState, useEffect } from "react";
import { setUserProperties } from "@/utils/amplitude";
import { parseThemeSetting } from "@/utils/analytics";

export type UITheme = "classic" | "excel";

const STORAGE_KEY = "newmantle-ui-theme";

// 테마는 사용자 속성으로만 남긴다. 전환 이벤트는 보내지 않는다 (docs/specs/amplitude-migration Dec-19, Dec-29)
export function useUITheme() {
  const [theme, setTheme] = useState<UITheme>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // 저장소를 못 쓰면 기본값
    }
    const { value, chosen } = parseThemeSetting(saved);
    setTheme(value);
    // 게임 화면(Game Page Visited)보다 먼저 보낸다. 게임 화면은 mounted 이후에 그려진다 (Dec-29)
    setUserProperties({ theme: value, theme_chosen: chosen });
    setMounted(true);
  }, []);

  const setThemeValue = (value: UITheme) => {
    setTheme(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // 저장 못 해도 이번 화면에서는 바뀐다
    }
    setUserProperties({ theme: value, theme_chosen: true });
  };

  return { theme, setTheme: setThemeValue, mounted };
}
