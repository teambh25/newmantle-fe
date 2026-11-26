"use client";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";
import { getKSTDateString } from "@/utils/date";
import { getOpenQuizDate } from "@/hooks/useGameDate";
import { createClient } from "@/utils/supabase/client";
import { buildFeedbackRow } from "@/utils/feedback";

// 피드백 창 공통 로직 (classic·excel). docs/tasks/ui/feedback/plan.md, 저장은 docs/specs/feedback-migration

/** 마지막으로 보낸 KST 날짜. 하루 1회 판정용, 보내는 시점 날짜 (Dec-2, Dec-14, feedback-migration Dec-25) */
const SENT_DATE_KEY = "newmantle_feedback_sent_date";
const FEEDBACK_MAX_LENGTH = 500;
/** 다른 요청처럼 3초가 지나면 실패로 본다 */
const FEEDBACK_TIMEOUT_MS = 3000;

export type FeedbackEntry = "settings" | "result";

function readSentDate(): string | null {
  try {
    return localStorage.getItem(SENT_DATE_KEY);
  } catch {
    return null;
  }
}

/** Supabase feedback 테이블에 넣는다. 결과 행은 받지 않는다(select 권한 없음, feedback-migration Dec-3) */
async function insertFeedback(feedback: string, quizDate: string) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const row = buildFeedbackRow({ feedback, userId: session?.user?.id ?? null, quizDate });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);
  try {
    const { error } = await supabase.from("feedback").insert(row).abortSignal(controller.signal);
    if (error) throw new Error(`feedback insert: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export function useFeedback({ entry }: { entry: FeedbackEntry }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // 열 때의 KST 날짜로 판정한다. 창은 열 때마다 새로 마운트된다
  const [sent, setSent] = useState(() => readSentDate() === getKSTDateString());

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !sending && !sent;

  const submit = async () => {
    if (!canSend) return;
    setSending(true);
    // 하루 1회 저장값은 보내는 시점의 KST 날짜 (Dec-10, feedback-migration Dec-25)
    const sentDate = getKSTDateString();
    // 행과 Feedback Submitted의 퀴즈 날짜: 열려 있는 게임 화면 기준, 없으면(통계 화면) 오늘 (feedback-migration Dec-24)
    const quizDate = getOpenQuizDate() ?? sentDate;
    try {
      await insertFeedback(trimmed, quizDate);
      try {
        localStorage.setItem(SENT_DATE_KEY, sentDate);
      } catch {
        // 저장하지 못해도 이번 창에서는 보낸 상태로 둔다
      }
      // 창은 그대로 두고 감사 안내로 바뀐다. 성공 토스트는 없다 (Dec-18)
      setSent(true);
      setText("");
      // 본문은 Amplitude에 보내지 않는다 (Dec-8). 퀴즈 날짜는 행과 같은 값 (docs/specs/amplitude-migration Dec-34)
      logEvent("Feedback Submitted", { quiz_date: quizDate, entry });
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
