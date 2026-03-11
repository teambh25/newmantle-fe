"use client";
import React, { useState } from "react";
import { Settings, X, Palette } from "lucide-react";
import { UITheme } from "@/hooks/useUITheme";

interface SettingsButtonProps {
  theme: UITheme;
  onThemeChange: (theme: UITheme) => void;
  variant?: "cartoon" | "classic";
}

export function SettingsButton({ theme, onThemeChange, variant }: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const isCartoon = variant === "cartoon";

  return (
    <div className="relative inline-block">
      {/* 설정 버튼 */}
      <button
        id="settings-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="설정"
        className={`flex items-center justify-center transition-all ${
          isCartoon
            ? "w-8 h-8 border-2 border-game-brown bg-white text-game-brown rounded-sm shadow-[3px_3px_0px_#4F200D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            : "w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
        }`}
      >
        {open ? <X size={isCartoon ? 18 : 20} /> : <Settings size={isCartoon ? 18 : 20} />}
      </button>

      {/* 설정 패널 */}
      {open && (
        <div 
          className={`absolute top-full right-0 mt-2 z-50 w-56 p-4 ${
            isCartoon
              ? "bg-white border-4 border-game-brown rounded-sm shadow-[6px_6px_0px_#4F200D]"
              : "bg-white border border-gray-200 rounded-lg shadow-xl"
          }`}
        >
          <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${
            isCartoon ? "border-game-brown border-b-2" : "border-gray-100"
          }`}>
            <Palette size={16} className={isCartoon ? "text-game-brown" : "text-gray-500"} />
            <span className={`text-sm ${
              isCartoon ? "font-black uppercase tracking-wider text-game-brown" : "font-semibold text-gray-700"
            }`}>
              UI 스타일
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              id="theme-cartoon-btn"
              onClick={() => {
                onThemeChange("cartoon");
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                isCartoon
                  ? `font-bold rounded-sm border-2 ${
                      theme === "cartoon"
                        ? "bg-game-brown text-white border-game-brown"
                        : "bg-white text-game-brown border-game-brown hover:bg-game-yellow"
                    }`
                  : `rounded-md ${
                      theme === "cartoon"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`
              }`}
            >
              🎨 카툰 (새 디자인)
            </button>
            <button
              id="theme-classic-btn"
              onClick={() => {
                onThemeChange("classic");
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                isCartoon
                  ? `font-bold rounded-sm border-2 ${
                      theme === "classic"
                        ? "bg-game-brown text-white border-game-brown"
                        : "bg-white text-game-brown border-game-brown hover:bg-game-yellow"
                    }`
                  : `rounded-md ${
                      theme === "classic"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`
              }`}
            >
              📋 클래식 (기존 디자인)
            </button>
          </div>
        </div>
      )}

      {/* 패널 열렸을 때 바깥 클릭 닫기 */}
      {open && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
