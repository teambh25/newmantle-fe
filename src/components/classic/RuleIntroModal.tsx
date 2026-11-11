"use client";
import React from "react";
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
}

// 첫 방문 안내 모달. 내용 기준: docs/spec/rules.md "첫 방문 모달 요약"
const RuleIntroModal: React.FC<RuleIntroModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-600">오늘의 정답 단어를 맞혀보세요!</DialogTitle>
          <DialogDescription className="text-left text-sm text-gray-600 leading-relaxed pt-2">
            단어를 입력하면 정답과 얼마나 비슷한지 알려드려요.
            <br />
            유사도를 참고해 매일 바뀌는 정답을 찾아보세요!
            {/* 보조 정보라 작고 연하게 */}
            <span className="block mt-2 text-xs text-gray-400">
              (정답 단어는 매일 밤 12시에 바뀝니다)
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <DialogClose asChild>
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">시작하기</Button>
          </DialogClose>
          <Link
            href="/rule"
            onClick={onClose}
            className="text-center text-sm text-gray-500 hover:text-blue-600 hover:underline"
          >
            자세한 규칙 보기
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RuleIntroModal;
