import React, { useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CornerDownLeft } from "lucide-react";

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
      <input
        type="text"
        ref={dummyInputRef}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        aria-hidden="true"
      />
      <div className="flex flex-row gap-2 mt-4 items-center h-12">
        <div className="flex-grow relative h-full">
          {/* 배경 레이어 */}
          <div className="absolute inset-0 z-0 border-4 border-game-brown bg-white rounded-sm" />
          
          <div className="absolute inset-[4px] z-10 flex flex-row items-center">
            <Input
              type="text"
              value={inputWord}
              onChange={handleInputChange}
              placeholder={errorMessage || "단어를 입력하세요"}
              className={`flex-grow border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full rounded-none text-lg font-bold bg-transparent px-2 ${
                isError
                  ? "placeholder-red-500 text-red-500"
                  : "placeholder-gray-500 text-game-brown"
              }`}
              disabled={isLoading}
              ref={inputRef}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
            />
            
            {/* 구분선 */}
            <div className="w-[4px] h-full bg-game-brown flex-shrink-0" />
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-12 h-full flex items-center justify-center bg-transparent hover:bg-game-yellow transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer rounded-r-sm"
            >
              {isLoading ? (
                <span className="text-xs font-black">...</span>
              ) : (
                <CornerDownLeft size={24} className="font-black text-game-brown" />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 h-full">
          {hintButton}
          {giveUpButton}
        </div>
      </div>
    </form>
  );
};
