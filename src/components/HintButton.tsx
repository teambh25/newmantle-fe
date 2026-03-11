import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HintButtonProps {
  onHintRequest: () => void;
  disabled: boolean;
}

const HintButton: React.FC<HintButtonProps> = ({ onHintRequest, disabled }) => {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              type="button"
              onClick={onHintRequest}
              disabled={disabled}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 w-8 h-8"
              title=""
            >
              <Lightbulb size={20} />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>힌트</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HintButton;
