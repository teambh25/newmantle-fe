import NewMantleForm from "@/components/NewMantleForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 lg:p-24 bg-gradient-to-b from-blue-100 to-white">
      <h1 className="text-4xl sm:text-5xl font-bold mb-2 mt-8 sm:mt-0 text-blue-600">
        뉴맨틀
      </h1>
      <p className="text-xl text-gray-600 mb-6 text-center">
        오늘의 단어를 맞혀보세요!
      </p>
      <p className="text-sm text-gray-500 mb-8 max-w-md text-center">
        힌트는 없습니다. <br></br>몇 번 만에 맞힐 수 있나요?
      </p>
      <NewMantleForm />
    </main>
  );
}
