// 로직 레벨: 조사 고르기 (docs/tasks/ui/verification.md K)
import { describe, expect, it } from "vitest";
import { shortenWord, topicParticle } from "./korean";

describe("주제 조사 은/는", () => {
  it("K-1: 받침 있는 글자로 끝나면 은", () => {
    expect(topicParticle("사과즙")).toBe("은");
    expect(topicParticle("밥")).toBe("은");
  });

  it("K-2: 받침 없는 글자로 끝나면 는", () => {
    expect(topicParticle("사과")).toBe("는");
    expect(topicParticle("나무")).toBe("는");
  });

  it("K-3: 한글이 아닌 글자로 끝나면 은(는)", () => {
    expect(topicParticle("abc")).toBe("은(는)");
    expect(topicParticle("123")).toBe("은(는)");
  });
});

describe("안내 문구에 넣을 단어 줄이기", () => {
  it("K-4: 6글자 이하는 그대로, 넘으면 앞 5글자 + …", () => {
    expect(shortenWord("사랑")).toBe("사랑");
    expect(shortenWord("가나다라마바")).toBe("가나다라마바");
    expect(shortenWord("가나다라마바사")).toBe("가나다라마…");
  });
});
