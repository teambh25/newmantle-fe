// 화면 레벨: excel 테마 메인 화면 (docs/specs/excel-ui)
// 문구는 검증하지 않는다. 요소는 역할과 접근 가능한 이름으로 찾는다.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { notifications } from "@/static/notifications";
import { ANSWER, gameServer } from "@/test/fakeGameServer";
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
// 피드백 행을 펼치기 전에는 입력창이 게임 입력창 하나뿐
const gameInput = () => screen.getByRole("textbox");

async function renderExcelHome() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const view = render(<Home />);
  await waitFor(() => expect(gameInput()).toBeEnabled());
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

describe("게임 결과와 피드백 행", () => {
  it("정답 제출 → 창 없이 시트에 공유·피드백 링크가 보이고, 의견 보내기로 피드백 칸이 펼쳐지며 포커스가 가고 다시 누르면 접힘", async () => {
    const { user } = await renderExcelHome();
    await user.type(gameInput(), `${ANSWER.word}{Enter}`);

    const feedbackButton = await screen.findByRole("button", { name: /의견 보내기/ });
    expect(screen.getByRole("button", { name: /링크 복사/ })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(feedbackButton);
    // 펼쳐진 피드백 칸에 바로 쓸 수 있게 포커스가 간다
    expect(screen.getByRole("textbox", { name: "피드백 내용" })).toHaveFocus();
    await user.click(feedbackButton);
    expect(screen.queryByRole("textbox", { name: "피드백 내용" })).not.toBeInTheDocument();
  });
});

describe("결과·그래프 전환", () => {
  const chart = () => screen.queryByRole("img", { name: "순위 그래프" });
  const shareButton = () => screen.queryByRole("button", { name: /링크 복사/ });

  it("진행 중에는 그래프가 보이고 전환 탭은 없음", async () => {
    await renderExcelHome();
    expect(chart()).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("정답 후 결과가 먼저 보이고, 그래프 탭으로 바꾸면 그래프만, 결과 탭으로 돌아오면 결과. 그래프로 바꾸면 피드백 칸은 접힘", async () => {
    const { user } = await renderExcelHome();
    await user.type(gameInput(), `${ANSWER.word}{Enter}`);

    expect(await screen.findByRole("tab", { name: "결과" })).toHaveAttribute("aria-selected", "true");
    expect(shareButton()).toBeInTheDocument();
    expect(chart()).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /의견 보내기/ }));
    await user.click(screen.getByRole("tab", { name: "그래프" }));
    expect(chart()).toBeInTheDocument();
    expect(shareButton()).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "피드백 내용" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "결과" }));
    expect(shareButton()).toBeInTheDocument();
    expect(chart()).not.toBeInTheDocument();
  });
});

describe("포기 확인 창", () => {
  it("취소하면 창이 닫히고 포기 요청 없음, 다시 열어 포기하기를 누르면 포기 요청", async () => {
    const { user } = await renderExcelHome();
    await user.click(screen.getByRole("button", { name: "포기" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(gameServer.count("give-up")).toBe(0);

    await user.click(screen.getByRole("button", { name: "포기" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /포기/ }));
    await waitFor(() => expect(gameServer.count("give-up")).toBe(1));
  });
});

describe("수식 입력줄", () => {
  it("단어를 입력하다 취소(✕)를 누르면 입력이 비워지고 요청은 없음", async () => {
    const { user } = await renderExcelHome();
    await user.type(gameInput(), "사과");
    await user.click(screen.getByRole("button", { name: "입력 취소" }));
    expect(gameInput()).toHaveValue("");
    expect(gameServer.count("guess")).toBe(0);
  });
});

describe("실패 안내", () => {
  it("힌트 요청 실패 → 화면 안에 실패 알림", async () => {
    const { user } = await renderExcelHome();
    gameServer.failNext("hint");
    await user.click(screen.getByRole("button", { name: "힌트" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
