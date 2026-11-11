import { useCallback, useEffect, useState } from "react";

// 첫 방문 안내 모달을 본 적 있는지 (docs/tasks/rule/plan.md M-1)
export const RULE_MODAL_SEEN_KEY = "newmantle_rule_modal_seen";

type ModalState = "unknown" | "open" | "closed";

/**
 * 첫 방문 안내 모달 상태.
 * 마운트 전(localStorage를 읽기 전)은 "unknown". 이때도 모달이 열릴 수 있으므로
 * 로그인 말풍선은 "closed"가 된 뒤에만 보여준다 (M-6).
 */
export function useRuleIntroModal() {
  const [state, setState] = useState<ModalState>("unknown");

  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(RULE_MODAL_SEEN_KEY);
    } catch {
      // 저장소를 쓸 수 없으면 매번 보여준다
    }
    setState(seen ? "closed" : "open");
  }, []);

  const close = useCallback(() => {
    try {
      localStorage.setItem(RULE_MODAL_SEEN_KEY, "1");
    } catch {
      // 저장 실패 시 이번 방문에서만 닫는다
    }
    setState("closed");
  }, []);

  return { open: state === "open", closed: state === "closed", close };
}
