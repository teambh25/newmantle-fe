import { useState, useEffect } from "react";

const STORAGE_KEY = "newmantle_last_notification_check";

export function useNotifications() {
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setLastCheckDate(saved);
    
    // Set a small timeout so that the first render can use the old saved date
    // before we overwrite it with 'now'
    setTimeout(() => {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
    }, 100);
  }, []);

  const isNew = (notificationDateStr: string) => {
    // Return false until we've loaded the initial check date from localStorage
    // to prevent hydration mismatches and incorrectly showing NEW on first render
    if (lastCheckDate === null && typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return false; // We'll evaluate properly on next render, but assume false for now if they have a history
    }

    const notiDate = new Date(notificationDateStr);
    const now = new Date();
    
    // 1. 3일 이내에 올라온 공지인가?
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);
    const isWithin3Days = notiDate >= threeDaysAgo;

    // 2. 마지막 확인 시점 이전에 올라온 공지인가?
    // 만약 사용자가 이미 이 공지사항을 확인했다면 (lastCheckDate가 notiDate보다 이후라면)
    // 3일 이내의 공지라도 NEW 배지를 보여주지 않습니다.
    if (lastCheckDate) {
      const isAfterLastCheck = notiDate > new Date(lastCheckDate);
      return isAfterLastCheck;
    }

    // 기록이 없으면 (완전 처음 방문) 3일 이내인 것만 N 표시
    return isWithin3Days;
  };

  return { isNew };
}
