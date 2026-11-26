// 로직: 게스트 id 최초 생성 여부 (docs/rules/amplitude.md 3장). 저장소는 jsdom의 실제 localStorage를 쓴다
import { describe, expect, it, vi } from "vitest";
import * as amplitude from "@amplitude/analytics-browser";
import { ensureGuestId, GUEST_ID_KEY } from "./guestId";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("게스트 id 최초 생성", () => {
  it("저장된 게스트 id가 없으면 → 새 id를 만들어 저장하고 그 id를 돌려준다", () => {
    const guestId = ensureGuestId();

    expect(guestId).toMatch(UUID);
    expect(localStorage.getItem(GUEST_ID_KEY)).toBe(guestId);
  });

  it("저장된 게스트 id가 있으면 → 그 값을 그대로 돌려준다", () => {
    localStorage.setItem(GUEST_ID_KEY, "11111111-2222-4333-8444-555555555555");

    expect(ensureGuestId()).toBe("11111111-2222-4333-8444-555555555555");
  });

  // 게임 요청·피드백 어디서 만들든 빠지지 않게, 만드는 곳에서 보낸다 (docs/specs/feedback-migration Dec-23)
  it("저장된 게스트 id가 없으면 → 게스트 id를 얻을 때 Amplitude 사용자 속성을 한 번 보낸다", () => {
    ensureGuestId();

    expect(amplitude.identify).toHaveBeenCalledTimes(1);
  });

  it("저장된 게스트 id가 있으면 → 게스트 id를 얻어도 Amplitude 사용자 속성을 보내지 않는다", () => {
    localStorage.setItem(GUEST_ID_KEY, "11111111-2222-4333-8444-555555555555");

    ensureGuestId();

    expect(amplitude.identify).not.toHaveBeenCalled();
  });
});
