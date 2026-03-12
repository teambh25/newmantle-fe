"use client";
import React from "react";
import { Button } from "@/components/ui/button";

const GameDescription: React.FC = () => {
  return (
    <div className="flex flex-col flex-grow justify-end items-center pb-8 mt-auto px-4 z-10 w-full mt-16 text-center">
      <h2 className="text-base font-semibold mb-1 text-gray-500">
        이 게임은 원작인 꼬맨틀의 개선된 버전입니다.
      </h2>
      <p className="text-xs text-gray-400 mb-3">
        개선된 모델을 통해 기존 꼬맨틀보다 더 유의미한 유사도를 확인할 수
        있도록 하였습니다.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="text-xs text-gray-500 h-8"
        onClick={() =>
          window.open("https://semantle-ko.newsjel.ly/", "_blank")
        }
      >
        🔗 꼬맨틀 링크
      </Button>
    </div>
  );
};

export default GameDescription;
