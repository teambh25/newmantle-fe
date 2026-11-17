"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import NoticeBanner from "@/components/classic/NoticeBanner";
import ClassicFooter from "@/components/classic/Footer";
import RuleIntroModal from "@/components/classic/RuleIntroModal";
import { GAME_INPUT_ID } from "@/components/classic/NewMantleForm/GameForm";
import AuthButton from "@/components/AuthButton";
import StatsLink from "@/components/StatsLink";
import { SettingsButton } from "@/components/SettingsButton";
import type { useRuleIntroModal } from "@/hooks/useRuleIntroModal";
import type { useInputTooltip } from "@/hooks/useInputTooltip";
import type { UITheme } from "@/hooks/useUITheme";

const ClassicNewMantleForm = dynamic(() => import("@/components/classic/NewMantleForm"), {
  ssr: false,
});

interface ClassicHomeProps {
  theme: UITheme;
  setTheme: (theme: UITheme) => void;
  /** 첫 방문 모달·첫 입력 말풍선 상태. 게임 화면이 기록을 덮어쓰기 전에 읽어야 해서 메인(page.tsx)이 갖고 있다 */
  ruleModal: ReturnType<typeof useRuleIntroModal>;
  inputTooltip: ReturnType<typeof useInputTooltip>;
}

/** classic 테마 메인 화면 */
export default function ClassicHome({ theme, setTheme, ruleModal, inputTooltip }: ClassicHomeProps) {
  // 말풍선은 한 번에 하나: 모달 → 입력창 말풍선 → 헤더 말풍선 (docs/tasks/ui/input/plan.md 2)
  const showInputTooltip = ruleModal.closed && inputTooltip.show;
  const hideHeaderTooltip = !ruleModal.closed || !inputTooltip.done;
  // 결과창이 열린 동안 헤더 로그인 버튼 강조 (docs/tasks/ui/result-box/plan.md 요구사항 8)
  const [resultOpen, setResultOpen] = useState(false);

  return (
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
  );
}
