import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameForm } from "@/hooks/useGameForm";
import { CornerDownLeft } from "lucide-react";

/** 게임 입력창. 첫 방문 모달이 닫힌 뒤 포커스를 옮길 때 쓴다 */
export const GAME_INPUT_ID = "game-input";


interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  displayDate?: string;
  /** 날짜 제목 둘째 줄에 타일로 보여줄 정답 정보: 진행 중엔 초성, 끝나면 정답. 없으면 "오늘의 정답은?" (docs/tasks/ui/word-list/plan.md 4) */
  reveal?: string | null;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
  /** 입력창 아래 첫 입력 유도 말풍선. 첫 단어를 제출하면 onInputTooltipDone으로 닫는다 */
  showInputTooltip?: boolean;
  onInputTooltipDone?: () => void;
  /** 힌트·초성 힌트·포기 실패 안내 (카드 배너에 뜸). 여기서는 뜨면 제출 실패 표시를 푸는 데만 쓴다 */
  requestError?: string | null;
  /** 입력창 글자를 고칠 때. 요청 실패 안내를 닫는 데 쓴다 */
  onInputEdit?: () => void;
}

export const GameForm: React.FC<GameFormProps> = ({
  submitAction,
  gameCompleted,
  displayDate,
  reveal,
  hintButton,
  giveUpButton,
  showInputTooltip = false,
  onInputTooltipDone,
  requestError = null,
  onInputEdit,
}) => {
  const {
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
  } = useGameForm(
    (word) => {
      // 빈 입력이 아닌 제출일 때만 불린다. 결과(오류 포함)와 무관하게 첫 제출이면 말풍선을 닫는다
      if (showInputTooltip) onInputTooltipDone?.();
      return submitAction(word);
    },
    { keepInputOnFailure: true }
  );

  // 안내는 한 번에 하나. 힌트·포기 실패가 뜨면 없는 단어·제출 실패 표시는 푼다 (docs/tasks/ui/input/plan.md 3)
  useEffect(() => {
    if (requestError) clearError();
  }, [requestError, clearError]);

  // 안내(없는 단어·요청 실패)는 진행 상황 카드 배너가 맡는다 (docs/tasks/ui/progress-card/plan.md 3). 입력창 쪽은:
  // 제출 실패: 단어를 남겨 엔터만 다시 누르면 되게 하고, 빨간 테두리 + 옅은 빨간 배경으로 막힌 느낌만
  const submitFailure = !requestError && isError && errorTone === "error";
  const inputStyle = submitFailure ? "border-red-500 bg-red-50 placeholder:text-gray-400" : "placeholder:text-gray-400";

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6 relative" autoComplete="off">
      {/* 날짜 제목. 타일이 생기거나 날짜를 불러오기 전에도 높이가 그대로이도록 줄마다 높이 고정 */}
      <h2 className="mt-4 sm:mt-6 mb-3 text-center">
        <span className="block h-5 sm:h-6 text-sm sm:text-base leading-5 sm:leading-6 font-medium text-gray-500 tracking-wide">{displayDate}</span>
        <span className="mt-0.5 flex h-8 sm:h-9 items-center justify-center gap-1.5 text-xl sm:text-2xl font-bold text-gray-900">
          {reveal ? (
            <>
              오늘의 정답
              {/* 스크린 리더는 타일을 한 글자씩이 아니라 한 단어로 읽게 */}
              <span className="sr-only">{reveal}</span>
              <span className="flex gap-1" aria-hidden="true">
                {Array.from(reveal).map((ch, i) => (
                  <span
                    key={i}
                    // 초성·정답 모두 파랑. 맞힘·포기 구분은 결과 상자 색이 한다
                    className="inline-flex h-7 min-w-7 sm:h-8 sm:min-w-8 px-1 items-center justify-center rounded text-lg sm:text-xl leading-none bg-blue-100 text-blue-700"
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </>
          ) : (
            "오늘의 정답은?"
          )}
        </span>
      </h2>
      <input
        type="text"
        ref={dummyInputRef}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        aria-hidden="true"
      />
      {/* 제출은 엔터. 입력창 안 오른쪽에 힌트·포기 글씨 버튼과 제출(엔터) 아이콘. PC는 폭 420px로 가운데 (docs/tasks/ui/input/plan.md 1) */}
      <div className="relative flex items-center sm:max-w-[420px] sm:mx-auto">
        <Input
          type="text"
          value={inputWord}
          onChange={(e) => {
            handleInputChange(e);
            onInputEdit?.();
          }}
          placeholder="단어 입력 후 엔터"
          className={`w-full pr-[112px] sm:pr-[176px] ${inputStyle}`}
          disabled={isLoading}
          ref={inputRef}
          id={GAME_INPUT_ID}
          enterKeyHint="send"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <div className="absolute right-1 flex items-center">
          {hintButton}
          {giveUpButton}
          {/* 엔터 아이콘은 PC만. 모바일은 키보드 "보내기"로 제출 (docs/tasks/ui/input/plan.md 1) */}
          <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
          <Button
            type="submit"
            disabled={isLoading}
            aria-label="제출"
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex sm:w-8 sm:h-8 text-gray-900"
          >
            <CornerDownLeft className="w-[18px] h-[18px]" />
          </Button>
        </div>
        {/* 첫 입력 유도 말풍선: 누르면 입력창으로 포커스, 첫 단어를 제출하면 닫힘 (docs/tasks/ui/input/plan.md 2) */}
        {showInputTooltip && (
          <button
            type="button"
            aria-label="입력 안내"
            onClick={() => inputRef.current?.focus()}
            className="absolute top-full left-3 mt-2 bg-white text-gray-700 text-xs rounded-md px-2 py-1.5 whitespace-nowrap leading-tight shadow-md border border-gray-200 z-10"
          >
            아무 단어나 입력해보세요 ✍️
            <span className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-gray-200 rotate-45" />
          </button>
        )}
      </div>
    </form>
  );
};
