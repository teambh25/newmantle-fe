// 로직 레벨: 개발용 실패 주입 (docs/tasks/ui/dev-page/plan.md 3)
import { describe, expect, it } from "vitest";
import { takeFault } from "./faults";

const BASE = "https://api.example.com/v2/quizzes/2026-11-13";

describe("개발용 실패 주입", () => {
  it("대기 중인 종류의 요청만 실패시키고, 쓰고 나면 그 종류는 꺼짐", () => {
    const pending = ["guess", "hint", "consonant", "giveUp"] as const;
    expect(takeFault(`${BASE}/guess/%EC%82%AC%EA%B3%BC`, [...pending])).toEqual(["hint", "consonant", "giveUp"]);
    expect(takeFault(`${BASE}/hint/999`, [...pending])).toEqual(["guess", "consonant", "giveUp"]);
    expect(takeFault(`${BASE}/hint/0`, [...pending])).toEqual(["guess", "hint", "giveUp"]);
    expect(takeFault(`${BASE}/give-up`, [...pending])).toEqual(["guess", "hint", "consonant"]);
  });

  it("대기 중이 아닌 종류와 게임이 아닌 요청은 그대로 통과", () => {
    expect(takeFault(`${BASE}/hint/999`, ["guess"])).toBeNull();
    expect(takeFault("https://api.example.com/v2/stats/me", ["guess"])).toBeNull();
    expect(takeFault("https://example.supabase.co/auth/v1/user", ["guess"])).toBeNull();
  });

  it("같은 종류가 여러 번 대기 중이면 한 번에 하나씩만 꺼짐 (연속 실패)", () => {
    const once = takeFault(`${BASE}/guess/a`, ["guess", "guess"]);
    expect(once).toEqual(["guess"]);
    expect(takeFault(`${BASE}/guess/b`, once!)).toEqual([]);
  });
});
