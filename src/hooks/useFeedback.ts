"use client";
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { logEvent } from "@/utils/amplitude";
import { getKSTDateString } from "@/utils/date";
import { getOpenQuizDate } from "@/hooks/useGameDate";
import { createClient } from "@/utils/supabase/client";
import { buildFeedbackRow } from "@/utils/feedback";

// 피드백 창 공통 로직 (classic·excel). docs/tasks/ui/feedback/plan.md, 전송은 docs/specs/feedback-migration

/** 피드백을 시트에 적는 Apps Script 웹앱 (apps-script/feedback/Code.gs). 공개 주소다. 개발 중 테스트용 웹앱은 .env.local로 바꾼다 */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL;
/** 마지막으로 보낸 KST 날짜. 하루 1회 판정용, 보내는 시점 날짜 (Dec-2, Dec-14, feedback-migration Dec-9) */
const SENT_DATE_KEY = "newmantle_feedback_sent_date";
const FEEDBACK_MAX_LENGTH = 500;
/** 화면은 기다리지 않는다. 이 시간이 지나도 응답이 없으면 실패로 보고 Sentry에 알린다 (feedback-migration Dec-4) */
const FEEDBACK_TIMEOUT_MS = 10_000;

export type FeedbackEntry = "settings" | "result";

function readSentDate(): string | null {
  try {
    return localStorage.getItem(SENT_DATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Apps Script로 보낸다. text/plain이라 사전 확인 없이 나가고, 응답의 ok로 성공을 안다 (feedback-migration Dec-2).
 * keepalive로 보내 탭을 바로 닫아도 요청은 끝까지 간다 (feedback-migration Dec-3)
 */
async function postFeedback(feedback: string, quizDate: string) {
  const {
    data: { session },
  } = await createClient().auth.getSession();
  const row = buildFeedbackRow({ feedback, userId: session?.user?.id ?? null, quizDate });

  if (!FEEDBACK_URL) throw new FeedbackSendError("NEXT_PUBLIC_FEEDBACK_URL 없음");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);
  try {
    const response = await fetch(FEEDBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(row),
      keepalive: true,
      signal: controller.signal,
    });
    const result = await response.json().catch(() => null);
    if (result?.ok !== true) throw new FeedbackSendError(`성공 표시 없는 응답 (status ${response.status})`);
  } finally {
    clearTimeout(timeout);
  }
}

/** Sentry에서 피드백 전송 실패로 바로 알아보게 이름과 메시지를 붙인다. 원래 오류는 cause로 남긴다 */
class FeedbackSendError extends Error {
  constructor(reason: string, cause?: unknown) {
    super(`피드백 전송 실패: ${reason}`, { cause });
    this.name = "FeedbackSendError";
  }
}

/** 실패는 화면에 보이지 않으므로 Sentry로 알린다. 본문은 보내지 않는다 (feedback-migration Dec-4) */
function reportFailure(error: unknown) {
  const reported =
    error instanceof FeedbackSendError
      ? error
      : (error as { name?: unknown } | null)?.name === "AbortError"
        ? new FeedbackSendError(`${FEEDBACK_TIMEOUT_MS / 1000}초 동안 응답 없음`, error)
        : new FeedbackSendError(`요청 오류 (${String(error)})`, error);
  Sentry.captureException(reported, { tags: { feature: "feedback" } });
}

export function useFeedback({ entry }: { entry: FeedbackEntry }) {
  const [text, setText] = useState("");
  // 열 때의 KST 날짜로 판정한다. 창은 열 때마다 새로 마운트된다
  const [sent, setSent] = useState(() => readSentDate() === getKSTDateString());

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !sent;

  const submit = () => {
    if (!canSend) return;
    // 하루 1회 저장값은 보내는 시점의 KST 날짜 (Dec-10, feedback-migration Dec-9)
    const sentDate = getKSTDateString();
    // 행과 Feedback Submitted의 퀴즈 날짜: 열려 있는 게임 화면 기준, 없으면(통계 화면) 오늘 (feedback-migration Dec-9)
    const quizDate = getOpenQuizDate() ?? sentDate;

    // 응답을 기다리지 않고 바로 보낸 상태로 바꾼다 (feedback-migration Dec-3)
    postFeedback(trimmed, quizDate).catch(reportFailure);
    try {
      localStorage.setItem(SENT_DATE_KEY, sentDate);
    } catch {
      // 저장하지 못해도 이번 창에서는 보낸 상태로 둔다
    }
    // 창은 그대로 두고 감사 안내로 바뀐다. 성공 토스트는 없다 (Dec-18)
    setSent(true);
    setText("");
    // 누른 행동을 남긴다. 저장 성공 여부와 무관하다 (feedback-migration Dec-16).
    // 본문은 Amplitude에 보내지 않는다 (Dec-8). 퀴즈 날짜는 행과 같은 값 (docs/specs/amplitude-migration Dec-34)
    logEvent("Feedback Submitted", { quiz_date: quizDate, entry });
  };

  return { text, setText, sent, canSend, submit, maxLength: FEEDBACK_MAX_LENGTH };
}
