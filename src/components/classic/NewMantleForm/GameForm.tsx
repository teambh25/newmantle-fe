import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGameForm } from "@/hooks/useGameForm";
import { CircleAlert, CornerDownLeft } from "lucide-react";

/** 게임 입력창. 첫 방문 모달이 닫힌 뒤 포커스를 옮길 때 쓴다 */
export const GAME_INPUT_ID = "game-input";
const GAME_INPUT_ERROR_ID = "game-input-error";


interface GameFormProps {
  submitAction: (word: string) => Promise<{ error?: string }>;
  gameCompleted: boolean;
  displayDate?: string;
  /** 날짜 제목 둘째 줄에 타일로 보여줄 정답 정보: 진행 중엔 초성, 끝나면 정답. 없으면 "오늘의 정답은?" (docs/tasks/ui/word-list.md 3-4) */
  reveal?: string | null;
  hintButton?: React.ReactNode;
  giveUpButton?: React.ReactNode;
  /** 입력창 아래 첫 입력 유도 말풍선. 첫 단어를 제출하면 onInputTooltipDone으로 닫는다 */
  showInputTooltip?: boolean;
  onInputTooltipDone?: () => void;
  /** 날짜 제목과 입력창 사이 한 줄 (게임 완료 표시, docs/tasks/ui/result-box.md 요구사항 4) */
  statusBar?: React.ReactNode;
  /** 입력 잠금: 정답·포기 뒤 결과창을 닫을 때까지 (docs/tasks/ui/result-box.md 요구사항 1) */
  inputLocked?: boolean;
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
  statusBar,
  inputLocked = false,
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
  } = useGameForm(
    (word) => {
      // 빈 입력이 아닌 제출일 때만 불린다. 결과(오류 포함)와 무관하게 첫 제출이면 말풍선을 닫는다
      if (showInputTooltip) onInputTooltipDone?.();
      return submitAction(word);
    },
    { keepInputOnError: true }
  );

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
                    // 초성·정답 모두 파랑. 맞힘·포기 구분은 결과창 색이 한다
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
      {statusBar}
      <input
        type="text"
        ref={dummyInputRef}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0 }}
        aria-hidden="true"
      />
      {/* 제출은 엔터. 입력창 안 오른쪽에 힌트·포기 글씨 버튼과 제출(엔터) 아이콘. PC는 폭 420px로 가운데 (docs/tasks/ui/plan.md 4장) */}
      <div className="relative flex items-center sm:max-w-[420px] sm:mx-auto">
        <Input
          type="text"
          value={inputWord}
          onChange={handleInputChange}
          placeholder="단어 입력 후 엔터"
          // 없는 단어: 입력한 단어를 남기고 테두리를 빨갛게, 아래에 경고. 고치기 시작하면 풀린다 (docs/tasks/ui/plan.md 9장)
          aria-invalid={isError}
          aria-describedby={isError ? GAME_INPUT_ERROR_ID : undefined}
          className={`w-full pr-[112px] sm:pr-[176px] placeholder:text-gray-400 ${isError ? "border-red-500" : ""}`}
          disabled={isLoading || inputLocked}
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
          {/* 엔터 아이콘은 PC만. 모바일은 키보드 "보내기"로 제출 (docs/tasks/ui/plan.md 4장) */}
          <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
          <Button
            type="submit"
            disabled={isLoading || inputLocked}
            aria-label="제출"
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex sm:w-8 sm:h-8 text-gray-900"
          >
            <CornerDownLeft className="w-[18px] h-[18px]" />
          </Button>
        </div>
        {/* 입력창과 목록 사이 여백에 겹쳐 띄워 아래 목록이 밀리지 않게 */}
        {isError && errorMessage && (
          <p
            id={GAME_INPUT_ERROR_ID}
            role="alert"
            className="absolute top-full left-1 mt-1 flex items-center gap-1 text-[11px] sm:text-xs text-red-600"
          >
            <CircleAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" aria-hidden="true" />
            {errorMessage}
          </p>
        )}
        {/* 첫 입력 유도 말풍선: 누르면 입력창으로 포커스, 첫 단어를 제출하면 닫힘 (docs/tasks/ui/plan.md 7장) */}
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
