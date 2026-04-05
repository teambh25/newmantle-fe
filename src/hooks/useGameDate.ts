import { useState, useEffect } from "react";
import { formatDate } from "@/utils/date";

export function useGameDate() {
  const [gameDate, setGameDate] = useState<string>("");

  useEffect(() => {
    // 테스트용으로 어제 날짜 반환
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setGameDate(formatDate(yesterday));
  }, []);

  return gameDate;
}
