"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SurveyForm from "./SurveyForm";

const GameDescription: React.FC = () => {
  return (
    <>
      <Card className="w-full max-w-2xl mt-12">
        <CardHeader>
          <CardTitle className="leading-normal ">
            이 게임은 원작인 꼬맨틀의 개선된 버전입니다.
          </CardTitle>
          <CardDescription>
            개선된 모델을 통해 기존 꼬맨틀보다 더 유의미한 유사도를 확인할 수
            있도록 하였습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            onClick={() =>
              window.open("https://semantle-ko.newsjel.ly/", "_blank")
            }
          >
            꼬맨틀 링크
          </Button>
        </CardContent>
      </Card>
      <SurveyForm />
    </>
  );
};

export default GameDescription;
