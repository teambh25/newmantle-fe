"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: "게임은 어떻게 플레이하나요?",
      answer:
        "단어를 추측하여 입력하면, 해당 단어와 정답 단어 사이의 유사도를 보여줍니다. 유사도가 높은 단어를 입력하며 정답에 접근해 나가세요.",
    },
    {
      question: "유사도는 어떻게 계산되나요?",
      answer:
        "단어 임베딩 모델을 사용하여 두 단어 간의 코사인 유사도를 계산합니다. 값이 100에 가까울수록 정답과 유사한 단어입니다.",
    },
    {
      question: "게임은 매일 바뀌나요?",
      answer: "네, 매일 자정을 기준으로 새로운 단어가 선정됩니다.",
    },
    {
      question: "힌트는 없나요?",
      answer:
        "공식적인 힌트는 제공되지 않습니다. 다양한 단어를 시도해보며 유사도를 확인하는 것이 게임의 묘미입니다.",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mt-4">
      <CardHeader>
        <CardTitle>자주 묻는 질문</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default FAQSection;
