"use client";
import GameDescription from "@/components/GameDescription";
import NotificationFeed from "@/components/NotificationFeed";
import Footer from "@/components/Footer";
import ClassicGameDescription from "@/components/classic/GameDescription";
import ClassicNotificationFeed from "@/components/classic/NotificationFeed";
import ClassicFooter from "@/components/classic/Footer";
import { CartoonFrame } from "@/components/ui/CartoonFrame";
import GameSection from "@/components/GameSection";
import { SettingsButton } from "@/components/SettingsButton";
import { useUITheme } from "@/hooks/useUITheme";
import dynamic from "next/dynamic";

const NewMantleForm = dynamic(() => import("@/components/NewMantleForm"), {
  ssr: false,
});

const ClassicNewMantleForm = dynamic(() => import("@/components/classic/NewMantleForm"), {
  ssr: false,
});

export default function Home() {
  const { theme, setTheme, mounted } = useUITheme();

  // hydration 전(localStorage 읽기 전)에는 아무것도 렌더링하지 않아 디자인 깜빡임(FOUC) 방지
  if (!mounted) {
    return <div className="min-h-screen bg-white" />;
  }

  const isCartoon = theme === "cartoon";

  return (
    <>
      {isCartoon ? (
        /* ──────────── 카툰 UI ──────────── */
        <div className="flex flex-col min-h-screen bg-game-bg font-monoplex text-game-brown cartoon-theme">
          <main className="flex-grow flex flex-col items-center justify-start p-4 pt-4 sm:pt-4 md:pt-6">
            <CartoonFrame
              className="w-full max-w-2xl mb-6 px-5 py-3 z-50"
              bgColor="bg-white"
            >
              <div className="flex flex-row items-end justify-between w-full">
                <div className="flex flex-row items-end space-x-3">
                  <h1 className="text-3xl sm:text-4xl font-black leading-none uppercase tracking-tighter">
                    뉴맨틀
                  </h1>
                  <p className="text-sm sm:text-base font-bold leading-none pb-0.5 uppercase tracking-wide">
                    단어 추측 게임
                  </p>
                </div>
                <SettingsButton theme={mounted ? theme : "cartoon"} onThemeChange={setTheme} variant="cartoon" />
              </div>
            </CartoonFrame>

            <div className="w-full max-w-2xl space-y-12">
              <GameSection />

              <CartoonFrame className="p-5" bgColor="bg-game-yellow">
                <GameDescription />
              </CartoonFrame>

              <CartoonFrame className="p-5" bgColor="bg-game-orange">
                <NotificationFeed />
              </CartoonFrame>
            </div>
          </main>
          <Footer />
        </div>
      ) : (
        /* ──────────── 클래식 UI ──────────── */
        <div className="flex flex-col min-h-screen font-sans">
          <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-6 mt-8 sm:mt-0 px-1">
              <div className="flex flex-row items-end justify-start space-x-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 leading-none">
                  뉴맨틀
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-none pb-0.5">
                  단어 추측 게임
                </p>
              </div>
              <SettingsButton theme={mounted ? theme : "classic"} onThemeChange={setTheme} variant="classic" />
            </div>
            <div className="w-full max-w-2xl space-y-16">
              <ClassicNewMantleForm />
              <ClassicGameDescription />
              <ClassicNotificationFeed />
            </div>
          </main>
          <ClassicFooter />
        </div>
      )}
    </>
  );
}
