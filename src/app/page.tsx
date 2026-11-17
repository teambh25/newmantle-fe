"use client";
import { useUITheme } from "@/hooks/useUITheme";
import { useGuestLink } from "@/hooks/useGuestLink";
import { useRuleIntroModal } from "@/hooks/useRuleIntroModal";
import { useInputTooltip } from "@/hooks/useInputTooltip";
import NicknameSetupModal from "@/components/NicknameSetupModal";
import ClassicHome from "@/components/classic/ClassicHome";
import ExcelHome from "@/components/excel/ExcelHome";

export default function Home() {
  const { theme, setTheme, mounted } = useUITheme();
  useGuestLink();
  // 첫 방문 모달·첫 입력 말풍선은 저장값을 게임 화면이 마운트되기 전(테마를 읽기 전 첫 렌더)에 읽는다.
  // 게임 화면과 같이 마운트되면 게임 화면이 지난 기록을 먼저 지워 기존 유저를 처음 온 사람으로 본다
  const ruleModal = useRuleIntroModal();
  const inputTooltip = useInputTooltip();

  // hydration 전(localStorage 읽기 전)에는 아무것도 렌더링하지 않아 디자인 깜빡임(FOUC) 방지
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  // 같은 경로(/)에서 테마로 화면만 바꾼다 (docs/specs/excel-ui Dec-22)
  return (
    <>
      <NicknameSetupModal />
      {theme === "excel" ? (
        <ExcelHome theme={theme} setTheme={setTheme} />
      ) : (
        <ClassicHome theme={theme} setTheme={setTheme} ruleModal={ruleModal} inputTooltip={inputTooltip} />
      )}
    </>
  );
}
