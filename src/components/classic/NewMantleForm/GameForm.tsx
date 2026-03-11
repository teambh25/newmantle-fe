import React, { useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface GameFormProps {
  inputWord: string;
  setInputWord: (value: string) => void;
  isLoading: boolean;
  gameCompleted: boolean;
  isError: boolean;
  errorMessage: string | null;
  submitWord: () => void;
  displayDate?: string;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
}

export const GameForm: React.FC<GameFormProps> = ({
  inputWord,
  setInputWord,
  isLoading,
  gameCompleted,
  isError,
  errorMessage,
  submitWord,
  displayDate,
  hintButton,
  giveUpButton,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dummyInputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);

  const setFocusWithDebounce = useCallback(() => {
    if (focusTimeoutRef.current !== null) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = window.setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 50);
  }, []);

  useEffect(() => {
    setFocusWithDebounce();
  }, [inputWord, setFocusWithDebounce]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current !== null) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitWord();

    // iOS 버퍼 이슈 해결을 위한 트릭
    if (dummyInputRef.current && inputRef.current) {
      dummyInputRef.current.focus();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFocusWithDebounce();
        });
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
  };

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
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-shrink-0"
        >
          {isLoading ? "제출 중..." : "제출"}
        </Button>
      </div>
    </form>
  );
};
