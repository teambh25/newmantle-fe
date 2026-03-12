import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-auto py-1.5 bg-[#217346] text-white border-t border-[#1a5a37] text-[11px] font-medium overflow-hidden">
      <div className="container mx-auto px-4 flex justify-between items-center h-6">
        <div className="flex space-x-4 items-center h-full">
           <div className="flex items-center space-x-1.5 px-2 hover:bg-[#1a5a37] cursor-pointer h-full transition-colors">
            <span>READY</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
          </div>
          <div className="opacity-60 text-[10px] hidden sm:block">
            Workbook: NEW_MANTLE_DATA_2025.xlsx
          </div>
        </div>
        
        <div className="flex items-center space-x-6 h-full">
          <div className="hidden md:flex space-x-3">
             <a href="#" className="hover:underline opacity-80 hover:opacity-100 uppercase tracking-tighter">Terms</a>
             <a href="#" className="hover:underline opacity-80 hover:opacity-100 uppercase tracking-tighter">Privacy</a>
             <a href="#" className="hover:underline opacity-80 hover:opacity-100 uppercase tracking-tighter">Support</a>
          </div>
          <div className="flex items-center space-x-1 pl-4 border-l border-[#ffffff44] h-full">
            <span className="opacity-60">100%</span>
            <div className="w-16 h-1 bg-[#ffffff44] relative rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[100%] bg-white opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
