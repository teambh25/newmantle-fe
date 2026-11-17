// 화면 레벨: 단어 제출, 없는 단어 임시 줄, 이미 낸 단어, 요청 실패 알림
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 화면은 실제 컴포넌트를 렌더링한다. 도구는 src/test/formHarness.tsx
import { describe, expect, it } from "vitest";
import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import NewMantleForm from "./index";
import userEvent from "@testing-library/user-event";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { gameServer } from "@/test/fakeGameServer";
import {
  type User,
  setup,
  hintButton,
  input,
  submitButton,
  submitWord,
  latestCard,
  historyTable,
  rowsOf,
  latestItems,
  bodyRows,
  firstRowText,
  rowsWith,
  storedWords,
} from "@/test/formHarness";

describe("엔터 제출", () => {
  it("단어 입력 후 엔터 → 추측 요청 1회", async () => {
    const { user } = await setup();
    await user.type(input(), "엔터단어{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(1));
  });

});

// 없는 단어 안내
describe("없는 단어", () => {
  it("없는 단어 제출 → 입력창 오류 상태·알림 없음 (안내는 카드 배너)", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("없는 단어 제출 → 입력창 비움, 알림에 단어, 표 첫 줄에 임시 줄, 저장 안 됨", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    expect(input()).toHaveValue("");
    expect(firstRowText()).toContain("없는말");
    expect(storedWords()).not.toContain("없는말");
  });

  it("임시 줄은 입력창에 글자를 쳐도 남음", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.type(input(), "가");
    expect(firstRowText()).toContain("없는말");
  });

  it("임시 줄 뒤 있는 단어 제출 → 임시 줄 사라지고 첫 줄은 새 단어", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await submitWord(user, "사과", 500);
    await waitFor(() => expect(rowsWith("없는말")).toHaveLength(0));
    expect(firstRowText()).toContain("사과");
  });

  it("같은 없는 단어를 다시 제출 → 줄은 하나, 요청은 두 번", async () => {
    const { user } = await setup();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await submitWord(user, "없는말");
    expect(gameServer.count("guess")).toBe(2);
    expect(rowsWith("없는말")).toHaveLength(1);
  });

  it("없는 단어 뒤 다른 없는 단어 제출 중 → 방금 입력 칸·기록이 그대로, 응답 뒤 새 없는 단어", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    gameServer.setUnknown("없는말둘");
    await submitWord(user, "없는말");
    const held = gameServer.holdNext("guess");
    await user.type(input(), "없는말둘");
    await user.click(submitButton());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(latestItems()[0].textContent).toContain("없는말");
    expect(rowsOf(historyTable()).map((r) => r.textContent)).toEqual([
      expect.stringContaining("사과"),
      expect.stringContaining("바나나"),
    ]);
    await held.release();
    await waitFor(() => expect(latestItems()[0].textContent).toContain("없는말둘"));
    expect(rowsOf(historyTable())).toHaveLength(2);
  });

  it("없는 단어 뒤 직전 단어를 다시 제출 → 임시 줄 사라지고 첫 줄은 그 단어(반복 아이콘)", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 100);
    await submitWord(user, "바나나", 500);
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await user.type(input(), "바나나");
    await user.click(submitButton());
    await waitFor(() => expect(rowsWith("없는말")).toHaveLength(0));
    expect(firstRowText()).toContain("바나나");
    expect(within(bodyRows()[0]).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument();
  });

});

// 이미 제출한 단어 (docs/tasks/ui/input/plan.md 3)
describe("이미 제출한 단어", () => {
  async function resubmit(user: User, word: string) {
    await user.type(input(), word);
    await user.click(submitButton());
    await waitFor(() => expect(input()).toHaveValue(""));
  }

  it("이미 낸 단어를 다시 → 첫 줄이 그 단어이고 반복 아이콘", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 10);
    await submitWord(user, "바나나", 500);
    await resubmit(user, "사과");
    await waitFor(() => expect(firstRowText()).toContain("사과"));
    expect(within(bodyRows()[0]).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument();
  });

});

