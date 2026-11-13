// 화면 레벨: 공지사항 페이지 (docs/tasks/ui/notices/verification.md NT-9)
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NoticesPage from "./page";
import { notifications } from "@/static/notifications";

const LAST_SEEN_KEY = "newmantle_last_seen_notification_id";

// 날짜 내림차순, 같은 날짜는 id 내림차순
const expected = [...notifications].sort(
  (a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id)
);

describe("공지사항 페이지", () => {
  it("NT-9: 전체 공지가 최신순으로 보이고, 들어오면 최신 공지를 본 것으로 저장", () => {
    render(<NoticesPage />);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(titles).toEqual(expected.map((n) => n.title));
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(expected[0].id);
  });
});
