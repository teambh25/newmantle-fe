import React, { useState } from "react";
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
  const [showTooltip, setShowTooltip] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [firstClickDone, setFirstClickDone] = useState(false);

  const handleClick = () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    // 첫 번째 클릭이고 초성 힌트를 아직 사용하지 않았다면
    if (!firstClickDone && !initialConsonantHintUsed) {
      onInitialConsonantHint();
      setFirstClickDone(true);
      return;
    }

    // 두 번째 클릭이거나 이미 초성 힌트를 사용했다면 모달 표시
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
              <Button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 w-8 h-8"
                title=""
              >
                <Flag size={20} />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {disabled && showTooltip ? <p>힌트를 먼저 사용해보세요!</p> : <p>포기</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 포기하시겠습니까?</DialogTitle>
            <DialogDescription>
              포기하시면 오늘의 게임이 종료되며, 정답을 확인할 수
              있습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {!initialConsonantHintUsed ? (
              <>
                <Button variant="outline" onClick={handleInitialConsonantHint}>
                  초성 힌트 보기
                </Button>
                <Button variant="outline" onClick={handleGiveUp}>
                  그냥 포기하기
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleGiveUp}>
                네, 포기합니다
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiveUpButton;
