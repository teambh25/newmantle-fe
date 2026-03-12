import React from "react";
import { useGameForm } from "@/hooks/useGameForm";

interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  displayDate?: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
  currentCombo?: number;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
  displayDate,
  hintButton,
  giveUpButton,
  currentCombo = 0,
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
  } = useGameForm(submitAction);

  return (
    <form onSubmit={handleSubmit} className="flex border-b border-[#d4d4d4] w-full bg-white items-stretch h-10 relative shadow-sm" autoComplete="off">
      <div className="flex items-center justify-center w-[48px] border-r border-[#d4d4d4] text-[11px] font-sans text-gray-500 select-none bg-white font-medium text-center leading-tight relative overflow-visible z-10">
        {displayDate?.replace(' ', '') || "B3"}
        {currentCombo >= 2 && (
          <div 
            key={currentCombo}
            className="absolute left-[54px] text-[11px] font-bold text-[#217346] whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.8)] bg-white/60 px-0.5 rounded"
          >
            {currentCombo} 콤보!
          </div>
        )}
      </div>
      <div className="flex items-center px-4 bg-[#f3f2f1] border-r border-[#d4d4d4] text-[#444] font-serif italic font-bold text-base select-none">
        fx
      </div>
      
      <div className="flex-grow flex items-center relative h-full">
         <input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          placeholder={errorMessage || "단어를 입력하세요..."}
          className="w-full h-full px-4 outline-none text-base bg-transparent font-sans text-black"
          disabled={isLoading}
          ref={inputRef}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
        />
        {displayDate && (
          <div className="absolute right-0 opacity-0 pointer-events-none">
            Sheet: {displayDate}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1 px-2">
        {hintButton}
        {giveUpButton}
      </div>

      <div className="flex items-center h-full border-l border-[#d4d4d4]">
        <button
          type="submit"
          disabled={isLoading}
          className="h-full px-8 bg-[#217346] text-white text-sm font-bold hover:bg-[#1a5a37] disabled:bg-gray-300 transition-colors uppercase tracking-tighter"
        >
          {isLoading ? "Wait" : "Enter"}
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
