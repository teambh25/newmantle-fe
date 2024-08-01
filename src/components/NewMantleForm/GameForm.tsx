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
  const dummyInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitWord();
    setInputWord("");

    // iOS 버퍼 이슈 해결을 위한 트릭
    if (dummyInputRef.current && inputRef.current) {
      dummyInputRef.current.focus();
      // 약간의 지연 후 실제 입력 필드로 포커스 이동
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
  };

  // 컴포넌트가 마운트되거나 업데이트될 때마다 입력 필드에 포커스
  useEffect(() => {
    if (inputRef.current && !isLoading && !gameCompleted) {
      inputRef.current.focus();
    }
  }, [isLoading, gameCompleted]);

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6" autoComplete="off">
      <div className="flex space-x-2">
        <input
          type="text"
          ref={dummyInputRef}
          style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
          aria-hidden="true"
        />
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
