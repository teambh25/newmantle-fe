// 화면 레벨: excel 테마 메인 화면 (specs/excel-ui)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { notifications } from "@/static/notifications";
import { getLatestNotification } from "@/utils/notifications";

// 로그인 여부를 케이스마다 바꾼다 (기본: 비로그인)
const auth = vi.hoisted(() => ({ user: null as null | { id: string; email: string } }));

// 메인 화면은 헤더 로그인 버튼·설정 메뉴(getUser, profiles 조회, signOut)와 닉네임 설정 창(getSession)이 Supabase를 쓴다
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: auth.user } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({
        data: { session: auth.user ? { access_token: "test-token", user: auth.user } : null },
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    // 로그인 유저는 닉네임이 있어 닉네임 설정 창이 열리지 않는다
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { nickname: NICKNAME } }) }),
      }),
    }),
  }),
}));

const NICKNAME = "tester";
const LAST_SEEN_KEY = "newmantle_last_seen_notification_id";
const LEGACY_CHECK_KEY = "newmantle_last_notification_check";

beforeEach(() => {
  auth.user = null;
  localStorage.setItem("newmantle-ui-theme", "excel");
});

/** excel 메인을 렌더링하고, 게임 입력창과 헤더 계정 영역이 준비될 때까지 기다린다 */
async function renderExcelHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
  await waitFor(() =>
    expect(
      screen.queryAllByRole("link", { name: "로그인" }).length +
        screen.queryAllByText(new RegExp(NICKNAME)).length
    ).toBeGreaterThan(0)
  );
  return { user, ...view };
}

describe("첫 방문 안내 모달", () => {
  it("첫 방문이어도 excel에서는 모달이 열리지 않음", async () => {
    await renderExcelHome();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("로그아웃 위치", () => {
  it("로그인하면 설정 메뉴에 로그아웃이 있음", async () => {
    auth.user = { id: "user-1", email: "tester@example.com" };
    const { user } = await renderExcelHome();
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "설정" }));
    expect(await screen.findByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});

describe("새 공지 알림 / 공지 읽음", () => {
  const latestId = getLatestNotification(notifications)!.id;
  const olderId = String(Number(latestId) - 1);
  // 설정 메뉴의 공지사항 링크는 메뉴를 열어야 보이므로, 닫힌 화면의 /notices 링크는 상태 표시줄 알림뿐이다
  const noticeLinks = () =>
    screen.queryAllByRole("link").filter((a) => a.getAttribute("href") === "/notices");

  it("안 읽은 최신 공지가 있으면 /notices로 가는 알림이 보임", async () => {
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    await renderExcelHome();
    expect(noticeLinks()).toHaveLength(1);
  });

  it("최신 공지를 읽었으면 알림이 없음", async () => {
    localStorage.setItem(LAST_SEEN_KEY, latestId);
    await renderExcelHome();
    expect(noticeLinks()).toHaveLength(0);
  });

  it("메인에 들어오기만 해서는 읽음 저장값(새 키·기존 키)이 바뀌지 않음", async () => {
    const legacy = "2026-01-01T00:00:00.000Z";
    localStorage.setItem(LAST_SEEN_KEY, olderId);
    localStorage.setItem(LEGACY_CHECK_KEY, legacy);
    await renderExcelHome();
    await new Promise((r) => setTimeout(r, 200));
    expect(localStorage.getItem(LAST_SEEN_KEY)).toBe(olderId);
    expect(localStorage.getItem(LEGACY_CHECK_KEY)).toBe(legacy);
  });
});
