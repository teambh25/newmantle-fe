"use client";
import dynamic from "next/dynamic";
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
           {/* 파일 이름: 누르는 곳이 아니라 제목 (Dec-78) */}
           <span className="font-bold text-base flex items-center">{fileName}</span>
           {/* 장식 메뉴: 누를 수 있어 보이지 않게 hover·포인터 없음 (specs/excel-ui Dec-78) */}
           <nav className="hidden md:flex space-x-4 text-sm opacity-90 cursor-default" aria-hidden="true">
             <span>File</span>
             <span className="font-bold border-b-2 border-white opacity-100 pb-0.5">Home</span>
             <span>Insert</span>
             <span>Page Layout</span>
             <span>Formulas</span>
             <span>Data</span>
             <span>Review</span>
             <span>View</span>
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
