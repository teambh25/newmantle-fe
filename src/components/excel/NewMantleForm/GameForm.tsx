import React from "react";
import { Check, X } from "lucide-react";
import { useGameForm } from "@/hooks/useGameForm";

interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  /** 입력창에 글자를 치면 (실패 안내 닫기) */
  onInputEdit?: () => void;
  /** 이름 상자에 보일 선택된 셀 주소 (예: B5) */
  cellAddress: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
  onInputEdit,
  cellAddress,
  hintButton,
  giveUpButton,
}) => {
  const {
    inputWord,
    isLoading,
    isError,
    errorMessage,
    inputRef,
    dummyInputRef,
    handleInputChange,
    handleSubmit,
    clearInput,
  } = useGameForm(submitAction);
  // 엑셀에서 셀을 편집하는 동안처럼 ✕ ✓가 살아난다 (specs/excel-ui Dec-70)
  const editing = inputWord.length > 0 && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex border-b border-[#d4d4d4] w-full bg-white items-stretch h-10 relative shadow-sm" autoComplete="off">
      {/* 이름 상자: 엑셀처럼 선택된 셀 주소. 날짜는 파일 이름(헤더)에 (specs/excel-ui Dec-38, Dec-69) */}
      <div className="hidden sm:flex items-center justify-center w-[48px] border-r border-[#d4d4d4] text-[11px] font-sans text-gray-500 select-none bg-white font-medium text-center leading-tight relative overflow-visible z-10">
        {cellAddress}
      </div>
      {/* ✕ 입력 취소 · ✓ 입력 · fx (Dec-70). 모바일은 입력칸이 좁아서 이름 상자와 ✕ ✓를 숨기고 fx만 (Dec-73) */}
      <div className="flex items-center bg-[#f3f2f1] border-r border-[#d4d4d4] px-1 select-none">
        <button
          type="button"
          onClick={clearInput}
          disabled={!editing}
          aria-label="입력 취소"
          className="hidden sm:flex w-6 h-6 items-center justify-center text-red-600 disabled:text-gray-300 hover:bg-gray-200 disabled:hover:bg-transparent"
        >
          <X size={15} aria-hidden="true" />
        </button>
        <button
          type="submit"
          disabled={!editing}
          aria-label="입력"
          className="hidden sm:flex w-6 h-6 items-center justify-center text-[#217346] disabled:text-gray-300 hover:bg-gray-200 disabled:hover:bg-transparent"
        >
          <Check size={15} aria-hidden="true" />
        </button>
        <span className="px-2 text-[#444] font-serif italic font-bold text-base">fx</span>
      </div>

      <div className="flex-grow flex items-center relative h-full">
        <input
          type="text"
          value={inputWord}
          onChange={(e) => {
            handleInputChange(e);
            onInputEdit?.();
          }}
          placeholder={errorMessage || "단어 입력"}
          className="w-full h-full px-4 outline-none text-base bg-transparent font-sans text-black"
          disabled={isLoading}
          ref={inputRef}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <div className="flex items-center space-x-1 px-2">
        {hintButton}
        {giveUpButton}
      </div>

      <div className="flex items-center h-full border-l border-[#d4d4d4]">
        <button
          type="submit"
          disabled={isLoading}
          className="h-full px-3 sm:px-8 bg-[#217346] text-white text-sm font-bold hover:bg-[#1a5a37] disabled:bg-gray-300 transition-colors uppercase tracking-tighter"
        >
          Enter
        </button>
      </div>

      <input
        type="text"
        ref={dummyInputRef}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        aria-hidden="true"
      />
    </form>
  );
};
