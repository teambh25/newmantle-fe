"use client";
import React, { useState } from "react";
import { Settings, X, Palette } from "lucide-react";
import { UITheme } from "@/hooks/useUITheme";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ClassicSurveyForm from "@/components/classic/SurveyForm";
import ExcelSurveyContent from "@/components/excel/SurveyForm";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsButtonProps {
  theme: UITheme;
  onThemeChange: (theme: UITheme) => void;
  variant?: "classic" | "excel";
}

export function SettingsButton({ theme, onThemeChange, variant }: SettingsButtonProps) {
  const [open, setOpen] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const isExcel = variant === "excel";

  return (
    <div className="relative inline-block">
      {/* 설정 버튼 */}
      <button
        id="settings-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="설정"
        className={`flex items-center justify-center transition-all ${isExcel
          ? "w-8 h-8 border border-gray-300 bg-[#f3f2f1] text-[#217346] hover:bg-[#e1dfdd] rounded-sm"
          : "w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          }`}
      >
        {open ? <X size={20} /> : <Settings size={20} />}
      </button>

      {/* 설정 패널 */}
      {open && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 w-64 p-4 ${isExcel
            ? "bg-white border border-gray-300 shadow-xl rounded-sm"
            : "bg-white border border-gray-200 rounded-xl shadow-2xl"
            }`}
        >
          <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-gray-100`}>
            <Palette size={16} className={isExcel ? "text-[#217346]" : "text-gray-500"} />
            <span className={`text-sm ${isExcel ? "font-bold text-[#217346]" : "font-semibold text-gray-700"
              }`}>
              UI 테마
            </span>
          </div>

          <RadioGroup
            value={theme}
            onValueChange={(v) => {
              onThemeChange(v as UITheme);
              setOpen(false);
            }}
            className="flex flex-col gap-3"
          >
            <div className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${theme === "classic"
                ? (isExcel ? "bg-[#217346]/10" : "bg-blue-50")
                : "hover:bg-gray-50"
              }`}>
              <RadioGroupItem
                value="classic"
                id="classic"
                className={isExcel ? "border-[#217346] text-[#217346]" : "border-blue-600 text-blue-600"}
              />
              <label
                htmlFor="classic"
                className={`text-sm cursor-pointer flex-grow ${theme === "classic"
                    ? "font-bold text-gray-900"
                    : "text-gray-600"
                  }`}
              >
                심플
              </label>
            </div>

            <div className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${theme === "excel"
                ? (isExcel ? "bg-[#217346]/10" : "bg-blue-50")
                : "hover:bg-gray-50"
              }`}>
              <RadioGroupItem
                value="excel"
                id="excel"
                className={isExcel ? "border-[#217346] text-[#217346]" : "border-blue-600 text-blue-600"}
              />
              <label
                htmlFor="excel"
                className={`text-sm cursor-pointer flex-grow ${theme === "excel"
                    ? "font-bold text-gray-900"
                    : "text-gray-600"
                  }`}
              >
                엑셀 스타일
              </label>
            </div>
          </RadioGroup>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                setShowSurvey(true);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-gray-50 ${isExcel ? "text-[#217346]" : "text-gray-600"
                }`}
            >
              <MessageSquare size={16} />
              <span className={`text-sm ${isExcel ? "font-bold" : "font-semibold"}`}>
                피드백 남기기
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 피드백 팝업 */}
      <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
        <DialogContent className={`max-w-md ${isExcel ? "p-0 overflow-hidden" : "sm:rounded-xl"}`}>
          {!isExcel && (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                피드백
              </DialogTitle>
            </DialogHeader>
          )}

          <div className={`w-full ${theme === "excel" ? "excel-theme py-8 bg-white" : "p-2"}`}>
            <div className={theme === "excel" ? "" : "bg-gray-50/50 p-6 rounded-lg border border-gray-100"}>
              {theme === "excel" ? (
                <div className="border-y border-[#d4d4d4]">
                  <ExcelSurveyContent startRow={1} />
                </div>
              ) : (
                <ClassicSurveyForm />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
