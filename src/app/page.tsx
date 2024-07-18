import NewMantleForm from "@/components/NewMantleForm";
import GameDescription from "@/components/GameDescription";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-gradient-to-b from-blue-100 to-white">
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
        <NewMantleForm />
        <GameDescription />
        {/* <FAQSection /> */}
      </main>
      <Footer />
    </div>
  );
}
