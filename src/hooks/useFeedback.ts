"use client";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";
import { getKSTDateString } from "@/utils/date";
import { getOpenQuizDate } from "@/hooks/useGameDate";

// 피드백 창 공통 로직 (classic·excel). docs/tasks/ui/feedback/plan.md

const WEBHOOK_URL = "https://hook.eu2.make.com/ojb3ezccxcl55rqyhy3lgklp2jlqvxtg";
/** 마지막으로 보낸 KST 날짜. 퀴즈 날짜당 1회 (Dec-2, Dec-14) */
const SENT_DATE_KEY = "newmantle_feedback_sent_date";
const GAME_DATA_KEY = "newmantle_game_data";
const FEEDBACK_MAX_LENGTH = 500;

export type FeedbackEntry = "settings" | "result";
type FeedbackTheme = "classic" | "excel";
type GameStatus = "playing" | "solved" | "given_up";

function readSentDate(): string | null {
  try {
    return localStorage.getItem(SENT_DATE_KEY);
  } catch {
    return null;
  }
}

/** 그날 게임 기록에서 진행 상태를 읽는다. 게임 기록은 바꾸지 않는다 (Dec-11) */
function readGameStatus(quizDate: string): GameStatus {
  try {
    const data = JSON.parse(localStorage.getItem(GAME_DATA_KEY) ?? "null");
    if (!data || data.lastPlayedDate !== quizDate) return "playing";
    if (data.givenUp) return "given_up";
    if (data.gameCompleted) return "solved";
  } catch {
    // 읽지 못하면 진행 중으로 본다
  }
  return "playing";
}

export function useFeedback({ entry, theme }: { entry: FeedbackEntry; theme: FeedbackTheme }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // 열 때의 KST 날짜로 판정한다. 창은 열 때마다 새로 마운트된다
  const [sent, setSent] = useState(() => readSentDate() === getKSTDateString());

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !sending && !sent;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    // 보내는 시점의 KST 날짜 (Dec-10)
    const quizDate = getKSTDateString();
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: trimmed,
          timestamp: new Date().toISOString(),
          quizDate,
          theme,
          entry,
          gameStatus: readGameStatus(quizDate),
        }),
      });
      if (!response.ok) throw new Error(`feedback webhook ${response.status}`);
      try {
        localStorage.setItem(SENT_DATE_KEY, quizDate);
      } catch {
        // 저장하지 못해도 이번 창에서는 보낸 상태로 둔다
      }
      // 창은 그대로 두고 감사 안내로 바뀐다. 성공 토스트는 없다 (Dec-18)
      setSent(true);
      setText("");
      // 본문은 Amplitude에 보내지 않는다 (Dec-8). 퀴즈 날짜는 열려 있는 게임 화면 기준, 없으면(통계 화면) 오늘 (docs/specs/amplitude-migration Dec-34)
      logEvent("Feedback Submitted", { quiz_date: getOpenQuizDate() ?? quizDate, entry });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "피드백을 보내지 못했어요",
        description: "잠시 후 다시 보내주세요.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return { text, setText, sending, sent, canSend, submit, maxLength: FEEDBACK_MAX_LENGTH };
}
