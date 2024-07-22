import { useState, useEffect } from "react";
import { formatDate } from "@/utils/date";

export function useGameDate() {
  const [gameDate, setGameDate] = useState<string>("");

  useEffect(() => {
    setGameDate(formatDate(new Date()));
  }, []);

  return gameDate;
}
