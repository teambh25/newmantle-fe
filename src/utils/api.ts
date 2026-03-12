import { formatDate } from "./date";
import { createClient } from '@/utils/supabase/client';

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export interface SubmittedWord {
  word: string;
  similarity: number | null;
  rank: number;
  attempt: number;
  correct: boolean;
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
      throw new Error("Date or word not found");
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
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};

export const getHint = async (date: Date, rank: number): Promise<HintResponse> => {
  const formattedDate = formatDate(date);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/quizzes/${formattedDate}/hint/${rank}`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 400) {
      throw new Error("Quiz not found for this date");
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

export const getRecentAnswer = async (date: Date): Promise<string> => {
  const formattedDate = formatDate(date);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(
      `${API_BASE_URL}/quizzes/${formattedDate}/recent-answer`,
      {
        signal: controller.signal,
        headers: { ...authHeader }
      }
    );
    clearTimeout(timeoutId);
    if (response.status === 400) {
      throw new Error("Quiz not found for this date");
    }
    if (response.status === 422) {
      throw new Error("Invalid date format");
    }
    if (!response.ok) {
      throw new Error("API request failed");
    }

    // Prefer text response; fallback to JSON string if provided.
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      // If API returns a raw JSON string (e.g., "정답"), handle both string and {answer}
      if (typeof data === "string") {
        return JSON.parse(`"${data}"`);
      }
      if (typeof data?.answer === "string") {
        return JSON.parse(`"${data.answer}"`);
      }
      throw new Error("Unexpected response format");
    }

    const text = await response.text();
    // Try to decode any escaped unicode inside quotes, else return as-is
    const trimmed = text.trim();
    if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || trimmed.includes("\\u")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // ignore and return raw text
      }
    }
    return trimmed;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};
