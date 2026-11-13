"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import WordTable, { VISIBLE_WORD_COUNT } from "./WordTable";
import { GameForm } from "./GameForm";
import { GameResult } from "./GameResult";
import { compareByRank, useGameState, type GameRequestKind } from "@/hooks/useGameState";
import { logEvent } from "@/utils/amplitude";
import { useGameDate } from "@/hooks/useGameDate";
import { formatGameDate } from "@/utils/date";
import HintButton from "../HintButton";
import GiveUpButton from "../GiveUpButton";
import CompetitiveBar from "@/components/CompetitiveBar";
import { fetchSharerStats } from "@/utils/api";
import { createClient } from "@/utils/supabase/client";
import { shortenWord, topicParticle } from "@/utils/korean";

/** 요청 실패 안내. 원인은 적지 않고 어떤 기능이 실패했는지만 적는다 (docs/tasks/ui/plan.md 11장) */
const REQUEST_ERROR_MESSAGES: Record<GameRequestKind | "submit", string> = {
  submit: "단어 제출에 실패했어요. 잠시 후 다시 시도해 주세요.",
  hint: "힌트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  consonantHint: "초성을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
  giveUp: "포기 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

/** 단어 목록 맨 위 임시 줄 안내 (docs/tasks/ui/plan.md 12장) */
const SUBMIT_NOTICE_LABELS = { unknown: "없는 단어", failed: "오류" } as const;

interface NewMantleFormProps {
  /** 첫 입력 유도 말풍선 (docs/tasks/ui/plan.md 7장). 순서는 메인이 정한다 */
  showInputTooltip?: boolean;
  onInputTooltipDone?: () => void;
}

export default function NewMantleForm({ showInputTooltip = false, onInputTooltipDone }: NewMantleFormProps = {}) {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [sharedAttempts, setSharedAttempts] = useState<number | null>(null);
  const [sharerHintCount, setSharerHintCount] = useState<number | null>(null);
  const [isLoadingSharerStats, setIsLoadingSharerStats] = useState(false);
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  // 없는 단어·제출 실패를 목록 맨 위에 잠깐 보여 준다. 저장하지 않는다 (docs/tasks/ui/plan.md 12장)
  const [submitNotice, setSubmitNotice] = useState<{ word: string; tone: "unknown" | "failed" } | null>(null);
  // 방금 다시 낸 이미 제출한 단어. 맨 위 줄이 이 단어일 때만 반복 아이콘 (docs/tasks/ui/plan.md 12장)
  const [repeatedWord, setRepeatedWord] = useState<string | null>(null);
  const { toast } = useToast();
  // 힌트·초성 힌트·포기 실패 안내. 토스트 대신 입력창 아래에 띄운다 (docs/tasks/ui/plan.md 11장)
  const [requestError, setRequestError] = useState<string | null>(null);
  const gameLogic = useGameState(gameDate, "classic", {
    onRequestError: (kind) => setRequestError(REQUEST_ERROR_MESSAGES[kind]),
  });
  // 새 요청을 시작하면 이전 실패 안내를 닫는다
  const startRequest = (request: () => void) => () => {
    setRequestError(null);
    request();
  };

  useEffect(() => {
    // Read shared_attempts from URL search params on mount
    if (typeof window !== "undefined" && gameDate) {
      const params = new URLSearchParams(window.location.search);
      const sharedDate = params.get("game_date");
      
      // 공유된 링크의 날짜가 현재 게임 날짜와 다르면 무시
      if (sharedDate && sharedDate !== gameDate) {
        return;
      }

      const shared = params.get("shared_attempts");
      if (shared && !isNaN(parseInt(shared))) {
        setSharedAttempts(parseInt(shared));
      }

      const sharerType = params.get("sharer_type") as "guest" | "user" | null;
      const sharerId = params.get("sharer_id");
      const fetchDate = sharedDate ?? gameDate;
      if (sharerType && sharerId && fetchDate) {
        setIsLoadingSharerStats(true);
        fetchSharerStats(sharerType, sharerId, fetchDate)
          .then((stats) => setSharerHintCount(stats.hint_count))
          .catch(() => {})
          .finally(() => setIsLoadingSharerStats(false));
      }

      // 파라미터를 읽은 후 URL을 클린하게 정리
      if (params.has("shared_attempts") || params.has("sharer_id")) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [gameDate]);

  useEffect(() => {
    if (gameDate) {
      setDisplayDate(formatGameDate(gameDate));
    }
  }, [gameDate]);

  // 초성 힌트는 표에서 빼고 입력창 위 날짜 제목에 둔다. 게임이 끝나면 초성 대신 정답 (docs/tasks/ui/word-list.md 3-4)
  const isConsonant = (w: { attempt: number; rank: number }) => w.attempt === -1 && w.rank === 0;
  const gameOver = gameLogic.gameCompleted || gameLogic.givenUp;
  const answerWord = gameLogic.sortedWords.find((w) => w.correct)?.word;
  const consonantWord = gameLogic.sortedWords.find(isConsonant)?.word;
  const reveal = (gameOver ? answerWord : consonantWord) ?? null;
  // 초성·정답은 제목에 보이므로 표에서 뺀다
  const inHeading = (w: { attempt: number; rank: number; correct: boolean }) => isConsonant(w) || w.correct;
  const listedWords = gameLogic.sortedWords.filter((w) => !inHeading(w));
  // 임시 줄(없는 단어·제출 실패)이 있으면 그게 방금 입력 줄. 직전 단어는 순위 자리로 내린다 (docs/tasks/ui/plan.md 12장)
  const tableWords = submitNotice ? [...listedWords].sort(compareByRank) : listedWords;
  // 맨 위 고정 줄은 가장 최근 항목. 그게 초성·정답이었으면 표에 고정 줄이 없다
  const hasLatestRow =
    !submitNotice && tableWords.length > 1 && !(gameLogic.sortedWords[0] && inHeading(gameLogic.sortedWords[0]));

  // 목록 맨 위에 다른 줄이 올라오면(제출 결과, 이미 낸 단어, 힌트·초성·포기) 임시 줄을 내린다. 입력창에 글자를 칠 때는 남긴다
  const topWord = gameLogic.sortedWords[0];
  const topKey = topWord ? `${topWord.attempt}:${topWord.word}` : "";
  useEffect(() => {
    setSubmitNotice(null);
  }, [topKey]);

  const handleCopyLink = async () => {
    const baseUrl = window.location.origin;

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    let sharerId: string | null = null;
    let sharerType: "guest" | "user" = "guest";
    if (session?.user?.id) {
      sharerId = session.user.id;
      sharerType = "user";
    } else {
      sharerId = localStorage.getItem('newmantle_guest_id');
    }

    const utmParams = new URLSearchParams({
      utm_source: "newmantle",
      utm_medium: "share",
      utm_campaign: "game_completion",
      shared_attempts: gameLogic.correctAttempts.toString(),
      game_date: gameDate,
      ...(sharerId ? { sharer_type: sharerType, sharer_id: sharerId } : {}),
    });
    const link = `${baseUrl}?${utmParams.toString()}`;

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          url: link,
        });
        logEvent("Result Shared", {
          method: "Native Share",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
        return; // Success! No toast needed for native share.
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled the share, do nothing
          return;
        }
        // Fallback to clipboard if share failed
      }
    }

    navigator.clipboard.writeText(link).then(
      () => {
        toast({
          title: "링크가 복사되었습니다!",
          description: "친구들에게 공유해보세요.",
        });
        logEvent("Result Shared", {
          method: "Link Copy",
          attempts: gameLogic.correctAttempts,
          theme: "classic",
        });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
          theme: "classic",
        });
      }
    );
  };

  return (
    // PC는 게임 영역(결과 상자·단어 목록)을 480px로 가운데에, 입력창은 그보다 조금 좁은 420px. 모바일은 화면 폭 그대로 (docs/tasks/ui/plan.md 4장)
    <div className="w-full max-w-2xl sm:max-w-[480px] sm:mx-auto">
      <div className="flex flex-col items-center mx-0">
        <GameResult
          givenUp={gameLogic.givenUp}
          gameCompleted={gameLogic.gameCompleted}
          solvedAttempts={gameLogic.solvedAttempts}
          correctAttempts={gameLogic.correctAttempts}
          onShare={handleCopyLink}
        />

        {sharedAttempts !== null && (
          <CompetitiveBar
            currentAttempts={gameLogic.solvedAttempts ?? gameLogic.correctAttempts}
            sharedAttempts={sharedAttempts}
            sharedHintCount={sharerHintCount}
            isLoadingSharerStats={isLoadingSharerStats}
            theme="classic"
            gameCompleted={gameLogic.gameCompleted || gameLogic.givenUp}
          />
        )}

        <GameForm
          submitAction={async (word) => {
            setRequestError(null);
            setSubmitNotice(null);
            setRepeatedWord(null);
            let isDone = false;
            const timer = setTimeout(() => {
              if (!isDone) setPendingWord(word);
            }, 300);
            const res = await gameLogic.submitWordAction(word);
            isDone = true;
            clearTimeout(timer);
            setPendingWord(null);
            // 없는 단어·제출 실패는 목록 맨 위 임시 줄로. 입력창은 없는 단어면 비우고 placeholder 안내, 실패면 단어를 남기고 빨간 배경 (docs/tasks/ui/plan.md 12장)
            if (res.reason === "duplicate") setRepeatedWord(word);
            if (res.reason === "unknownWord") {
              setSubmitNotice({ word, tone: "unknown" });
              return { error: `'${shortenWord(word)}'${topicParticle(word)} 없는 단어`, tone: "warning" };
            }
            if (res.reason === "failed") {
              setSubmitNotice({ word, tone: "failed" });
              return { error: REQUEST_ERROR_MESSAGES.submit, tone: "error" };
            }
            return res;
          }}
          gameCompleted={gameLogic.gameCompleted}
          displayDate={displayDate}
          reveal={reveal}
          showInputTooltip={showInputTooltip}
          onInputTooltipDone={onInputTooltipDone}
          requestError={requestError}
          onInputEdit={() => setRequestError(null)}
          hintButton={
            <HintButton
              onHintRequest={startRequest(gameLogic.requestHint)}
              disabled={
                gameLogic.hintDisabled ||
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.hintPending
              }
            />
          }
          giveUpButton={
            <GiveUpButton
              onGiveUp={startRequest(gameLogic.giveUp)}
              disabled={
                gameLogic.gameCompleted ||
                gameLogic.givenUp ||
                gameLogic.giveUpPending
              }
              onInitialConsonantHint={startRequest(gameLogic.requestInitialConsonantHint)}
              initialConsonantHintUsed={gameLogic.initialConsonantHintUsed}
            />
          }
        />

        {/* 표 자리 확보: 단어가 적어도 7줄 + "더보기" 높이만큼 차지해서, 입력할 때마다 아래 내용이 밀리지 않게 (docs/tasks/ui/word-list.md 3-5).
            값 = 표 머리 48px + 줄(모바일 37px / sm 41px) × 7 + 방금 입력 구분선 1px + "더보기" 56px */}
        <div className="w-full min-h-[364px] sm:min-h-[392px]">
          {tableWords.length > 0 || pendingWord || submitNotice ? (
            <>
              <WordTable 
                words={tableWords}
                hasLatestRow={hasLatestRow}
                showAll={showAllWords} 
                pendingWord={pendingWord}
                pendingAttempt={gameLogic.attempts + 1}
                notice={submitNotice && { ...submitNotice, label: SUBMIT_NOTICE_LABELS[submitNotice.tone] }}
                // 맨 위가 다른 줄(힌트 등)로 바뀌면 단어가 달라 아이콘이 자연히 빠진다
                latestIsRepeat={!submitNotice && repeatedWord !== null && tableWords[0]?.word === repeatedWord}
              />
              {tableWords.length > VISIBLE_WORD_COUNT && (
                <div className="text-center mt-4">
                  <Button
                    onClick={() => setShowAllWords(!showAllWords)}
                    variant="outline"
                  >
                    {showAllWords ? "접기" : "더보기"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center">
              아직 제출한 단어가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
