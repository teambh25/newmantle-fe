// 로직: 게스트 id 최초 생성 여부 (docs/rules/amplitude.md 3장). 저장소는 jsdom의 실제 localStorage를 쓴다
import { describe, expect, it } from "vitest";
import { ensureGuestId, GUEST_ID_KEY } from "./guestId";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("게스트 id 최초 생성", () => {
  it("저장된 게스트 id가 없으면 → 새 id를 만들어 저장하고 created true", () => {
    const { guestId, created } = ensureGuestId();

    expect(created).toBe(true);
    expect(guestId).toMatch(UUID);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(guestId);
  });

  it("저장된 게스트 id가 있으면 → 그 값을 그대로 쓰고 created false", () => {
    localStorage.setItem(GUEST_ID_KEY, "11111111-2222-4333-8444-555555555555");

    expect(ensureGuestId()).toEqual({ guestId: "11111111-2222-4333-8444-555555555555", created: false });
  });
});
