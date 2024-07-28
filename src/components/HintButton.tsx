import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface HintButtonProps {
  onHintRequest: () => void;
  disabled: boolean;
}

const HintButton: React.FC<HintButtonProps> = ({ onHintRequest, disabled }) => {
  return (
    <Button
      onClick={onHintRequest}
      disabled={disabled}
      variant="outline"
      className="flex items-center space-x-2"
    >
      <Lightbulb size={16} />
      <span>힌트</span>
    </Button>
  );
};

export default HintButton;
