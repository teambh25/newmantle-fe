import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface HintButtonProps {
  onHintRequest: () => void;
  disabled: boolean;
}

// 모바일에선 툴팁이 안 떠서 아이콘 + 글씨로 보여준다 (docs/tasks/ui/plan.md 4장, 프로토타입)
const HintButton: React.FC<HintButtonProps> = ({ onHintRequest, disabled }) => {
  return (
    <Button
      type="button"
      onClick={onHintRequest}
      disabled={disabled}
      aria-label="힌트"
      variant="ghost"
      size="sm"
      className="h-8 px-2 gap-1 text-gray-600"
    >
      <Lightbulb size={16} />
      힌트
    </Button>
  );
};

export default HintButton;
