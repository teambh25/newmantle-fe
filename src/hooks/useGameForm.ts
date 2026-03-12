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
