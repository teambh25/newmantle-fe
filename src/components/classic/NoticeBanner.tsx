"use client";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { notifications } from "@/static/notifications";
import { useLastSeenNotice } from "@/hooks/useLastSeenNotice";
import { getLatestNotification, getTypeLabel } from "@/utils/notifications";

// 메인: 안 읽은 최신 공지를 페이지 맨 위 가로 띠(announcement bar)로 (docs/tasks/ui/notices.md 2장)
// 테두리 박스는 입력창과 비슷해 보여서, 옅은 배경의 전체 폭 띠로 구분한다
export default function NoticeBanner() {
  const { unread, markSeen } = useLastSeenNotice();
  const latest = getLatestNotification(notifications);

  if (!unread || !latest) return null;

  return (
    <div className="w-full bg-blue-50 border-b border-blue-100">
      <div className="max-w-2xl mx-auto flex items-center gap-1 pl-4 pr-2 sm:px-6 md:px-8">
        <Link
          href="/notices"
          className="flex flex-1 min-w-0 items-center gap-2 py-2 text-sm text-blue-900 hover:text-blue-700"
        >
          <span className="shrink-0 text-xs font-semibold text-blue-600">
            {getTypeLabel(latest.type)}
          </span>
          <span className="truncate">{latest.title}</span>
          <ChevronRight size={14} className="shrink-0 text-blue-400" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={markSeen}
          aria-label="공지 닫기"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-blue-400 hover:text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
