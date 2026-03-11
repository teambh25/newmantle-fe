import React from "react";
import { Separator } from "@/components/ui/separator";

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 py-6 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-gray-700 text-center">
              뉴맨틀
            </h3>
            <p className="text-sm text-gray-600 text-center"></p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm text-blue-600 hover:underline">
              이용약관
            </a>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              개인정보처리방침
            </a>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              문의하기
            </a>
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-center text-sm text-gray-500">
          © 2024 뉴맨틀. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
