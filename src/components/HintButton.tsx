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
          <Button
            type="button"
            onClick={onHintRequest}
            disabled={disabled}
            variant="outline"
            size="icon"
            className="relative flex-shrink-0 w-12 h-12 border-none rounded-none shadow-none bg-transparent group"
            title=""
          >
            <div className="absolute inset-0 z-0 border-4 border-game-brown bg-white group-hover:bg-game-yellow transition-all rounded-sm" />
            <div className="absolute inset-0 z-10 flex items-center justify-center transition-all">
              <Lightbulb size={24} className="font-bold text-black" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>힌트</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HintButton;
