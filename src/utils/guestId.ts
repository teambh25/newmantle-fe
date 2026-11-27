import { setUserProperties } from "@/utils/amplitude";

// 문의 대응용 게스트 id 저장 (docs/rules/amplitude.md 3장)
export const GUEST_ID_KEY = "newmantle_guest_id";

/**
 * 저장된 게스트 id를 읽고, 없으면 새로 만들어 저장한다.
 * 처음 만들 때 Amplitude 사용자 속성 `guest_id`도 여기서 보낸다. 게임 요청·피드백 어디서 만들든 빠지지 않게 한다 (docs/specs/feedback-migration Dec-8)
 */
export function ensureGuestId(): string {
  const stored = localStorage.getItem(GUEST_ID_KEY);
  if (stored) return stored;
  const guestId = crypto.randomUUID();
  localStorage.setItem(GUEST_ID_KEY, guestId);
  setUserProperties({ guest_id: guestId });
  return guestId;
}
