// 로직 레벨: 최신 공지 안 읽음 판단 (docs/tasks/ui/notices/plan.md 3)
import { describe, expect, it } from "vitest";
import type { Notification } from "@/static/notifications";
import { isLatestUnread } from "./notifications";

const notice = (id: string, date: string): Notification => ({
  id,
  date,
  title: `공지 ${id}`,
  content: "",
  type: "update",
});

// 최신 공지: id "3", 2026-11-10
const LIST = [notice("1", "2026-09-01"), notice("3", "2026-11-10"), notice("2", "2026-10-01")];
const NOW = new Date("2026-11-20T03:00:00Z");

describe("최신 공지 안 읽음 판단", () => {
  it("저장된 id가 최신보다 작으면 안 읽음, 같으면 읽음", () => {
    expect(isLatestUnread(LIST, { lastSeenId: "2", legacyCheck: null, now: NOW })).toBe(true);
    expect(isLatestUnread(LIST, { lastSeenId: "3", legacyCheck: null, now: NOW })).toBe(false);
  });

  it("id는 숫자로 비교 (\"9\" 저장, 최신 \"10\" → 안 읽음)", () => {
    const list = [notice("9", "2026-11-01"), notice("10", "2026-11-10")];
    expect(isLatestUnread(list, { lastSeenId: "9", legacyCheck: null, now: NOW })).toBe(true);
  });

  it("새 키가 없으면 기존 확인 시각 기준 (최신 공지 날짜 이후 확인 → 읽음, 이전 → 안 읽음)", () => {
    expect(
      isLatestUnread(LIST, { lastSeenId: null, legacyCheck: "2026-11-10T03:00:00.000Z", now: NOW })
    ).toBe(false);
    expect(
      isLatestUnread(LIST, { lastSeenId: null, legacyCheck: "2026-11-09T20:00:00.000Z", now: NOW })
    ).toBe(true);
  });

  it("저장값이 없으면 최신 공지가 KST 3일 이내일 때만 안 읽음", () => {
    // KST 11/12 10:00 (최신 공지 + 2일)
    expect(
      isLatestUnread(LIST, { lastSeenId: null, legacyCheck: null, now: new Date("2026-11-12T01:00:00Z") })
    ).toBe(true);
    // KST 11/14 10:00 (최신 공지 + 4일)
    expect(
      isLatestUnread(LIST, { lastSeenId: null, legacyCheck: null, now: new Date("2026-11-14T01:00:00Z") })
    ).toBe(false);
  });
});
