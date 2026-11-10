// 날짜 유틸: 기기 타임존과 무관하게 KST 달력 날짜를 다루는지 (docs/tasks/kst-date-fix/verification.md)
import { describe, expect, it } from "vitest";
import { format, subDays } from "date-fns";
import { KST_AFTERNOON, setClock } from "@/test/clock";
import { getKSTDateString, getKSTToday, toLegacyDateString } from "@/utils/date";

describe.each(["Asia/Seoul", "America/Los_Angeles"])("기기 타임존 %s, KST 11/10 14:00", (tz) => {
  it("D-1: getKSTDateString → KST 오늘", () => {
    setClock(tz, KST_AFTERNOON);
    expect(getKSTDateString()).toBe("2026-11-10");
  });

  it("D-2: toLegacyDateString → 같은 달력 날짜의 이전 형식", () => {
    setClock(tz, KST_AFTERNOON);
    expect(toLegacyDateString("2026-11-10")).toBe("Tue Nov 10 2026");
  });

  it("D-3: getKSTToday를 로컬 기준으로 포맷·계산해도 KST 달력 날짜 (통계 조회 범위)", () => {
    setClock(tz, KST_AFTERNOON);
    const today = getKSTToday();
    expect(format(today, "yyyy-MM-dd")).toBe("2026-11-10");
    expect(format(subDays(today, 90), "yyyy-MM-dd")).toBe("2026-08-12");
  });
});
