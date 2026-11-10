import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                onClick={() => setDialogOpen(true)}
                disabled={disabled}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 w-8 h-8"
                title=""
                aria-label="포기"
              >
                <Flag size={20} />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>포기</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>정말 포기하시겠습니까?</DialogTitle>
            <DialogDescription>
              포기하면 정답이 공개되고, 이후 입력하는 단어는 오늘 기록에
              반영되지 않아요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {!initialConsonantHintUsed ? (
              <>
                <Button ref={continueButtonRef} onClick={handleInitialConsonantHint} className="bg-blue-600 text-white hover:bg-blue-700">
                  초성 힌트 받고 계속 도전하기
                </Button>
                <Button variant="destructive" onClick={handleGiveUp}>
                  정말로 포기할래요
                </Button>
              </>
            ) : (
              <>
                <Button ref={continueButtonRef} onClick={() => setDialogOpen(false)} className="bg-blue-600 text-white hover:bg-blue-700">
                  계속 도전하기
                </Button>
                <Button variant="destructive" onClick={handleGiveUp}>
                  포기하기
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiveUpButton;
