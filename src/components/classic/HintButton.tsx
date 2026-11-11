import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface HintButtonProps {
  onHintRequest: () => void;
  disabled: boolean;
}

// 모바일에선 툴팁이 안 떠서 아이콘 + 글씨로 보여준다 (아이콘으로 두 버튼 구분). 모바일에서만 작게 (docs/tasks/ui/plan.md 4장, 프로토타입)
const HintButton: React.FC<HintButtonProps> = ({ onHintRequest, disabled }) => {
  return (
    <Button
      type="button"
      onClick={onHintRequest}
      disabled={disabled}
      aria-label="힌트"
      variant="ghost"
      size="sm"
      className="h-8 px-1.5 sm:px-2 gap-0.5 sm:gap-1 text-xs sm:text-sm text-gray-900"
    >
      <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      힌트
    </Button>
  );
};

export default HintButton;
