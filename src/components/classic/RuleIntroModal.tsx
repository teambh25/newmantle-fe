"use client";
import React, { useRef } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RuleIntroModalProps {
  open: boolean;
  onClose: () => void;
  /** "시작하기"로 닫을 때 포커스를 옮길 곳 (게임 입력창) */
  onStart?: () => void;
}

// 첫 방문 안내 모달. 내용 기준: docs/spec/rules.md "첫 방문 모달 요약"
const RuleIntroModal: React.FC<RuleIntroModalProps> = ({ open, onClose, onStart }) => {
  // "시작하기"로 닫았는지. X / ESC / 바깥 클릭은 입력창으로 보내지 않는다 (docs/tasks/ui/input/plan.md 2)
  const startedRef = useRef(false);

  const handleStart = () => {
    startedRef.current = true;
    // iOS는 탭한 순간에 포커스해야 키보드를 올려준다. 모달(포커스 가두기)을 먼저 닫고 같은 처리 안에서 포커스
    flushSync(() => onClose());
    onStart?.();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-sm rounded-lg"
        // Radix는 닫힌 뒤 열리기 전 포커스로 되돌리는데, 그게 입력창일 때가 있어 닫는 방법마다 달라진다.
        // 되돌리지 않고, "시작하기"일 때만 입력창으로 보낸다
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (startedRef.current) onStart?.();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-blue-600">오늘의 정답 단어를 맞혀보세요!</DialogTitle>
          <DialogDescription className="text-left text-sm text-gray-600 leading-relaxed pt-2 break-keep">
            단어를 입력하면 정답과 얼마나 비슷한지 알려드려요.
            <br />
            유사도를 참고해 매일 바뀌는 정답을 찾아보세요!
            {/* 보조 정보라 작고 연하게 */}
            <span className="block mt-2 text-xs text-gray-400">
              정답은 매일 밤 12시에 바뀌어요.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <DialogClose asChild>
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={handleStart}>
              시작하기
            </Button>
          </DialogClose>
          {/* 다른 선택은 회색 테두리 버튼 (포기 확인 창과 같은 규칙, docs/tasks/rule/plan.md M-7) */}
          <Button asChild variant="outline" className="w-full">
            <Link href="/rule" onClick={onClose}>
              자세한 규칙 보기
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RuleIntroModal;
