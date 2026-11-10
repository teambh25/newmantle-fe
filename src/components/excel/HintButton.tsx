import React from "react";
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
            <button
              type="button"
              onClick={onHintRequest}
              disabled={disabled}
              aria-label="힌트"
              className="flex items-center justify-center w-7 h-7 hover:bg-yellow-50 text-yellow-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Lightbulb size={18} />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Get Hint</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HintButton;
