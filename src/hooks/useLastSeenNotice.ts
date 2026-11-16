import { useCallback, useEffect, useState } from "react";
import { notifications } from "@/static/notifications";
import {
  LAST_SEEN_NOTICE_KEY,
  LEGACY_NOTICE_CHECK_KEY,
  getLatestNotification,
  isLatestUnread,
} from "@/utils/notifications";

/** 최신 공지를 본 것으로 저장 (/notices 방문, 배너 닫기) */
export function markLatestNoticeSeen() {
  const latest = getLatestNotification(notifications);
  if (latest) localStorage.setItem(LAST_SEEN_NOTICE_KEY, latest.id);
}

/**
 * 최신 공지 안 읽음 여부. 읽기만 하고, 읽음 처리는 markSeen을 부를 때만 한다
 * (docs/tasks/ui/notices/plan.md 3)
 */
export function useLastSeenNotice() {
  // localStorage를 읽기 전에는 false (배너를 띄우지 않음)
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    setUnread(
      isLatestUnread(notifications, {
        lastSeenId: localStorage.getItem(LAST_SEEN_NOTICE_KEY),
        legacyCheck: localStorage.getItem(LEGACY_NOTICE_CHECK_KEY),
        now: new Date(),
      })
    );
  }, []);

  const markSeen = useCallback(() => {
    markLatestNoticeSeen();
    setUnread(false);
  }, []);

  return { unread, markSeen };
}
