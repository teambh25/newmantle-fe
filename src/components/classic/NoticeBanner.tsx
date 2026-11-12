"use client";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { notifications } from "@/static/notifications";
import { useLastSeenNotice } from "@/hooks/useLastSeenNotice";
import { getBannerLabel, getLatestNotification, isIncident } from "@/utils/notifications";

// 메인: 안 읽은 최신 공지를 페이지 맨 위 가로 띠(announcement bar)로 (docs/tasks/ui/notices.md 2장)
// 테두리 박스는 입력창과 비슷해 보여서, 옅은 배경의 전체 폭 띠로 구분한다
// 평소엔 파란 띠 + 진한 라벨, 장애 공지만 빨간 띠 (docs/tasks/ui/color.md)
const STYLES = {
  normal: {
    bar: "bg-blue-50 border-blue-100",
    link: "text-gray-700 hover:text-blue-700",
    label: "text-gray-900",
    divider: "bg-blue-200",
    icon: "text-blue-400",
    close: "text-blue-400 hover:text-blue-700 hover:bg-blue-100",
  },
  incident: {
    bar: "bg-red-50 border-red-100",
    link: "text-red-900 hover:text-red-700",
    label: "text-red-700",
    divider: "bg-red-200",
    icon: "text-red-400",
    close: "text-red-400 hover:text-red-700 hover:bg-red-100",
  },
};

export default function NoticeBanner() {
  const { unread, markSeen } = useLastSeenNotice();
  const latest = getLatestNotification(notifications);

  if (!unread || !latest) return null;

  const s = isIncident(latest.type) ? STYLES.incident : STYLES.normal;

  return (
    <div className={`w-full border-b ${s.bar}`}>
      <div className="max-w-2xl mx-auto flex items-center gap-1 pl-4 pr-2 sm:px-6 md:px-8">
        <Link
          href="/notices"
          className={`flex flex-1 min-w-0 items-center gap-2 py-2 text-sm ${s.link}`}
        >
          <span className={`shrink-0 text-xs font-bold ${s.label}`}>
            {getBannerLabel(latest.type)}
          </span>
          <span className={`shrink-0 w-px h-3 ${s.divider}`} aria-hidden />
          <span className="truncate">{latest.title}</span>
          <ChevronRight size={14} className={`shrink-0 ${s.icon}`} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={markSeen}
          aria-label="공지 닫기"
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${s.close}`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
