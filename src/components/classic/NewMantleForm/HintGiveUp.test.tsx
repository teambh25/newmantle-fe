// 화면 레벨: 힌트·포기 버튼과 포기 확인 창, 요청 중 잠금, 새로고침 후 상태
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 화면은 실제 컴포넌트를 렌더링한다. 도구는 src/test/formHarness.tsx
import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import { ANSWER, gameServer } from "@/test/fakeGameServer";
import { GAME_DATE } from "@/test/gameHarness";
import {
  setup,
  hintButton,
  giveUpButton,
  input,
  submitButton,
  dialog,
  givenUpShown,
  dialogOptions,
  closeButton,
  submitWord,
  submitAnswer,
  openGiveUpDialog,
  takeConsonantHint,
  findResultDialog,
  closeResultDialog,
  giveUpViaDialog,
} from "@/test/formHarness";

describe("일반 힌트 버튼", () => {
  it("18위 단어 제출 후 → 힌트 버튼 비활성, 포기 버튼 활성", async () => {
    const { user } = await setup();
    await submitWord(user, "가까운말", 18);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeEnabled();
  });

  it("18위 상태에서 포기 버튼 → 초성 힌트 선택 → 초성 힌트 받음", async () => {
    const { user } = await setup();
    await submitWord(user, "가까운말", 18);
    await takeConsonantHint(user);
    expect(dialog()).not.toBeInTheDocument();
  });
});

describe("초성 힌트 / 확인 창", () => {
  it("초성 미사용 상태에서 포기 버튼 → 서버 요청 없이 확인 창, 선택지 3개 (초성 힌트 / 포기 / 힌트 없이 계속)", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.all).toHaveLength(3);
    expect(opts.consonant).toBeDefined();
    expect(opts.giveUp).toBeDefined();
    expect(opts.continue).toBeDefined();
    expect(gameServer.count("hint")).toBe(0);
    expect(gameServer.count("give-up")).toBe(0);
  });

  it("포기 버튼 → 창 닫기를 3번 반복해도 매번 확인 창, 초성 힌트가 바로 지급되지 않음", async () => {
    const { user } = await setup();
    for (let i = 0; i < 3; i++) {
      await openGiveUpDialog(user);
      expect(dialogOptions().consonant).toBeDefined();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    }
    expect(gameServer.count("hint")).toBe(0);
  });

  it("초성 미사용 상태에서 힌트 없이 계속 선택 → 요청 없음, 창 닫힘, 다음에도 초성 선택지 있음", async () => {
    const { user } = await setup();
    await openGiveUpDialog(user);
    await user.click(dialogOptions().continue!);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(gameServer.count("hint")).toBe(0);
    expect(gameServer.count("give-up")).toBe(0);
    expect(giveUpButton()).toBeEnabled();
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeDefined();
  });

  it("입력 0개에서 초성 힌트 선택 → 0위 요청 1회, 창 닫힘, 게임 계속", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    expect(dialog()).not.toBeInTheDocument();
    expect(hintButton()).toBeEnabled();
    expect(giveUpButton()).toBeEnabled();
    expect(givenUpShown()).toBe(false);
  });

  it("초성 힌트를 받은 뒤 포기 버튼 → 초성 선택지 없음 (계속 도전 / 포기)", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    expect(opts.consonant).toBeUndefined();
    expect(opts.continue).toBeDefined();
    expect(opts.giveUp).toBeDefined();
    expect(opts.all).toHaveLength(2);
  });

});

