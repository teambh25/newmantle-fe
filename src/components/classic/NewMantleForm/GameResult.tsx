"use client";
import { useState } from "react";
import { MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SurveyForm from "@/components/classic/SurveyForm";
import { useAuthUser } from "@/hooks/useAuthUser";

interface GameResultProps {
  givenUp: boolean;
  gameCompleted: boolean;
  solvedAttempts: number | null;
  correctAttempts: number;
  onShare: () => void;
}

// 정답은 초록, 포기는 축하 색 없이 회색 (날짜 제목 타일과 같은 뜻, docs/tasks/ui/result-box.md)
const BOX_TONE = {
  solved: "bg-green-50 border-green-500 text-green-700",
  givenUp: "bg-gray-50 border-gray-300 text-gray-700",
};

// 공유·피드백 버튼은 상자 색을 따른다 (docs/tasks/ui/result-box.md 7)
const ACTION_BUTTON = {
  solved: "bg-white border-green-500 text-green-700 hover:bg-green-100 hover:text-green-800",
  givenUp: "bg-white border-gray-300 text-gray-700",
};

export function GameResult({ givenUp, gameCompleted, solvedAttempts, correctAttempts, onShare }: GameResultProps) {
  const { user, isLoading: authLoading } = useAuthUser();
  const [showFeedback, setShowFeedback] = useState(false);
  if (!gameCompleted && !givenUp) return null;

  const displaySolvedAttempts = solvedAttempts ?? correctAttempts;
  const tone = givenUp ? "givenUp" : "solved";

  return (
    <section
      aria-label="게임 결과"
      className={`w-full mb-6 p-4 border rounded-md flex flex-col items-center text-center ${BOX_TONE[tone]}`}
    >
      {/* 정답 토스트 대신 여기서 축하한다 (꽃가루는 그대로) */}
      <p className="font-bold">{givenUp ? "게임을 포기하셨습니다." : "축하합니다!"}</p>
      <p>
        {givenUp
          ? `${displaySolvedAttempts}번 시도 후 포기하셨습니다.`
          : `${displaySolvedAttempts}번째 시도에 정답을 맞히셨습니다.`}
      </p>
      <p>(내일은 새로운 단어로 도전할 수 있어요!)</p>

      {/* 비로그인만: 로그인하면 게스트 기록이 계정으로 연결된다. 로그인 버튼은 헤더에 있다 (docs/tasks/ui/plan.md 8장) */}
      {!authLoading && !user && (
        <p className="mt-2 text-sm">{givenUp ? "로그인하면 오늘 기록이 남아요" : "로그인하면 오늘 맞힌 기록이 남아요"}</p>
      )}

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onShare} className={ACTION_BUTTON[tone]}>
          <Share2 className="mr-1.5 h-4 w-4" />
          공유하기
        </Button>
        <Button variant="outline" onClick={() => setShowFeedback(true)} className={ACTION_BUTTON[tone]}>
          <MessageSquare className="mr-1.5 h-4 w-4" />
          피드백 보내기
        </Button>
      </div>

      {/* 설정 메뉴 "피드백 남기기"와 같은 창 */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md sm:rounded-xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={20} />
              피드백
            </DialogTitle>
          </DialogHeader>
          <div className="w-full p-2">
            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100">
              <SurveyForm />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
