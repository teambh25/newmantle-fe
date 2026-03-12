"use client";
import React from "react";

const GameDescription: React.FC = () => {
  return (
    <div className="excel-theme flex flex-col items-center justify-center w-full py-6 mt-8">
      <p className="text-sm font-bold text-gray-500 mb-1 leading-relaxed text-center">
        이 게임은 원작인 꼬맨틀의 개선된 버전입니다.
      </p>
      <p className="text-xs text-gray-400 mb-2 leading-relaxed text-center max-w-2xl">
        개선된 모델을 통해 기존 꼬맨틀보다 더 유의미한 유사도를 확인할 수 있도록 하였습니다.
      </p>
      <button
        onClick={() => window.open("https://semantle-ko.newsjel.ly/", "_blank")}
        className="flex items-center space-x-1 underline text-gray-400 text-xs hover:text-gray-600 transition-colors"
      >
         <span>🔗 꼬맨틀 링크</span>
      </button>
    </div>
  );
};

export default GameDescription;