describe("포기", () => {
  it("입력 0개에서 포기 선택 → 포기 요청 1회, 확인 창 닫힘", async () => {
    const { user } = await setup();
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(dialog()).not.toBeInTheDocument();
  });

  // 닫는 방법(ESC·X·바깥)은 Radix Dialog가 맡는다. 앱 규칙 "닫으면 요청 없음"만 본다 (초성 미사용 상태는 "창 닫기를 3번 반복" 테스트가 봄)
  it("초성 사용 후 X로 닫기 → 요청 없음, 상태 변화 없음", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    const before = { hint: gameServer.count("hint"), giveUp: gameServer.count("give-up") };
    await openGiveUpDialog(user);
    await user.click(closeButton());
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect({ hint: gameServer.count("hint"), giveUp: gameServer.count("give-up") }).toEqual(before);
    expect(giveUpButton()).toBeEnabled();
    expect(hintButton()).toBeEnabled();
  });

  it.each([
    ["초성 미사용", false],
    ["초성 사용 후", true],
  ])("%s: 창이 열리면 포커스는 계속 플레이 쪽 선택지 (포기 선택지 아님)", async (_label, consonantUsed) => {
    const { user } = await setup();
    if (consonantUsed) await takeConsonantHint(user);
    await openGiveUpDialog(user);
    const opts = dialogOptions();
    const keepPlaying = consonantUsed ? opts.continue : opts.consonant;
    await waitFor(() => expect(keepPlaying).toHaveFocus());
    expect(opts.giveUp).not.toHaveFocus();
  });

  it("초성 사용 후 계속 도전 선택 → 요청 없음, 창 닫힘", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    const hintsBefore = gameServer.count("hint");
    await openGiveUpDialog(user);
    await user.click(dialogOptions().continue!);
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(gameServer.count("hint")).toBe(hintsBefore);
    expect(gameServer.count("give-up")).toBe(0);
    expect(giveUpButton()).toBeEnabled();
  });

  it("초성 사용 후 포기 선택 → 포기 요청 1회, 정답 공개, 게임 종료", async () => {
    const { user } = await setup();
    await takeConsonantHint(user);
    await giveUpViaDialog(user);
    expect(gameServer.count("give-up")).toBe(1);
    expect(screen.getAllByText(ANSWER.word).length).toBeGreaterThan(0);
    expect(giveUpButton()).toBeDisabled();
  });

  it("정답을 맞힌 뒤 포기 버튼은 비활성이고, 눌러도 안내·확인 창이 뜨지 않음", async () => {
    const { user } = await setup();
    await submitWord(user, "아무말", -1);
    await submitAnswer(user);
    expect(giveUpButton()).toBeDisabled();
    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("입력 3개 후 포기 → 결과 창 3, 공유 링크 shared_attempts=3", async () => {
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user, { keepResultOpen: true });

    // 결과창에 시도 횟수 3이 보임 (다른 숫자와 붙어 있지 않은 3)
    const result = screen.getByRole("dialog", { name: "게임 결과" });
    expect(within(result).getByText(/(^|\D)3(\D|$)/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /공유하기/ }));
    const link = await waitFor(async () => {
      const text = await navigator.clipboard.readText();
      expect(text).toContain("shared_attempts");
      return text;
    });
    expect(new URL(link).searchParams.get("shared_attempts")).toBe("3");
  });

  it("친구 공유 링크(shared_attempts=5)로 진입, 입력 3개 후 포기 → 친구 비교에 내 시도 3", async () => {
    window.history.replaceState(null, "", `/?shared_attempts=5&game_date=${GAME_DATE}`);
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user);

    const myLabel = await screen.findByText("나의 시도");
    expect(myLabel.parentElement).toHaveTextContent(/(^|\D)3(\D|$)/);
  });

  it("포기 후 → 힌트·포기 버튼 비활성, 입력창·제출 버튼 활성", async () => {
    const { user } = await setup();
    for (const w of ["하나", "둘", "셋"]) await submitWord(user, w, -1);
    await giveUpViaDialog(user);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
    expect(input()).toBeEnabled();
    expect(submitButton()).toBeEnabled();
  });
});

