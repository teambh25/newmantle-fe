"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notifications } from "@/static/notifications";
import { useLastSeenNotice } from "@/hooks/useLastSeenNotice";
import { getBannerLabel, getLatestNotification } from "@/utils/notifications";

// 맨 아래 녹색 상태 표시줄. 약관·문의 링크는 모바일에서도 보인다 (specs/excel-ui Dec-14)
// 원작 출처는 엑셀의 파일 이름 자리에 (Dec-24). 링크 주소는 classic 푸터와 같게 둔다
// 안 읽은 최신 공지가 있으면 왼쪽 READY 자리에 엑셀 상태 메시지처럼 새 공지를 띄운다 (Dec-28). 읽음 처리는 /notices 방문 때
const Footer: React.FC = () => {
  const { unread } = useLastSeenNotice();
  const latest = unread ? getLatestNotification(notifications) : null;

  return (
    <footer className="w-full shrink-0 py-1.5 bg-[#217346] text-white border-t border-[#1a5a37] text-[11px] font-medium overflow-hidden">
      <div className="px-4 flex justify-between items-center h-6 gap-4">
        <div className="hidden sm:flex space-x-4 items-center h-full min-w-0">
          {latest ? (
            <Link
              href="/notices"
              className="flex items-center gap-1.5 px-2 h-full min-w-0 shrink bg-[#1a5a37] hover:bg-[#144a2d]"
            >
              <span className="shrink-0 font-bold">{getBannerLabel(latest.type)}</span>
              <span className="truncate">{latest.title}</span>
              <ChevronRight size={12} className="shrink-0" aria-hidden />
            </Link>
          ) : (
            <div className="hidden md:flex items-center space-x-1.5 px-2 h-full">
              {/* 상태 메시지: 평소 READY, 게임이 끝나면 게임 화면이 다음 퀴즈 안내를 채운다 (Dec-75) */}
              <span id="excel-status-message" className="empty:before:content-['READY']" />
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            </div>
          )}
          {/* 새 공지가 떠 있으면 좁은 폭에서는 출처를 숨겨 공지 제목에 자리를 준다 */}
          <p className={`opacity-70 text-[10px] truncate ${latest ? "hidden lg:block" : ""}`}>
            뉴맨틀은{" "}
            <a
              href="https://semantle-ko.newsjel.ly/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-100"
            >
              꼬맨틀
            </a>
            에서 영감을 받아 만들었어요.
          </p>
        </div>

        <div className="flex items-center h-full ml-auto">
          {/* 엑셀의 "평균 · 개수 · 합계" 자리에 게임 통계. 숫자는 게임 화면이 채운다 (Dec-68) */}
          <div id="excel-status-stats" className="hidden md:flex items-center gap-3 mr-4 whitespace-nowrap tabular-nums" />
          <div className="flex space-x-3 whitespace-nowrap">
            <a href="#" className="hover:underline opacity-80 hover:opacity-100">이용약관</a>
            <a href="#" className="hover:underline opacity-80 hover:opacity-100">개인정보처리방침</a>
            <a href="#" className="hover:underline opacity-80 hover:opacity-100">문의하기</a>
          </div>
          <div className="hidden md:flex items-center space-x-1 ml-3 pl-3 border-l border-[#ffffff44] h-full">
            <span className="opacity-60">100%</span>
            <div className="w-16 h-1 bg-[#ffffff44] relative rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-[100%] bg-white opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
