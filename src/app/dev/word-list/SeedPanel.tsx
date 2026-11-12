"use client";
// 개발 전용: 가짜 단어 목록을 저장하고 메인으로 이동 (docs/tasks/ui/word-list.md 5장)
import { useEffect } from "react";
import { getKSTDateString } from "@/utils/date";
import { RULE_MODAL_SEEN_KEY } from "@/hooks/useRuleIntroModal";
import { SCENARIOS, Scenario } from "./fixtures";

const GAME_KEY = "newmantle_game_data";

function seed(s: Scenario) {
  // 포기한 정답 항목은 입력이 아니므로 세지 않음
  const attempts = s.words.filter((x) => x.attempt > 0 && !(s.givenUp && x.correct)).length;
  localStorage.setItem(
    GAME_KEY,
    JSON.stringify({
      submittedWords: s.words,
      attempts,
      solvedAttempts: s.solved || s.givenUp ? attempts : null,
      gameCompleted: !!(s.solved || s.givenUp),
      lastPlayedDate: getKSTDateString(),
      hintUsed: s.words.filter((x) => x.attempt === -1 && x.rank > 0).length,
      givenUp: !!s.givenUp,
      initialConsonantHintUsed: s.words.some((x) => x.attempt === -1 && x.rank === 0),
      answerSurveyVoted: null,
      firstActionAt: Date.now(),
    }),
  );
  localStorage.setItem(RULE_MODAL_SEEN_KEY, "1");
  window.location.href = "/";
}

export default function SeedPanel() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    const s = SCENARIOS.find((x) => x.id === id);
    if (s) seed(s);
  }, []);

  return (
    <main className="max-w-md mx-auto p-4 space-y-3">
      <h1 className="text-lg font-bold">단어 목록 확인용 (개발 전용)</h1>
      <p className="text-sm text-gray-600">
        누르면 오늘 게임 기록을 가짜 목록으로 덮어쓰고 메인으로 이동합니다.
      </p>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => seed(s)}
          className="block w-full text-left border rounded px-3 py-2 hover:bg-gray-50"
        >
          {s.label}
        </button>
      ))}
      <button
        onClick={() => {
          localStorage.removeItem(GAME_KEY);
          window.location.href = "/";
        }}
        className="block w-full text-left border rounded px-3 py-2 text-red-600 hover:bg-red-50"
      >
        기록 지우기
      </button>
    </main>
  );
}
