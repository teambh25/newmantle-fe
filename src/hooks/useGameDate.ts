import { useState, useEffect } from "react";
import { getKSTDateString } from "@/utils/date";

export function useGameDate() {
  const [gameDate, setGameDate] = useState<string>("");

  useEffect(() => {
    setGameDate(getKSTDateString());
  }, []);

  return gameDate;
}
