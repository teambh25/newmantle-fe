export interface SubmittedWord {
  word: string;
  similarity: number | null;
  rank: number;
  attempt: number;
  correct: boolean;
}

export const submitWord = async (
  word: string,
  attempt: number
): Promise<SubmittedWord> => {
  const encodedWord = encodeURIComponent(word);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(
      `http://3.35.132.212:5000/guess/1/${encodedWord}`,
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
