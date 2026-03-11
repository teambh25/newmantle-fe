import dynamic from "next/dynamic";
// import NewMantleForm from "@/components/NewMantleForm";
import GameDescription from "@/components/GameDescription";
import NotificationFeed from "@/components/NotificationFeed";
import Footer from "@/components/Footer";

const NewMantleForm = dynamic(() => import("@/components/NewMantleForm"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 ">
        <div className="w-full max-w-2xl flex flex-row items-end justify-start space-x-3 mb-6 mt-8 sm:mt-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 leading-none">
            뉴맨틀
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-none pb-0.5">
            단어 추측 게임
          </p>
        </div>
        <div className="w-full max-w-2xl space-y-16">
          <NewMantleForm />
          <GameDescription />
          <NotificationFeed />
        </div>
      </main>
      <Footer />
    </div>
  );
}
