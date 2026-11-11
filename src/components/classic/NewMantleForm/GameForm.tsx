import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameForm } from "@/hooks/useGameForm";
import { CornerDownLeft } from "lucide-react";

/** 게임 입력창. 첫 방문 모달이 닫힌 뒤 포커스를 옮길 때 쓴다 */
export const GAME_INPUT_ID = "game-input";

interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  displayDate?: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
  /** 입력창 아래 첫 입력 유도 말풍선. 첫 단어를 제출하면 onInputTooltipDone으로 닫는다 */
  showInputTooltip?: boolean;
  onInputTooltipDone?: () => void;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
  displayDate,
  hintButton,
  giveUpButton,
  showInputTooltip = false,
  onInputTooltipDone,
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
  } = useGameForm((word) => {
    // 빈 입력이 아닌 제출일 때만 불린다. 결과(오류 포함)와 무관하게 첫 제출이면 말풍선을 닫는다
    if (showInputTooltip) onInputTooltipDone?.();
    return submitAction(word);
  });

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6 relative" autoComplete="off">
      <div className="flex items-center space-x-2 mb-1.5 min-h-[16px]">
        {displayDate && (
          <div className="text-xs text-gray-900 font-medium text-left tracking-wide">
            {displayDate}
          </div>
        )}
      </div>
      <input
        type="text"
        ref={dummyInputRef}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        aria-hidden="true"
      />
      {/* 제출은 엔터. 입력창 안 오른쪽에 힌트·포기 글씨 버튼과 제출(엔터) 아이콘 (docs/tasks/ui/plan.md 4장) */}
      <div className="relative flex items-center">
        <Input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          placeholder={
            errorMessage ||
            "단어 입력 후 엔터"
          }
          className={`w-full pr-[148px] sm:pr-[176px] ${isError
              ? "placeholder-red-500"
              : "placeholder-gray-400"
            }`}
          disabled={isLoading}
          ref={inputRef}
          id={GAME_INPUT_ID}
          enterKeyHint="send"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <div className="absolute right-1 flex items-center">
          {hintButton}
          {giveUpButton}
          <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
          <Button
            type="submit"
            disabled={isLoading}
            aria-label="제출"
            variant="ghost"
            size="icon"
            className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900"
          >
            <CornerDownLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </Button>
        </div>
        {/* 첫 입력 유도 말풍선: 누르면 입력창으로 포커스, 첫 단어를 제출하면 닫힘 (docs/tasks/ui/plan.md 7장) */}
        {showInputTooltip && (
          <button
            type="button"
            aria-label="입력 안내"
            onClick={() => inputRef.current?.focus()}
            className="absolute top-full left-3 mt-2 bg-white text-gray-700 text-xs rounded-md px-2 py-1.5 whitespace-nowrap leading-tight shadow-md border border-gray-200 z-10"
          >
            아무 단어나 입력해보세요 ✍️
            <span className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45" />
          </button>
        )}
      </div>
    </form>
  );
};
