"use client";
import { useState, useEffect } from "react";

export type UITheme = "cartoon" | "classic";

const STORAGE_KEY = "newmantle-ui-theme";

export function useUITheme() {
  const [theme, setTheme] = useState<UITheme>("cartoon");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UITheme | null;
    if (saved === "classic" || saved === "cartoon") {
      setTheme(saved);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: UITheme = prev === "cartoon" ? "classic" : "cartoon";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const setThemeValue = (value: UITheme) => {
    setTheme(value);
    localStorage.setItem(STORAGE_KEY, value);
  };

  return { theme, toggleTheme, setTheme: setThemeValue, mounted };
}
