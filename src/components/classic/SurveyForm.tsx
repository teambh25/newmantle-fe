"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { FeedbackEntry, useFeedback } from "@/hooks/useFeedback";

// 피드백 창 내용 (docs/tasks/ui/feedback/plan.md). 투표 없이 바로 입력, KST 날짜당 1회
const SurveyForm: React.FC<{ entry: FeedbackEntry }> = ({ entry }) => {
  const { text, setText, sent, canSend, submit, maxLength } = useFeedback({
    entry,
    theme: "classic",
  });

  if (sent) {
    return (
      <div role="status" className="w-full max-w-2xl py-4 text-center">
        <p className="font-semibold text-gray-800">의견 보내주셔서 고마워요!</p>
        <p className="mt-1 text-sm text-gray-500">
          보내주신 의견은 더 나은 게임을 만드는 데 소중히 활용할게요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <p className="mb-3 text-sm text-gray-600">
        불편한 점, 바라는 점 무엇이든 적어주세요. 보내주신 의견은 게임을 개선하는 데 큰 도움이
        돼요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={maxLength}
        rows={4}
        aria-label="피드백 내용"
        placeholder={"예) 오늘 정답 단어 재밌었어요\n유사도 순위가 이상해요\n이런 기능이 있으면 좋겠어요\n버그를 발견했어요"}
        className="w-full resize-none rounded-md border border-input bg-white px-3 py-2 text-base sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />
      <p className="mb-2 text-right text-xs text-gray-400">
        {text.length}/{maxLength}
      </p>
      <Button onClick={submit} disabled={!canSend} className="w-full">
        보내기
      </Button>
    </div>
  );
};

export default SurveyForm;