describe("공통 / 예외", () => {
  it("2번째에 정답 후 → 힌트·포기 버튼 비활성, 입력창·제출 버튼 활성", async () => {
    const { user } = await setup();
    await submitWord(user, "아무말", -1);
    await submitAnswer(user);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
    expect(input()).toBeEnabled();
    expect(submitButton()).toBeEnabled();
  });

  it("힌트 응답 전 → 버튼 비활성 → 응답 후 다시 활성", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint");

    await user.click(hintButton());
    await waitFor(() => expect(hintButton()).toBeDisabled());

    await held.release();
    await waitFor(() => expect(hintButton()).toBeEnabled());
  });

  it("24위에서 힌트(20위) 응답 후 → 잠금은 풀렸지만 최고 순위 20 이내라 비활성 유지", async () => {
    const { user } = await setup();
    await submitWord(user, "꽤가까운말", 24);
    const held = gameServer.holdNext("hint");

    await user.click(hintButton());
    await waitFor(() => expect(hintButton()).toBeDisabled());
    await held.release();

    // 힌트 단어는 카드 배너와 기록 표 두 곳에 보인다
    await waitFor(() => expect(screen.getAllByText("힌트20").length).toBeGreaterThan(0));
    expect(gameServer.normalHintRanks()).toEqual([20]);
    expect(hintButton()).toBeDisabled();
  });

  it("초성 힌트 선택 → 응답 전 포기 버튼 비활성, 눌러도 확인 창 안 열림 → 응답 후 다시 활성", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("hint");

    await openGiveUpDialog(user);
    await user.click(dialogOptions().consonant!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());

    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();
    expect(gameServer.consonantHintCount()).toBe(1);

    await held.release();
    await waitFor(() => expect(giveUpButton()).toBeEnabled());
    expect(gameServer.consonantHintCount()).toBe(1);
  });

  it("포기 선택 → 응답 전 포기 버튼 비활성 → 응답 후 게임 종료로 비활성 유지", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("give-up");

    await openGiveUpDialog(user);
    await user.click(dialogOptions().giveUp!);
    await waitFor(() => expect(giveUpButton()).toBeDisabled());
    await user.click(giveUpButton());
    expect(dialog()).not.toBeInTheDocument();

    await held.release();
    await findResultDialog();
    expect(givenUpShown()).toBe(true);
    await closeResultDialog(user);
    expect(giveUpButton()).toBeDisabled();
    expect(gameServer.count("give-up")).toBe(1);
  });

  it("단어 제출 응답 전 → 입력창·제출 버튼 비활성 (기존 동작 유지)", async () => {
    const { user } = await setup();
    const held = gameServer.holdNext("guess");

    await user.type(input(), "기다리는말");
    await user.click(submitButton());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(submitButton()).toBeDisabled();

    await held.release();
    await waitFor(() => expect(input()).toBeEnabled());
    expect(submitButton()).toBeEnabled();
    expect(gameServer.count("guess")).toBe(1);
  });

  it("포기 버튼 → 창 닫기 → 새로고침 → 포기 버튼 → 확인 창이 뜸 (바로 지급되지 않음)", async () => {
    const first = await setup();
    await openGiveUpDialog(first.user);
    await first.user.keyboard("{Escape}");
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    first.unmount();

    const { user } = await setup();
    await openGiveUpDialog(user);
    expect(dialogOptions().consonant).toBeDefined();
    expect(gameServer.count("hint")).toBe(0);
  });

  it("포기 후 새로고침 → 포기 결과 표시 유지, 힌트·포기 버튼 비활성", async () => {
    const first = await setup();
    await submitWord(first.user, "하나", -1);
    await giveUpViaDialog(first.user);
    first.unmount();

    const { user } = await setup();
    // 새로고침 후에는 결과창이 자동으로 열리지 않으므로 다시 보기로 확인한다
    await user.click(screen.getByRole("button", { name: /결과창 보기/ }));
    await findResultDialog();
    expect(givenUpShown()).toBe(true);
    await closeResultDialog(user);
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });

  it("2번째에 정답 후 새로고침 → 힌트·포기 버튼 비활성", async () => {
    const first = await setup();
    await submitWord(first.user, "아무말", -1);
    await submitAnswer(first.user);
    first.unmount();

    await setup();
    expect(hintButton()).toBeDisabled();
    expect(giveUpButton()).toBeDisabled();
  });
});
