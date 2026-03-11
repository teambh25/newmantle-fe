"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import SurveyForm from "./SurveyForm";

const GameDescription: React.FC = () => {
  return (
    <div className="space-y-12">
      <SurveyForm />

      <div className="text-center">
        <h2 className="text-xl font-black mb-2 uppercase tracking-wide">
          이 게임은 원작인 꼬맨틀의 개선된 버전입니다.
        </h2>
        <p className="text-sm text-gray-800 mb-6 font-bold">
          개선된 모델을 통해 기존 꼬맨틀보다 더 유의미한 유사도를 확인할 수 있습니다.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="font-black border-2 border-black uppercase text-black bg-white hover:bg-gray-100 uppercase"
          onClick={() =>
            window.open("https://semantle-ko.newsjel.ly/", "_blank")
          }
        >
          꼬맨틀 링크
        </Button>
      </div>
    </div>
  );
};

export default GameDescription;
