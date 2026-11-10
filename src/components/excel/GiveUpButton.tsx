import React, { useRef, useState } from "react";
import { Flag } from "lucide-react";
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
}

const GiveUpButton: React.FC<GiveUpButtonProps> = ({
  onGiveUp,
  disabled,
  onInitialConsonantHint,
  initialConsonantHintUsed,
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

  const continueClass =
    "px-4 py-1.5 border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5a37] text-sm font-medium";
  const giveUpClass =
    "px-4 py-1.5 border border-red-600 bg-red-600 text-white hover:bg-red-700 text-sm font-medium";

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
          className="excel-theme border border-gray-300 rounded-none shadow-xl p-0 overflow-hidden"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          <div className="bg-[#217346] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
            <span>Microsoft NewMantle - Confirm Action</span>
          </div>
          <div className="p-6 bg-white">
            <DialogTitle className="text-lg font-bold mb-4 text-black">
              정말 포기하시겠습니까?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-700 mb-6 leading-relaxed">
              포기하면 정답이 공개되고, 이후 입력하는 단어는 오늘 기록에 반영되지 않아요.
            </DialogDescription>
            <div className="flex flex-wrap justify-end gap-2">
              {!initialConsonantHintUsed ? (
                <>
                  <button
                    ref={continueButtonRef}
                    onClick={handleInitialConsonantHint}
                    className={continueClass}
                  >
                    초성 힌트 받고 계속 도전하기
                  </button>
                  <button onClick={handleGiveUp} className={giveUpClass}>
                    정말로 포기할래요
                  </button>
                </>
              ) : (
                <>
                  <button
                    ref={continueButtonRef}
                    onClick={() => setDialogOpen(false)}
                    className={continueClass}
                  >
                    계속 도전하기
                  </button>
                  <button onClick={handleGiveUp} className={giveUpClass}>
                    포기하기
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiveUpButton;
