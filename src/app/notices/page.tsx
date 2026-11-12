import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NotificationFeed from "@/components/classic/NotificationFeed";
import MarkNoticesSeen from "@/components/classic/MarkNoticesSeen";

// 공지사항 전체 목록. 테마와 상관없이 classic UI (docs/tasks/ui/notices.md 1장)

export const metadata: Metadata = {
  title: "공지사항 - 뉴맨틀",
  description: "뉴맨틀 업데이트와 공지를 안내합니다.",
};

export default function NoticesPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <MarkNoticesSeen />
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl flex flex-row items-center mb-8 mt-2 sm:mt-0 gap-2">
          <Link
            href="/"
            aria-label="메인으로"
            className="-ml-2 w-10 h-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600 leading-none">공지사항</h1>
        </div>

        <div className="w-full max-w-2xl pb-16">
          <NotificationFeed />
        </div>

        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
          게임하러 가기
        </Link>
      </main>
    </div>
  );
}
