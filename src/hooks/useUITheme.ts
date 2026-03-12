"use client";
import { useState, useEffect } from "react";

export type UITheme = "classic" | "excel";

const STORAGE_KEY = "newmantle-ui-theme";

export function useUITheme() {
  const [theme, setTheme] = useState<UITheme>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UITheme | null;
    if (saved === "classic" || saved === "excel") {
      setTheme(saved);
    } else {
      setTheme("classic");
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      let next: UITheme;
      if (prev === "classic") next = "excel";
      else next = "classic";
      
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
