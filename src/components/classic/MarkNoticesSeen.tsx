"use client";
import { useEffect } from "react";
import { markLatestNoticeSeen } from "@/hooks/useLastSeenNotice";

// /notices에 들어오면 최신 공지를 본 것으로 저장 (docs/tasks/ui/notices/plan.md 3)
export default function MarkNoticesSeen() {
  useEffect(() => {
    markLatestNoticeSeen();
  }, []);
  return null;
}