// 요청 실패 안내 (안내 자리는 docs/tasks/ui/progress-card/plan.md 3)
describe("요청 실패는 카드 배너 알림", () => {
  /** 토스트가 뜨는지도 보기 위해 Toaster를 같이 렌더링한다 */
  async function setupWithToaster() {
    // 토스트 상태는 모듈 전역이라 앞 테스트(링크 복사 등)의 토스트를 닫아 둔다
    const toasts = renderHook(() => useToast());
    act(() => toasts.result.current.dismiss());
    toasts.unmount();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <>
        <NewMantleForm />
        <Toaster />
      </>
    );
    await waitFor(() => expect(input()).toBeEnabled());
    return { user };
  }
  /** 알림은 카드(배너) 안에만 있고 입력창 아래 등 카드 밖에는 없음 (progress-card/plan.md 3) */
  async function alertInCardOnly() {
    await waitFor(() => expect(within(latestCard()!).getByRole("alert")).toBeInTheDocument());
    expect(screen.getAllByRole("alert").every((el) => latestCard()!.contains(el))).toBe(true);
  }
  /** 토스트(status). 카드 말풍선도 status라 카드 밖만 센다 */
  const toastShown = () => screen.queryAllByRole("status").some((el) => !latestCard()?.contains(el));

  async function failHint(user: User) {
    gameServer.failNext("hint");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(hintButton()).toBeEnabled());
  }

  it("서버 오류로 제출 실패 → 단어가 남고 오류 상태 아님, 카드 안 알림, 토스트 없음, 저장 안 됨", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    expect(input()).toHaveValue("사과");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
    expect(storedWords()).not.toContain("사과");
  });

  it("제출 실패 뒤 엔터만 다시 → 같은 단어로 재요청, 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    await user.type(input(), "{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(2));
    expect(gameServer.requests.filter((r) => r.kind === "guess").map((r) => r.word)).toEqual(["사과", "사과"]);
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    await waitFor(() => expect(storedWords()).toContain("사과"));
    // 기록 표에 결과 줄 하나 (배너에도 같은 단어)
    expect(rowsOf(historyTable()).filter((r) => r.textContent?.includes("사과"))).toHaveLength(1);
  });

  it("힌트 실패 → 카드 안 알림, 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
  });

  it("힌트 실패 뒤 힌트 다시 (성공) → 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await screen.findByRole("alert");
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(2));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("힌트 실패 뒤 입력창에 글자 입력 → 안내 사라짐", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await screen.findByRole("alert");
    await user.type(input(), "가");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("연속 두 번 실패 → 두 번째에 토스트", async () => {
    const { user } = await setupWithToaster();
    gameServer.failNext("guess");
    await submitWord(user, "사과");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
    gameServer.failNext("guess");
    await user.type(input(), "{Enter}");
    await waitFor(() => expect(gameServer.count("guess")).toBe(2));
    await waitFor(() => expect(toastShown()).toBe(true));
  });

  it("실패 사이에 성공이 있으면 토스트 없음", async () => {
    const { user } = await setupWithToaster();
    await failHint(user);
    await submitWord(user, "사과", 500);
    gameServer.failNext("guess");
    await submitWord(user, "바나나");
    await alertInCardOnly();
    expect(toastShown()).toBe(false);
  });

  it("없는 단어 안내 중 힌트 실패 → 안내는 하나, 입력창은 오류 상태 아님", async () => {
    const { user } = await setupWithToaster();
    gameServer.setUnknown("없는말");
    await submitWord(user, "없는말");
    await failHint(user);
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(1));
    expect(screen.getByRole("alert")).not.toHaveTextContent("없는말");
    expect(input()).not.toHaveAttribute("aria-invalid", "true");
  });
});
