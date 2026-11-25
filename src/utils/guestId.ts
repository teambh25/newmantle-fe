// 문의 대응용 게스트 id 저장 (docs/rules/amplitude.md 3장)
export const GUEST_ID_KEY = "newmantle_guest_id";

/** 저장된 게스트 id를 읽고, 없으면 새로 만들어 저장한다. created는 이번에 새로 만들었는지 */
export function ensureGuestId(): { guestId: string; created: boolean } {
  const stored = localStorage.getItem(GUEST_ID_KEY);
  if (stored) return { guestId: stored, created: false };
  const guestId = crypto.randomUUID();
  localStorage.setItem(GUEST_ID_KEY, guestId);
  return { guestId, created: true };
}
