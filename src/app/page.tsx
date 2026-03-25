"use client";
import ClassicGameDescription from "@/components/classic/GameDescription";
import ClassicNotificationFeed from "@/components/classic/NotificationFeed";
import ClassicFooter from "@/components/classic/Footer";
import HelpSection from "@/components/HelpSection";
import { SettingsButton } from "@/components/SettingsButton";
import { useUITheme } from "@/hooks/useUITheme";
import dynamic from "next/dynamic";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import NicknameSetupModal from "@/components/NicknameSetupModal";

// Excel Components
import ExcelGameDescription from "@/components/excel/GameDescription";
import ExcelNotificationFeed from "@/components/excel/NotificationFeed";
import ExcelHelpSection from "@/components/excel/HelpSection";
import ExcelFooter from "@/components/excel/Footer";

const ClassicNewMantleForm = dynamic(() => import("@/components/classic/NewMantleForm"), {
  ssr: false,
});

const ExcelNewMantleForm = dynamic(() => import("@/components/excel/NewMantleForm"), {
  ssr: false,
});

export default function Home() {
  const { theme, setTheme, mounted } = useUITheme();

  // hydration 전(localStorage 읽기 전)에는 아무것도 렌더링하지 않아 디자인 깜빡임(FOUC) 방지
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  const isExcel = theme === "excel";

  return (
    <>
      <NicknameSetupModal />
      {isExcel ? (
        /* ──────────── 엑셀 UI ──────────── */
        <div className="flex flex-col h-screen excel-theme select-none overflow-hidden">
          {/* Excel Ribbon Top Bar */}
          <header className="w-full bg-[#217346] text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-sm relative z-50">
             <div className="flex items-center space-x-4">
               <Link href="/" className="font-bold text-base flex items-center hover:opacity-80 transition-opacity">
                 뉴맨틀 - 단어 추측 게임.xlsx
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
               <AuthButton />
               <SettingsButton theme={theme} onThemeChange={setTheme} variant="excel" />
             </div>
          </header>

          {/* Quick Access / Ribbon Content Placeholder */}
          <div className="w-full bg-[#f3f2f1] border-b border-gray-300 px-4 py-3 flex items-center space-x-6 shrink-0">
            <div className="flex flex-col items-center opacity-80">
              <div className="w-8 h-8 border border-gray-400 bg-white rounded-sm shadow-sm" />
              <span className="text-xs mt-1">Paste</span>
            </div>
            <div className="h-12 border-r border-gray-300" />
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-1">
                <div className="w-24 h-6 bg-white border border-gray-300 px-2 text-sm flex items-center shadow-sm">Pretendard</div>
                <div className="w-10 h-6 bg-white border border-gray-300 px-2 text-sm flex items-center justify-center shadow-sm">14</div>
              </div>
              <div className="flex items-center space-x-1 opacity-70">
                <span className="font-bold text-sm px-1.5 cursor-pointer hover:bg-gray-200 rounded">B</span>
                <span className="italic text-sm px-1.5 cursor-pointer hover:bg-gray-200 rounded">I</span>
                <span className="underline text-sm px-1.5 cursor-pointer hover:bg-gray-200 rounded">U</span>
              </div>
            </div>
          </div>

          <div id="excel-formula-bar" className="w-full shrink-0 bg-white z-20"></div>

          <main className="flex-grow w-full overflow-auto bg-white flex flex-col">
            <div className="w-full">
              <div className="excel-sheet border-none shadow-none">
                {/* Main Content Areas */}
                <div className="bg-white">
                  {/* Column Headers A, B, C, D */}
                  <div className="excel-row bg-[#f8f9fa] border-b border-[#d4d4d4] sticky top-0 z-10">
                    <div className="excel-col-header border-b border-[#d4d4d4]"></div>
                    <div className="excel-col-header border-b border-[#d4d4d4]">A</div>
                    <div className="excel-col-header border-b border-[#d4d4d4]">B</div>
                    <div className="excel-col-header border-b border-[#d4d4d4]">C</div>
                    <div className="excel-col-header border-b border-[#d4d4d4] border-r-0">D</div>
                  </div>

                  {/* Header Row (Row 1) */}
                  <div className="excel-row bg-[#f3f2f1] text-[#444] font-bold text-sm text-center border-b border-[#d4d4d4]">
                    <div className="sheet-cell-header">1</div>
                    <div className="excel-cell justify-center">시도</div>
                    <div className="excel-cell justify-center">단어</div>
                    <div className="excel-cell justify-center">순위</div>
                    <div className="excel-cell justify-center border-r-0">유사도</div>
                  </div>

                  <ExcelNewMantleForm />
                  
                  <ExcelHelpSection startRow={20} />

                  {/* Spacer 28, 29 */}
                  <div className="excel-row bg-white">
                    <div className="sheet-cell-header">28</div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                  </div>
                  <div className="excel-row bg-white">
                    <div className="sheet-cell-header">29</div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                    <div className="excel-cell h-6 border-b-0"></div>
                  </div>

                  <ExcelNotificationFeed startRow={30} />

                  {/* Empty rows filler */}
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="excel-row bg-white">
                      <div className="sheet-cell-header">{40 + i}</div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                    </div>
                  ))}
                  <div className="w-full flex justify-center py-6">
                    <ExcelGameDescription />
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Tab selector bar */}
          <div className="bg-[#f3f2f1] border-t border-gray-300 px-4 flex items-center space-x-4 text-sm shrink-0 h-8">
            <div className="flex bg-white px-5 h-full items-center border-t-2 border-[#217346] text-[#217346] font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
              게임
            </div>
          </div>
        </div>
      ) : (
        /* ──────────── 클래식 UI ──────────── */
        <div className="flex flex-col min-h-screen font-sans">
          <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-6 mt-2 sm:mt-0">
              <Link href="/" className="flex flex-row items-end justify-start space-x-3 hover:opacity-80 transition-opacity">
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 leading-none">
                  뉴맨틀
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-none pb-0.5">
                  단어 추측 게임
                </p>
              </Link>
              <div className="flex items-center space-x-4">
                <AuthButton />
                <SettingsButton theme={theme} onThemeChange={setTheme} variant="classic" />
              </div>
            </div>
            <div className="w-full max-w-2xl space-y-16 flex-grow flex flex-col pb-16">
              <ClassicNewMantleForm />
              <div className="mt-4">
                <HelpSection />
              </div>
              <ClassicNotificationFeed />
            </div>
            <ClassicGameDescription />
          </main>
          <ClassicFooter />
        </div>
      )}
    </>
  );
}
