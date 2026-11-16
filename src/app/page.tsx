"use client";
import { useState } from "react";
import NoticeBanner from "@/components/classic/NoticeBanner";
import ClassicFooter from "@/components/classic/Footer";
import RuleIntroModal from "@/components/classic/RuleIntroModal";
import { GAME_INPUT_ID } from "@/components/classic/NewMantleForm/GameForm";
import { SettingsButton } from "@/components/SettingsButton";
import { useUITheme } from "@/hooks/useUITheme";
import { useGuestLink } from "@/hooks/useGuestLink";
import { useRuleIntroModal } from "@/hooks/useRuleIntroModal";
import { useInputTooltip } from "@/hooks/useInputTooltip";
import dynamic from "next/dynamic";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import StatsLink from "@/components/StatsLink";
import NicknameSetupModal from "@/components/NicknameSetupModal";
import { CircleHelp } from "lucide-react";

// Excel Components
import ExcelSheetTabs from "@/components/excel/SheetTabs";
import ExcelFooter from "@/components/excel/Footer";

const ClassicNewMantleForm = dynamic(() => import("@/components/classic/NewMantleForm"), {
  ssr: false,
});

const ExcelNewMantleForm = dynamic(() => import("@/components/excel/NewMantleForm"), {
  ssr: false,
});

/** excel 시트에서 게임 아래 빈 행의 시작 번호와 개수 */
const SHEET_FILLER_START = 20;
const SHEET_FILLER_ROWS = 40;

export default function Home() {
  const { theme, setTheme, mounted } = useUITheme();
  useGuestLink();
  const ruleModal = useRuleIntroModal();
  const inputTooltip = useInputTooltip();
  // 말풍선은 한 번에 하나: 모달 → 입력창 말풍선 → 헤더 말풍선 (docs/tasks/ui/input/plan.md 2)
  const showInputTooltip = ruleModal.closed && inputTooltip.show;
  const hideHeaderTooltip = !ruleModal.closed || !inputTooltip.done;
  // 결과창이 열린 동안 헤더 로그인 버튼 강조 (docs/tasks/ui/result-box/plan.md 요구사항 8)
  const [resultOpen, setResultOpen] = useState(false);

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
                 newmantle_word_game.xlsx
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
                  
                  {/* 게임 아래는 시트 느낌용 빈 행. 도움말·공지 목록은 규칙·공지사항 탭으로 옮겼다 (specs/excel-ui Dec-13) */}
                  {Array.from({ length: SHEET_FILLER_ROWS }, (_, i) => (
                    <div key={i} className="excel-row bg-white">
                      <div className="sheet-cell-header">{SHEET_FILLER_START + i}</div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                      <div className="excel-cell h-6 border-b-0"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <ExcelSheetTabs />
          <ExcelFooter />
        </div>
      ) : (
        /* ──────────── 클래식 UI ──────────── */
        <div className="flex flex-col min-h-screen font-sans">
          {/* 안 읽은 최신 공지만 맨 위 띠로. 전체 목록은 /notices (docs/tasks/ui/notices/plan.md 2) */}
          <NoticeBanner />
          <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
            {/* 작은 화면(375px)에서 한 줄에 들어가도록 부제를 숨기고 간격을 줄인다 (docs/tasks/ui/header/plan.md 1) */}
            <div className="w-full max-w-2xl flex flex-row items-center justify-between gap-2 mb-6 mt-2 sm:mt-0">
              <Link href="/" className="flex flex-row items-end justify-start space-x-3 whitespace-nowrap hover:opacity-80 transition-opacity">
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 leading-none">
                  뉴맨틀
                </h1>
                <p className="hidden sm:block text-base sm:text-lg text-gray-600 leading-none pb-0.5">
                  단어 추측 게임
                </p>
              </Link>
              <div className="flex items-center shrink-0 space-x-2 sm:space-x-4">
                <Link
                  href="/rule"
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                  title="규칙"
                  aria-label="게임 규칙"
                >
                  <CircleHelp size={20} />
                </Link>
                <StatsLink hideTooltip={hideHeaderTooltip} />
                <SettingsButton theme={theme} onThemeChange={setTheme} variant="classic" />
                {/* 로그인은 오른쪽 끝 (docs/tasks/ui/header/plan.md 3). 첫 방문 모달·입력창 말풍선이 끝나기 전에는 헤더 말풍선을 숨긴다 (docs/tasks/rule/plan.md M-6, docs/tasks/ui/input/plan.md 2). 결과창이 열려 있으면 로그인 강조 (docs/tasks/ui/result-box/plan.md) */}
                <AuthButton hideTooltip={hideHeaderTooltip} tooltipAlign="end" spotlight={resultOpen} />
              </div>
            </div>
            <div className="w-full max-w-2xl flex-grow flex flex-col">
              <ClassicNewMantleForm
                showInputTooltip={showInputTooltip}
                onInputTooltipDone={inputTooltip.dismiss}
                onResultOpenChange={setResultOpen}
              />
            </div>
          </main>
          <ClassicFooter />
          <RuleIntroModal
            open={ruleModal.open}
            onClose={ruleModal.close}
            onStart={() => document.getElementById(GAME_INPUT_ID)?.focus()}
          />
        </div>
      )}
    </>
  );
}
