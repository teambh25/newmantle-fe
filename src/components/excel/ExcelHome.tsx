"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { SettingsButton } from "@/components/SettingsButton";
import ExcelSheetTabs from "@/components/excel/SheetTabs";
import ExcelFooter from "@/components/excel/Footer";
import Ribbon from "@/components/excel/Ribbon";
import type { UITheme } from "@/hooks/useUITheme";
import { useGameDate } from "@/hooks/useGameDate";
import { excelFileName } from "@/utils/date";

const ExcelNewMantleForm = dynamic(() => import("@/components/excel/NewMantleForm"), {
  ssr: false,
});

interface ExcelHomeProps {
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
}

/** excel 테마 메인 화면 (specs/excel-ui Dec-22) */
export default function ExcelHome({ theme, setTheme }: ExcelHomeProps) {
  // 게임 날짜는 엑셀 파일 이름에 (예: newmantle_2026_11_17.xlsx, specs/excel-ui Dec-38)
  const gameDate = useGameDate();
  const fileName = excelFileName(gameDate);

  return (
    <div className="flex flex-col h-screen excel-theme select-none overflow-hidden">
      {/* Excel Ribbon Top Bar */}
      <header className="w-full bg-[#217346] text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-sm relative z-50">
         <div className="flex items-center space-x-4">
           <Link href="/" className="font-bold text-base flex items-center hover:opacity-80 transition-opacity">
             {fileName}
           </Link>
           <nav className="hidden md:flex space-x-4 text-sm opacity-90">
             <span className="cursor-pointer hover:opacity-100">File</span>
             <span className="font-bold border-b-2 border-white opacity-100 pb-0.5">Home</span>
             <span className="cursor-pointer hover:opacity-100">Insert</span>
             <span className="cursor-pointer hover:opacity-100">Page Layout</span>
             <span className="cursor-pointer hover:opacity-100">Formulas</span>
             <span className="cursor-pointer hover:opacity-100">Data</span>
             <span className="cursor-pointer hover:opacity-100">Review</span>
             <span className="cursor-pointer hover:opacity-100">View</span>
           </nav>
         </div>
         <div className="flex items-center space-x-4">
           <AuthButton variant="excel" />
           <SettingsButton theme={theme} onThemeChange={setTheme} variant="excel" />
         </div>
      </header>

      <Ribbon />

      <div id="excel-formula-bar" className="w-full shrink-0 bg-white z-20"></div>

      <main className="flex-grow w-full overflow-auto bg-white flex flex-col">
        <div className="w-full">
          <div className="excel-sheet border-none shadow-none">
            {/* Main Content Areas */}
            <div className="bg-white">
              <ExcelNewMantleForm />
              
            </div>
          </div>
        </div>
      </main>

      <ExcelSheetTabs />
      <ExcelFooter />
    </div>
  );
}
