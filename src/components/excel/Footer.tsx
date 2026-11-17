"use client";
import React from "react";
import Link from "next/link";
import { ChevronRight, Github } from "lucide-react";
import { notifications } from "@/static/notifications";
import { useLastSeenNotice } from "@/hooks/useLastSeenNotice";
import { getBannerLabel, getLatestNotification } from "@/utils/notifications";

// 맨 아래 녹색 상태 표시줄. 약관·문의 링크는 640px 이상, 모바일은 설정 메뉴 (docs/specs/excel-ui Dec-14, Dec-82)
// 원작 출처는 엑셀의 파일 이름 자리에 (Dec-24). 링크 주소는 classic 푸터와 같게 둔다
// 왼쪽 정보 칸(엑셀 READY 자리)은 우선순위대로 하나만: 새 공지 > 다음 퀴즈 안내 > 꼬맨틀 출처 (Dec-28, Dec-79). 공지 읽음 처리는 /notices 방문 때
const Footer: React.FC = () => {
  const { unread } = useLastSeenNotice();
  const latest = unread ? getLatestNotification(notifications) : null;

  return (
    <footer className="w-full shrink-0 py-1.5 bg-[#217346] text-white border-t border-[#1a5a37] text-[11px] font-medium overflow-hidden">
      <div className="px-4 flex justify-between items-center h-6 gap-4">
        <div className="flex items-center h-full min-w-0">
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
            <>
              {/* 정보 칸(엑셀 READY 자리): 새 공지 > 게임이 끝나면 다음 퀴즈 안내(게임 화면이 채움) > 꼬맨틀 출처 (Dec-79) */}
              <span id="excel-status-message" className="peer px-2 truncate empty:hidden" />
              <p className="hidden peer-empty:block px-2 opacity-70 text-[10px] truncate">
                <a
                  href="https://github.com/teambh25/newmantle-fe"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="소스코드 (GitHub)"
                  title="소스코드 (GitHub)"
                  className="inline-flex align-middle hover:opacity-100"
                >
                  <Github size={12} aria-hidden="true" />
                </a>{" "}
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
            </>
          )}
        </div>

        <div className="flex items-center h-full ml-auto">
          {/* 모바일은 정보 칸에 자리를 주고 약관 링크는 설정 메뉴로 (Dec-82) */}
          <div className="hidden sm:flex space-x-3 whitespace-nowrap">
            <a href="#" className="hover:underline opacity-80 hover:opacity-100">이용약관</a>
            <a href="#" className="hover:underline opacity-80 hover:opacity-100">개인정보처리방침</a>
            <a href="mailto:teambh25@gmail.com" className="hover:underline opacity-80 hover:opacity-100">문의하기</a>
          </div>
          {/* 엑셀 확대(100%) 자리에 최고 유사도. 숫자는 게임 화면이 채우고, 없으면 칸을 숨긴다. 640px 이상 (Dec-80) */}
          <span
            id="excel-best-similarity"
            className="hidden sm:inline ml-3 pl-3 border-l border-[#ffffff44] whitespace-nowrap tabular-nums empty:hidden"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
