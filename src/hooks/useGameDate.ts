import { useState, useEffect } from "react";
import { getKSTDateString } from "@/utils/date";

// 지금 열려 있는 게임 화면의 퀴즈 날짜. 게임 화면 밖(피드백 등)에서 같은 퀴즈 날짜를 쓰려고 둔다
let openQuizDate: string | null = null;

/** 열려 있는 게임 화면의 퀴즈 날짜. 게임 화면이 없으면 null */
export function getOpenQuizDate(): string | null {
  return openQuizDate;
}

export function useGameDate() {
  const [gameDate, setGameDate] = useState<string>("");

  useEffect(() => {
    // 마운트할 때의 KST 날짜로 고정한다. 화면을 연 채 자정이 지나도 어제 퀴즈다
    const date = getKSTDateString();
    setGameDate(date);
    openQuizDate = date;
    return () => {
      if (openQuizDate === date) openQuizDate = null;
    };
  }, []);

  return gameDate;
}
