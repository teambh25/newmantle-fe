"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import SurveyForm from "./SurveyForm";

const GameDescription: React.FC = () => {
  return (
    <div className="space-y-12">
      <section className="w-full max-w-2xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-sm leading-6 text-red-900 shadow-sm">
        <p className="mb-3 font-semibold">뉴맨틀을 플레이해주시는 여러분 안녕하세요, 뉴맨틀 운영자입니다.</p>
        <p className="mb-3">
          최근 서비스에 버그가 생겨 혼란을 겪으신 분들께 사과드립니다.
        </p>
        <p className="mb-3">
          9월 9일 이후 플레이 도중 포기하기 버튼을 눌렀을 때 정답이 초성으로 표시되는 버그가 있었습니다.
          예를 들어 맞혀야 하는 단어가 '선물'이였다면 포기하기를 눌렀을 때 'ㅅㅁ'로 표시되었습니다.
          현재 이 버그는 수정되었으며, 이제 포기하기 버튼을 누르면 정답 단어가 제대로 표시됩니다.
        </p>
        <p className="mb-3">
          원인은 팀 내에서 최근 진행한 서버를 이전하는 과정에 있습니다. 포기하기와 관련된 서버 호출 방식을 변경하는 과정에서 개발 상의 착오가 있었습니다.
          또, 배포 이후 영향이 있을 기능들에 대한 테스트를 소홀히하여 문제 발생을 뒤늦게 인지하였습니다. 앞으로 이런 실수가 반복되지 않도록 개발 과정에서 테스트를 엄격히 진행하겠습니다.
        </p>
        <p>다시 한번 게임에서 불편함을 느끼셨을 분들에게 죄송합니다.</p>
      </section>
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
