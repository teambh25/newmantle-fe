import { createClient } from '@/utils/supabase/client';

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { 'Authorization': `Bearer ${session.access_token}` };
  }

  if (typeof window !== 'undefined') {
    let guestId = localStorage.getItem('newmantle_guest_id');
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem('newmantle_guest_id', guestId);
    }
    return { 'X-Guest-Id': guestId };
  }

  return {};
}

export interface AnswerData {
  word: string;
  tag: string;
  description: string;
}

export interface SubmittedWord {
  word: string;
  similarity: number | null;
  rank: number;
  attempt: number;
  correct: boolean;
  answer?: AnswerData | null;
}

export interface HintResponse {
  hint: string;
  score: number | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const submitWord = async (
  word: string,
  attempt: number,
  gameDate: string
): Promise<SubmittedWord> => {
  const encodedWord = encodeURIComponent(word);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/v2/quizzes/${gameDate}/guess/${encodedWord}`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 404) {
      throw new Error("Invalid guess request");
    }
    if (response.status === 422) {
      throw new Error("Invalid date format");
    }
    if (response.status === 500) {
      throw new Error("Server error");
    }
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();

    return {
      word,
      similarity: data.score,
      rank: data.rank,
      attempt,
      correct: data.correct,
      answer: data.correct ? data.answer : null,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

// gameDate: KST 기준 YYYY-MM-DD 문자열 (Date로 변환하면 타임존에 따라 날짜가 밀림)
export const getHint = async (gameDate: string, rank: number): Promise<HintResponse> => {
  const formattedDate = gameDate;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/v2/quizzes/${formattedDate}/hint/${rank}`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 404) {
      throw new Error("Invalid hint request");
    }
    if (response.status === 422) {
      throw new Error("Invalid date format or rank");
    }
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();
    return {
      hint: JSON.parse(`"${data.hint}"`), // Unicode 문자열을 실제 한글로 변환
      score: data.score,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

// gameDate: KST 기준 YYYY-MM-DD 문자열
export const getRecentAnswer = async (gameDate: string): Promise<AnswerData> => {
  const formattedDate = gameDate;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/v2/quizzes/${formattedDate}/give-up`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 404) {
      throw new Error("Quiz not found for this date");
    }
    if (response.status === 422) {
      throw new Error("Future date or invalid format");
    }
    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    return {
      word: data.word,
      tag: data.tag,
      description: data.description,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

import { StatOverviewResp, SharerStats } from "../types/stats";

export const linkGuestStats = async (guestId: string): Promise<void> => {
  const authHeader = await getAuthHeader();
  const response = await fetch(`${API_BASE_URL}/v2/stats/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ guest_id: guestId }),
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(`link failed: ${response.status}`);
  }
};

export const fetchSharerStats = async (
  sharerType: "guest" | "user",
  sharerId: string,
  date: string
): Promise<SharerStats> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(
      `${API_BASE_URL}/v2/stats/${sharerType}/${sharerId}/${date}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (response.status === 404) throw new Error("STATS_NOT_FOUND");
    if (!response.ok) throw new Error(`fetchSharerStats failed: ${response.status}`);
    return await response.json() as SharerStats;
  } catch (error) {
    if ((error as Error).name === "AbortError") throw new Error("Request timeout");
    throw error;
  }
};

export const fetchStatsOverview = async (startDate: string, endDate: string): Promise<StatOverviewResp> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/v2/stats?start_date=${startDate}&end_date=${endDate}`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 401) {
      throw new Error("Authentication failed");
    }
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

