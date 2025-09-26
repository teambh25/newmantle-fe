"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import SurveyForm from "./SurveyForm";

const GameDescription: React.FC = () => {
  return (
    <div className="space-y-12">
      <SurveyForm />

      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">
          이 게임은 원작인 꼬맨틀의 개선된 버전입니다.
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          개선된 모델을 통해 기존 꼬맨틀보다 더 유의미한 유사도를 확인할 수
          있도록 하였습니다.
        </p>
        <Button
          variant="outline"
          size="sm"
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
