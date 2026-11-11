import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameForm } from "@/hooks/useGameForm";

interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  /** 아직 입력한 단어가 없으면 첫 단어 입력을 유도하는 문구를 보여준다 */
  hasSubmittedWords: boolean;
  displayDate?: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
  hasSubmittedWords,
  displayDate,
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
  } = useGameForm(submitAction);

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
      <div className="flex space-x-2">
        <div className="relative flex-grow flex items-center">
          <Input
            type="text"
            value={inputWord}
            onChange={handleInputChange}
            placeholder={
              errorMessage ||
              (hasSubmittedWords ? "단어 입력" : "아무 단어나 입력해보세요")
            }
            className={`w-full ${isError
                ? "placeholder-red-500"
                : "placeholder-gray-400"
              }`}
            disabled={isLoading}
            ref={inputRef}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="flex-shrink-0 flex flex-col items-center justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            제출
          </Button>
        </div>
      </div>
      {/* 힌트·포기: 입력창 아래 오른쪽 (docs/tasks/ui/plan.md 4장, 프로토타입. 위치는 미정) */}
      <div className="flex justify-end items-center gap-1 mt-1.5">
        {hintButton}
        {giveUpButton}
      </div>
    </form>
  );
};
