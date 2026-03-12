"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { faqs } from "@/static/faq";

const HelpSection: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">도움말</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b">
            <AccordionTrigger className="text-gray-700 hover:text-blue-600 font-semibold py-2 text-left justify-start gap-2">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 leading-relaxed pb-2">
              {faq.answer.split(/(?=\d+\.)/).filter(line => line.trim()).map((line, i) => (
                <div key={i} className={i > 0 ? "mt-1" : ""}>
                  {line.trim()}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default HelpSection;
