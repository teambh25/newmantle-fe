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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼의 기본 제출 동작을 방지합니다.
    handleWordSubmit();
  };

  const handleWordSubmit = () => {
    if (inputWord.trim() === "") return; // 빈 입력 방지

    submitWord();

    // 단어 제출 후 처리
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // 입력 필드의 값을 지우기 전에 선택 상태로 만듭니다.
        inputRef.current.select();
        // 그 다음 틱에 값을 지웁니다.
        requestAnimationFrame(() => {
          setInputWord("");
        });
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Enter 키의 기본 동작을 방지합니다.
      handleWordSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6" autoComplete="off">
      <div className="flex space-x-2">
        <Input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={errorMessage || "단어를 입력하세요"}
          className={`flex-grow ${
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
