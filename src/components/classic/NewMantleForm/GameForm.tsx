import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameForm } from "@/hooks/useGameForm";

interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  displayDate?: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
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
          <div className="text-xs text-gray-400 font-medium text-left tracking-wide">
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
            placeholder={errorMessage || "단어 입력"}
            className={`w-full pr-[80px] ${isError
                ? "placeholder-red-500"
                : "placeholder-gray-400"
              }`}
            disabled={isLoading}
            ref={inputRef}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <div className="absolute right-2 flex items-center space-x-0.5 text-gray-500">
            {hintButton}
            {giveUpButton}
          </div>
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
    </form>
  );
};
