import { formatDate } from "./date";

export interface SubmittedWord {
  word: string;
  similarity: number | null;
  rank: number;
  attempt: number;
  correct: boolean;
}

export interface HintResponse {
  consonants: string;
  word: string;
  score: number;
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
    const response = await fetch(
      `${API_BASE_URL}/guess/${gameDate}/${encodedWord}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (response.status === 400) {
      throw new Error("Invalid word");
    }
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();
    return {
      word,
      similarity: data.correct ? null : data.score,
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
    const response = await fetch(
      `${API_BASE_URL}/hint/${formattedDate}/${rank}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error("API request failed");
    }
    const data = await response.json();
    return {
      consonants: JSON.parse(`"${data.consonants}"`), // Unicode 문자열을 실제 한글로 변환
      word: JSON.parse(`"${data.word}"`), // Unicode 문자열을 실제 한글로 변환
      score: data.score,
    };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
};