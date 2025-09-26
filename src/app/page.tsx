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
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 mt-8 sm:mt-0 text-blue-600">
          뉴맨틀
        </h1>
        <p className="text-xl text-gray-600 mb-6 text-center">
          오늘의 단어를 맞혀보세요!
        </p>
        <p className="text-sm text-gray-500 mb-8 max-w-md text-center">
          단어를 입력하면, <br></br>정답 단어와의 유사도만 알려드립니다.{" "}
          <br></br>
          몇트 안에 맞힐 수 있나요?
        </p>
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
