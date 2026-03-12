import { useState, useRef, useEffect, useCallback } from "react";

export function useGameForm(submitAction: (word: string) => Promise<{ error?: string }>) {
  const [inputWord, setInputWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedWord = inputWord.trim();
    if (!trimmedWord || isLoading) return;

    // iOS 키보드 안 내려가게 하는 트릭 (핵심: API 호출(await) 전에 동기적으로 실행되어야 함)
    // 원래 input이 disabled 되기 전에 dummy로 포커스를 옮겨서 키보드 상태를 유지
    if (dummyInputRef.current) {
      dummyInputRef.current.focus();
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    const result = await submitAction(trimmedWord);

    if (result && result.error) {
      setIsError(true);
      setErrorMessage(result.error);
    }
    
    setInputWord("");
    setIsLoading(false);

    // 결과를 받은 후(isLoading false) 다시 input으로 포커스
    if (dummyInputRef.current && inputRef.current) {
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

  return {
    inputWord,
    isLoading,
    isError,
    errorMessage,
    inputRef,
    dummyInputRef,
    handleInputChange,
    handleSubmit,
  };
}
