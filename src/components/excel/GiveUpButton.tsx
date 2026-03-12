import React, { useState } from "react";
import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [firstClickDone, setFirstClickDone] = useState(false);

  const handleClick = () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    if (!firstClickDone && !initialConsonantHintUsed) {
      onInitialConsonantHint();
      setFirstClickDone(true);
      return;
    }

    setDialogOpen(true);
  };

  const handleGiveUp = () => {
    onGiveUp();
    setDialogOpen(false);
  };

  const handleInitialConsonantHint = () => {
    onInitialConsonantHint();
    setDialogOpen(false);
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip open={disabled ? showTooltip : undefined}>
          <TooltipTrigger asChild>
            <span>
              <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className="flex items-center justify-center w-7 h-7 hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Flag size={18} />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {disabled && showTooltip ? (
              <p className="text-xs">Use hint first!</p>
            ) : (
              <p className="text-xs">Give Up</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="excel-theme border border-gray-300 rounded-none shadow-xl p-0 overflow-hidden">
          <div className="bg-[#217346] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
            <span>Microsoft NewMantle - Confirm Action</span>
          </div>
          <div className="p-6 bg-white">
            <h3 className="text-lg font-bold mb-4 text-black">정말 포기하시겠습니까?</h3>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              포기하시면 오늘의 게임이 종료되며, 정답을 확인할 수 있습니다.
            </p>
            <div className="flex justify-end space-x-2">
              {!initialConsonantHintUsed ? (
                <>
                  <button 
                    onClick={handleInitialConsonantHint}
                    className="px-4 py-1.5 border border-gray-400 bg-[#f3f2f1] hover:bg-[#e1dfdd] text-sm font-medium"
                  >
                    초성 힌트 보기
                  </button>
                  <button 
                    onClick={handleGiveUp}
                    className="px-4 py-1.5 border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5a37] text-sm font-medium"
                  >
                    그냥 포기하기
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleGiveUp}
                  className="px-4 py-1.5 border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5a37] text-sm font-medium"
                >
                  네, 포기합니다
                </button>
              )}
              <button 
                onClick={() => setDialogOpen(false)}
                className="px-4 py-1.5 border border-gray-400 bg-white hover:bg-gray-50 text-sm font-medium"
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
