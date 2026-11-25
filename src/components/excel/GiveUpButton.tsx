import React, { useRef, useState } from "react";
import { Flag, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GiveUpButtonProps {
  onGiveUp: () => void;
  disabled: boolean;
  onInitialConsonantHint: () => void;
  initialConsonantHintUsed: boolean;
  /** 확인 창 문구에 쓰는 엑셀 파일 이름 */
  fileName: string;
}

const GiveUpButton: React.FC<GiveUpButtonProps> = ({
  onGiveUp,
  disabled,
  onInitialConsonantHint,
  initialConsonantHintUsed,
  fileName,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  // 계속 플레이 쪽 버튼을 기본 선택으로 둔다 (C-2).
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  const handleGiveUp = () => {
    setDialogOpen(false);
    onGiveUp();
  };

  const handleInitialConsonantHint = () => {
    setDialogOpen(false);
    onInitialConsonantHint();
  };

  // 엑셀 "저장하지 않고 닫기" 확인 창처럼: 버튼은 모두 회색, 기본 선택(계속 플레이 쪽)만 테두리를 진하게 (C-2: 포기 쪽을 색으로 경고하지 않음)
  const buttonBase =
    "sm:min-w-[5.5rem] px-3 py-1 border bg-[#fdfdfd] text-[13px] text-gray-900 hover:bg-[#e5f1fb] hover:border-[#0078d4] focus-visible:outline-none";
  const defaultButton = `${buttonBase} border-gray-600 border-2`;
  const otherButton = `${buttonBase} border-[#d0d0d0]`;

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                disabled={disabled}
                aria-label="포기"
                className="flex items-center justify-center w-7 h-7 hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Flag size={18} />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Give Up</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="excel-theme border border-gray-300 rounded-none shadow-xl p-0 overflow-hidden max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          <div className="bg-white border-b border-gray-200 px-4 py-2 text-[13px] text-gray-800">NewMantle</div>
          <div className="px-5 pt-5 pb-4 bg-white">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-8 w-8 shrink-0 text-amber-500" aria-hidden="true" />
              <div className="min-w-0">
                <DialogTitle className="text-[15px] font-normal text-black break-all">
                  {fileName}을 포기하시겠습니까?
                </DialogTitle>
                {/* 포기 결과를 창에 명시 (docs/rules/hint-giveup.md C-2) */}
                <DialogDescription className="mt-1 text-[13px] text-gray-600 leading-relaxed">
                  포기하면 정답이 공개되고, 이후 입력하는 단어는 오늘 기록에 반영되지 않아요.
                </DialogDescription>
              </div>
            </div>
            {/* 엑셀처럼 [계속 플레이 쪽] [포기하기] [취소] 순서, 취소는 맨 오른쪽 (docs/specs/excel-ui Dec-66) */}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {!initialConsonantHintUsed && (
                <button ref={continueButtonRef} onClick={handleInitialConsonantHint} className={defaultButton}>
                  초성 힌트 받기
                </button>
              )}
              <button onClick={handleGiveUp} className={otherButton}>
                포기하기
              </button>
              <button
                ref={initialConsonantHintUsed ? continueButtonRef : undefined}
                onClick={() => setDialogOpen(false)}
                className={initialConsonantHintUsed ? defaultButton : otherButton}
              >
                취소
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiveUpButton;
