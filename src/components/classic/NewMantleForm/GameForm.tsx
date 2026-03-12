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
      {displayDate && (
        <div className="text-xs text-gray-400 font-medium mb-1.5 text-left tracking-wide">
          {displayDate}
        </div>
      )}
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
            placeholder={errorMessage || "단어를 입력하세요"}
            className={`w-full pr-[80px] ${
              isError
                ? "border-red-500 placeholder-red-500"
                : "placeholder-gray-400"
            }`}
            disabled={isLoading || gameCompleted}
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
        <Button
          type="submit"
          disabled={isLoading || gameCompleted}
          className="flex-shrink-0"
        >
          {isLoading ? "제출 중..." : "제출"}
        </Button>
      </div>
    </form>
  );
};
