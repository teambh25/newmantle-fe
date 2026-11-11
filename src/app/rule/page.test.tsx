// 화면 레벨: 규칙 페이지 (docs/tasks/rule/verification.md P)
// 규칙 문구는 수동으로 확인한다 (V-1). 여기서는 페이지 구성만 본다.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RulePage from "./page";

describe("규칙 페이지", () => {
  it("P-1-1: 페이지 제목(heading level 1)이 있음", () => {
    render(<RulePage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("P-1-2: 메인으로 돌아가는 링크가 있음", () => {
    render(<RulePage />);
    const homeLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === "/");
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("P-1-3: 원작(꼬맨틀) 외부 링크가 있음", () => {
    render(<RulePage />);
    const link = screen.getByRole("link", { name: /꼬맨틀/ });
    expect(link.getAttribute("href")).toMatch(/^https:\/\//);
  });
});
