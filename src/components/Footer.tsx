import React from "react";
import { Separator } from "@/components/ui/separator";

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 py-8 bg-black text-white font-monoplex border-t-[4px] border-black">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black uppercase tracking-widest text-[#FFD600]">
              뉴맨틀
            </h3>
          </div>
          <div className="flex space-x-6 text-sm font-bold tracking-wide">
            <a href="#" className="hover:text-[#FFD600] transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-[#FFD600] transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-[#FFD600] transition-colors">
              문의하기
            </a>
          </div>
        </div>
        <Separator className="my-6 bg-gray-800 h-[2px]" />
        <p className="text-center text-sm text-gray-500 font-bold uppercase tracking-widest">
          © 2024 NewMantle. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
