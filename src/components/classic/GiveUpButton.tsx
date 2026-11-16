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
      {/* 모바일에선 툴팁이 안 떠서 아이콘 + 글씨로 보여준다 (아이콘으로 두 버튼 구분). 모바일에서만 작게 (docs/tasks/ui/input/plan.md 1) */}
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
        {/* 모바일 양옆 여백·둥근 모서리는 첫 방문 안내 창과 맞춤 (docs/tasks/ui/giveup-dialog/plan.md 5) */}
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-md rounded-lg"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          {/* 공통 DialogHeader는 모바일에서 가운데 정렬이라 왼쪽으로 고정. 한국어는 단어 단위 줄바꿈 (giveup-dialog/plan.md 7) */}
          <DialogHeader className="text-left break-keep">
            {/* 초성 미사용: 초성 힌트를 권하는 질문이라 "초성 힌트 받기"가 진행 버튼이 됨 (docs/tasks/ui/giveup-dialog/plan.md 3) */}
            {/* 기본 줄 간격(leading-none)은 두 줄일 때 붙어 보여서 살짝 띄움 */}
            <DialogTitle className="leading-snug">
              {initialConsonantHintUsed ? (
                "정말 포기하시겠습니까?"
              ) : (
                <>
                  포기하기 전에 <br className="sm:hidden" />
                  초성 힌트를 받아볼까요?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              포기하면 정답이 공개되고,
              <br />
              이후 입력한 단어는 기록되지 않아요.
            </DialogDescription>
          </DialogHeader>
          {/* 계속 도전(유도)을 마지막에: DialogFooter가 PC에선 오른쪽, 모바일에선 맨 위로 보낸다 (docs/tasks/ui/giveup-dialog/plan.md 2) */}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            {!initialConsonantHintUsed ? (
              <>
                <Button variant="outline" onClick={handleGiveUp}>
                  포기하고 정답 보기
                </Button>
                <Button ref={continueButtonRef} onClick={handleInitialConsonantHint} className="bg-blue-600 text-white hover:bg-blue-700">
                  초성 힌트 받기
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleGiveUp}>
                  포기하기
                </Button>
                <Button ref={continueButtonRef} onClick={() => setDialogOpen(false)} className="bg-blue-600 text-white hover:bg-blue-700">
                  계속 도전하기
                </Button>
              </>
            )}
          </DialogFooter>
          {/* 초성 없이 계속하기: X와 같은 동작을 눈에 보이게. 두 선택지보다 약하게 (docs/tasks/ui/giveup-dialog/plan.md 4) */}
          {!initialConsonantHintUsed && (
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="-mt-2 justify-self-center sm:justify-self-end text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
            >
              힌트 없이 계속하기
            </button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GiveUpButton;
