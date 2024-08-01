// src/components/GameForm.tsx
import React, { useRef, useEffect } from "react";
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
}

export const GameForm: React.FC<GameFormProps> = ({
  inputWord,
  setInputWord,
  isLoading,
  gameCompleted,
  isError,
  errorMessage,
  submitWord,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (form) {
      const handleFormSubmit = (e: Event) => {
        e.preventDefault();
        submitWord();
        inputRef.current?.focus();
      };
      form.addEventListener("submit", handleFormSubmit);
      return () => {
        form.removeEventListener("submit", handleFormSubmit);
      };
    }
  }, [submitWord]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
  };

  return (
    <form ref={formRef} className="w-full mb-6">
      <div className="flex space-x-2">
        <Input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          placeholder={errorMessage || "단어를 입력하세요"}
          className={`flex-grow ${
            isError
              ? "border-red-500 placeholder-red-500"
              : "placeholder-gray-400"
          }`}
          disabled={isLoading || gameCompleted}
          ref={inputRef}
          autoComplete="off"
          onFocus={(e) => e.target.scrollIntoView(false)}
        />
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
