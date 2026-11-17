"use client";
// 대결형 공유: 친구 공유 링크로 들어왔을 때 읽기, 내 공유 링크 만들어 보내기 (docs/todo/share.md A)
// classic·excel이 같이 쓴다 (specs/excel-ui Dec-2)
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { logEvent } from "@/utils/amplitude";
import { fetchSharerStats } from "@/utils/api";
import { createClient } from "@/utils/supabase/client";

interface ShareLinkOptions {
  gameDate: string;
  /** 공유 링크에 담을 내 시도 횟수 */
  attempts: number;
  /** Amplitude 이벤트의 theme */
  theme: "classic" | "excel";
}

export function useShareLink({ gameDate, attempts, theme }: ShareLinkOptions) {
  const [sharedAttempts, setSharedAttempts] = useState<number | null>(null);
  const [sharerHintCount, setSharerHintCount] = useState<number | null>(null);
  const [isLoadingSharerStats, setIsLoadingSharerStats] = useState(false);
  const { toast } = useToast();

  // 게임 날짜가 정해진 뒤 URL 쿼리를 한 번 읽는다
  useEffect(() => {
    if (typeof window === "undefined" || !gameDate) return;
    const params = new URLSearchParams(window.location.search);
    const sharedDate = params.get("game_date");

    // 공유된 링크의 날짜가 현재 게임 날짜와 다르면 무시
    if (sharedDate && sharedDate !== gameDate) return;

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
  }, [gameDate]);

  /** 내 공유 링크를 네이티브 공유 시트로, 안 되면 클립보드로 */
  const share = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    let sharerId: string | null = null;
    let sharerType: "guest" | "user" = "guest";
    if (session?.user?.id) {
      sharerId = session.user.id;
      sharerType = "user";
    } else {
      sharerId = localStorage.getItem("newmantle_guest_id");
    }

    const utmParams = new URLSearchParams({
      utm_source: "newmantle",
      utm_medium: "share",
      utm_campaign: "game_completion",
      shared_attempts: attempts.toString(),
      game_date: gameDate,
      ...(sharerId ? { sharer_type: sharerType, sharer_id: sharerId } : {}),
    });
    const link = `${window.location.origin}?${utmParams.toString()}`;

    if (navigator.share) {
      try {
        await navigator.share({ url: link });
        logEvent("Result Shared", { method: "Native Share", attempts, theme });
        return; // 네이티브 공유는 토스트 없음
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // 사용자가 취소
        // 그 밖의 실패는 클립보드로
      }
    }

    navigator.clipboard.writeText(link).then(
      () => {
        toast({
          title: "링크가 복사되었습니다!",
          description: "친구들에게 공유해보세요.",
        });
        logEvent("Result Shared", { method: "Link Copy", attempts, theme });
      },
      () => {
        toast({ title: "링크 복사 실패", variant: "destructive" });
        logEvent("Share Error", {
          method: "Link Copy",
          errorType: "Clipboard Write Failed",
          theme,
        });
      }
    );
  };

  return { sharedAttempts, sharerHintCount, isLoadingSharerStats, share };
}
