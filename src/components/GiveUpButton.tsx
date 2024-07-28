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
  DialogTrigger,
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
  hintUsed: number;
}

const GiveUpButton: React.FC<GiveUpButtonProps> = ({
  onGiveUp,
  disabled,
  hintUsed,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  const handleGiveUp = () => {
    onGiveUp();
    setDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleClick}
                  disabled={disabled}
                  variant="outline"
                  className="flex items-center space-x-2 ml-2"
                >
                  <Flag size={16} />
                  <span>포기하기</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>정말 포기하시겠습니까?</DialogTitle>
                  <DialogDescription>
                    포기하시면 오늘의 게임이 종료되며, 정답을 확인할 수
                    있습니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={handleGiveUp}>
                    네, 포기합니다
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>힌트를 먼저 사용해보세요!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GiveUpButton;
