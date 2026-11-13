"use client";
// 개발 전용: 가짜 단어 목록·실패 화면을 정하고 메인으로 이동 (docs/tasks/ui/dev-page/plan.md)
import { useEffect } from "react";
import { getKSTDateString } from "@/utils/date";
import { RULE_MODAL_SEEN_KEY } from "@/hooks/useRuleIntroModal";
import { SCENARIOS, Scenario } from "./fixtures";
import { TARGET_LABELS, writeFaults, type FaultTarget } from "./faults";

const GAME_KEY = "newmantle_game_data";
const FAULT_TARGETS = Object.keys(TARGET_LABELS) as FaultTarget[];

function goHome() {
  window.location.href = "/";
}

/** 그 요청이 다음 한 번 실패하도록 해 두고 메인으로. 힌트·초성·포기는 버튼이 눌리도록 기록을 비운다 (20위 안 단어가 있으면 힌트가 꺼짐) */
function armFault(target: FaultTarget) {
  if (target !== "guess") localStorage.removeItem(GAME_KEY);
  localStorage.setItem(RULE_MODAL_SEEN_KEY, "1");
  writeFaults([target]);
  goHome();
}

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
  goHome();
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-bold">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

const ROW = "block w-full text-left border rounded px-3 py-2 hover:bg-gray-50";

export default function DevPanel() {
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("s");
    const s = SCENARIOS.find((x) => x.id === id);
    if (s) seed(s);
  }, []);

  return (
    <main className="max-w-md mx-auto p-4 space-y-8">
      <h1 className="text-lg font-bold">화면 확인 (개발 전용)</h1>

      <Section title="단어 목록" description="누르면 오늘 게임 기록을 가짜 목록으로 덮어쓰고 메인으로 이동합니다.">
        {SCENARIOS.map((s) => (
          <button key={s.id} onClick={() => seed(s)} className={ROW}>
            {s.label}
          </button>
        ))}
        <button
          onClick={() => {
            localStorage.removeItem(GAME_KEY);
            goHome();
          }}
          className={`${ROW} text-red-600 hover:bg-red-50`}
        >
          기록 지우기
        </button>
      </Section>

      <Section
        title="실패 화면"
        description="누르면 그 요청이 다음 한 번 실패하도록 해 두고 메인으로 이동합니다. 힌트·초성 힌트·포기는 기록을 비우고 시작합니다. 없는 단어는 직접 입력해 보세요."
      >
        {FAULT_TARGETS.map((target) => (
          <button key={target} onClick={() => armFault(target)} className={ROW}>
            {TARGET_LABELS[target]} 실패
          </button>
        ))}
      </Section>
    </main>
  );
}
