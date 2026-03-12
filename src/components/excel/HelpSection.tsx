"use client";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { faqs } from "@/static/faq";

interface ExcelHelpSectionProps {
  startRow?: number;
}

const ExcelHelpSection: React.FC<ExcelHelpSectionProps> = ({ startRow = 20 }) => {

  return (
    <div className="w-full">
      {/* Search Header Row */}
      <div className="excel-row bg-white">
        <div className="sheet-cell-header bg-[#e2e2e2] font-bold text-[#217346]">{startRow}</div>
        <div className="excel-cell col-span-4 flex items-center justify-start font-bold text-[13px] text-[#217346] bg-[#e6f2eb]">
          도움말
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-none">
            {/* Question Row */}
            <div className="excel-row bg-white hover:bg-gray-50 transition-colors">
              <div className="sheet-cell-header">{startRow + 1 + index * 2}</div>
              <div className="excel-cell col-span-4 p-0">
                <AccordionTrigger className="flex-1 px-3 py-2 text-[13px] font-normal text-gray-800 hover:no-underline text-left w-full h-full">
                  <span className="flex items-center">
                    <span className="mr-2 text-[#217346] font-bold shrink-0">Q.</span>
                    <span className="truncate">{faq.question}</span>
                  </span>
                </AccordionTrigger>
              </div>
            </div>
            {/* Answer Row (Content) */}
            <AccordionContent className="p-0 border-none">
              <div className="excel-row bg-[#fcfcfc] border-b border-[#e1e1e1]">
                <div className="sheet-cell-header bg-[#f3f2f1]">{startRow + 1 + index * 2 + 1}</div>
                <div className="excel-cell col-span-4 px-3 py-4 text-[13px] text-gray-600 leading-relaxed bg-[#fcfcfc] border-r-0">
                  <div className="flex">
                    <span className="mr-2 text-blue-600 font-bold shrink-0">A.</span>
                    <div className="whitespace-pre-line">{faq.answer}</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
);
};

export default ExcelHelpSection;
