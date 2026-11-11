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
      {/* 모바일에선 툴팁이 안 떠서 아이콘 + 글씨로 보여준다 (아이콘으로 두 버튼 구분). 모바일에서만 작게 (docs/tasks/ui/plan.md 4장, 프로토타입) */}
      <Button
        type="button"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        variant="ghost"
        size="sm"
        className="h-8 px-1.5 sm:px-2 gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-900"
        aria-label="포기"
      >
        <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        포기
      </Button>

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
