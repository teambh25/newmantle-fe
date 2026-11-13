import { useState, useRef, useEffect, useCallback } from "react";

interface GameFormOptions {
  /** 요청 실패(tone "error")면 입력한 단어를 남겨 엔터만 다시 누르면 되게 하고, 글자를 치기 시작하면 오류를 푼다.
   *  없는 단어(tone "warning")는 비운다 (classic, docs/tasks/ui/plan.md 9장 6차, 11장) */
  keepInputOnFailure?: boolean;
}

/** warning: 내 입력이 잘못됨(없는 단어), error: 요청 실패 (docs/tasks/ui/plan.md 11장) */
export type GameFormErrorTone = "warning" | "error";

export function useGameForm(
  submitAction: (word: string) => Promise<{ error?: string; tone?: GameFormErrorTone }>,
  { keepInputOnFailure = false }: GameFormOptions = {}
) {
  const [inputWord, setInputWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTone, setErrorTone] = useState<GameFormErrorTone>("warning");

  const inputRef = useRef<HTMLInputElement>(null);
  const dummyInputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);

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
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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

    let keepInput = false;
    if (result && result.error) {
      if (result.error !== "이미 제출한 단어입니다") {
        setIsError(true);
        setErrorMessage(result.error);
        const tone = result.tone ?? "warning";
        setErrorTone(tone);
        keepInput = keepInputOnFailure && tone === "error";
      }
    }

    if (!keepInput) setInputWord("");
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

  /** 다른 안내(힌트 실패 등)가 대신 뜰 때도 오류를 푼다 */
  const clearError = useCallback(() => {
    setIsError(false);
    setErrorMessage(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
    if (keepInputOnFailure && isError) clearError();
  };

  return {
    inputWord,
    isLoading,
    isError,
    errorMessage,
    errorTone,
    inputRef,
    dummyInputRef,
    handleInputChange,
    handleSubmit,
    clearError,
  };
}
