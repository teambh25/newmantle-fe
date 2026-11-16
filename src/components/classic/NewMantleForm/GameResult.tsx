"use client";
import { ChevronRight, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SurveyForm from "@/components/classic/SurveyForm";
import type { AnswerData } from "@/utils/api";
import { SPOTLIGHT_ATTR } from "@/components/AuthButton";

// 결과창 모달 (docs/tasks/ui/result-box/plan.md)

interface ResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  givenUp: boolean;
  attempts: number;
  answer: AnswerData | null;
  onShare: () => void;
  onFeedback: () => void;
}

// 정답은 흰 배경 + 메인 색(파랑) 포인트, 포기는 축하 색 없이 회색 (요구사항 7)
const TONE = {
  solved: { title: "text-blue-700", badge: "bg-blue-50 text-blue-700" },
  givenUp: { title: "text-gray-700", badge: "bg-gray-200 text-gray-600" },
};

// PC는 가운데 모달, 모바일은 아래에 붙는 바텀시트. 넘치면 안에서 스크롤 (요구사항 5)
const SHEET_CLASS = [
  "left-0 top-auto bottom-0 translate-x-0 translate-y-0 max-w-none rounded-t-2xl max-h-[90dvh] overflow-y-auto",
  "max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full",
  "max-sm:data-[state=open]:slide-in-from-left-0 max-sm:data-[state=closed]:slide-out-to-left-0",
  "max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:zoom-out-100",
  "sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-md sm:rounded-xl sm:max-h-[85vh]",
].join(" ");

export function ResultDialog({ open, onOpenChange, givenUp, attempts, answer, onShare, onFeedback }: ResultDialogProps) {
  const tone = TONE[givenUp ? "givenUp" : "solved"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={SHEET_CLASS}
        aria-describedby={undefined}
        // 강조된 헤더 로그인을 누를 때 결과창이 먼저 닫히면, 닫히는 동안 남은 배경이 클릭을 가로채 이동하지 않는다 (요구사항 8)
        onPointerDownOutside={(e) => {
          if ((e.target as Element | null)?.closest?.(`[${SPOTLIGHT_ATTR}]`)) e.preventDefault();
        }}
      >
        {/* 화면에 보이는 첫 줄은 축하 문구라, 창 이름은 스크린 리더용으로 따로 둔다 */}
        <DialogTitle className="sr-only">게임 결과</DialogTitle>

        {/* 1. 축하(포기 안내) + 시도 횟수 */}
        <div className="pt-2 text-center">
          <p className={`text-xl font-bold ${tone.title}`}>{givenUp ? "게임을 포기했어요." : "🎉 정답을 맞혔어요!"}</p>
          <p className="mt-1 text-gray-700">
            {givenUp ? `아쉽지만 정답을 찾지 못했어요. (${attempts}회 시도)` : `${attempts}번의 시도 끝에 정답을 맞혔어요!`}
          </p>
        </div>

        {/* 2. 카테고리 뱃지 + 정답, 아래 설명. 정답은 날짜 제목에 크게 있으므로 강조하지 않는다 */}
        {answer && (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-left break-keep">
            <p className="flex flex-wrap items-center gap-2">
              {answer.tag && (
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tone.badge}`}>{answer.tag}</span>
              )}
              <span className="font-semibold text-gray-900">{answer.word}</span>
            </p>
            {answer.description && <p className="mt-1.5 text-gray-600">{answer.description}</p>}
          </div>
        )}

        {/* 3. 공유·피드백: 가운데 정렬한 작은 버튼 한 쌍 */}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={onShare} className="text-gray-700">
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            공유하기
          </Button>
          <Button variant="outline" size="sm" onClick={onFeedback} className="text-gray-700">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            피드백 보내기
          </Button>
        </div>

        {/* 4. 맨 아래 가운데: 다음 퀴즈 시각 안내(정답 교체 매일 00시 KST, docs/spec/rules.md R-3) + 계속 플레이.
            계속 플레이는 밑줄 친 작은 글자 버튼이고 누르면 닫힘. 하루 한 번 게임이라 "다시 플레이"로 읽히지 않는 문구 (요구사항 2-4).
            로그인 안내는 결과창 안이 아니라 헤더 로그인 강조로 (요구사항 2-5, 8) */}
        <div className="-mb-1 flex flex-col items-center gap-1">
          <p className="text-xs text-gray-400">새로운 퀴즈는 매일 밤 12시에 열려요</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs sm:text-sm text-gray-500 underline underline-offset-4 decoration-gray-300 hover:text-gray-700"
          >
            그때까지 순위권 단어 찾아보기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ResultStripProps {
  givenUp: boolean;
  attempts: number;
  onReopen: () => void;
}

/** 날짜·정답 제목과 입력창 사이 완료 표시: 배경 없는 한 줄 "요약 · 결과창 보기 ›". 줄 전체가 버튼 (요구사항 4, 7) */
export function ResultStrip({ givenUp, attempts, onReopen }: ResultStripProps) {
  return (
    <button
      type="button"
      onClick={onReopen}
      className="group mx-auto mb-3 flex w-fit items-center gap-1.5 text-sm sm:text-base"
    >
      <span className="text-gray-700">
        {givenUp ? `${attempts}번 시도 후 포기했어요` : `${attempts}번째 시도에 정답을 맞혔어요`}
      </span>
      <span aria-hidden="true" className="text-gray-300">·</span>
      <span className="flex items-center text-gray-500 group-hover:text-gray-700">
        결과창 보기
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

/** 설정 메뉴 "피드백 남기기"와 같은 창 (요구사항 3) */
export function FeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:rounded-xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={20} />
            피드백
          </DialogTitle>
        </DialogHeader>
        <div className="w-full p-2">
          <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100">
            <SurveyForm entry="result" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
