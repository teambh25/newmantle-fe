// 화면 레벨: classic 방금 입력 자리를 진행 상황 카드 / 상단바로 전환 (docs/specs/progress-view-toggle)
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { gameServer } from "@/test/fakeGameServer";
import { hintButton, latestCard, setup, submitWord } from "@/test/formHarness";

const STORAGE_KEY = "newmantle-progress-view";
const gaugeSwitch = () => screen.getByRole("switch", { name: "게이지 보기" });
const topBar = () => screen.queryByRole("table", { name: "방금 입력" });

describe("진행 상황 카드 / 상단바 전환", () => {
  it("처음 들어오면(단어 없음) 카드와 켜진 게이지 스위치 → 끄면 상단바, 다시 켜면 카드로 돌아오고 매번 저장됨", async () => {
    const { user } = await setup();
    expect(latestCard()).toBeInTheDocument();
    expect(topBar()).not.toBeInTheDocument();
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "true");

    await user.click(gaugeSwitch());

    expect(topBar()).toBeInTheDocument();
    expect(latestCard()).not.toBeInTheDocument();
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "false");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("bar");

    await user.click(gaugeSwitch());

    expect(latestCard()).toBeInTheDocument();
    expect(topBar()).not.toBeInTheDocument();
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("card");
  });

  it("저장값이 상단바 → 처음부터 상단바, 카드 없음, 스위치 꺼짐", async () => {
    localStorage.setItem(STORAGE_KEY, "bar");
    await setup();
    expect(topBar()).toBeInTheDocument();
    expect(latestCard()).not.toBeInTheDocument();
    expect(gaugeSwitch()).toHaveAttribute("aria-checked", "false");
  });

  it("상단바, 단어 1개 뒤 힌트 요청 실패 → 상단바 방금 입력 줄에 실패 알림", async () => {
    localStorage.setItem(STORAGE_KEY, "bar");
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    gameServer.failNext("hint");

    await user.click(hintButton());

    await waitFor(() => expect(within(topBar()!).getByRole("alert")).toBeInTheDocument());
  });
});
