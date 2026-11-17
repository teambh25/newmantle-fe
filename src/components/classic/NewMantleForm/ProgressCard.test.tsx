// 화면 레벨: 진행 상황 카드 (말풍선, 제출 횟수, 정답 자리)
// 게임 서버·Amplitude·축하 효과·Supabase만 mock하고 화면은 실제 컴포넌트를 렌더링한다. 도구는 src/test/formHarness.tsx
import { describe, expect, it } from "vitest";
import { waitFor, within } from "@testing-library/react";
import { ANSWER, gameServer } from "@/test/fakeGameServer";
import {
  setup,
  hintButton,
  input,
  submitButton,
  submitWord,
  submitAnswer,
  takeConsonantHint,
  giveUpViaDialog,
  latestCard,
  historyTable,
  rowsOf,
  latestItems,
} from "@/test/formHarness";

describe("진행 상황 카드", () => {
  const card = () => latestCard()!;
  const meterValue = () => Number(within(card()).getByRole("meter").getAttribute("aria-valuenow"));
  const bubble = () => latestItems()[0];
  /** 정답 자리 아이콘: 진행 중 / 맞힘 / 포기 */
  const endIcon = (name: RegExp) => within(card()).queryByRole("img", { name });
  const END_PLAYING = /정답 자리/;
  const END_SOLVED = /^정답$/;
  const END_GIVEN_UP = /^포기$/;
  /** 카드 왼쪽 위 제출 횟수 (숫자만 본다) */
  const attemptCount = () => within(card()).queryByLabelText("제출 횟수")?.textContent?.match(/\d+/)?.[0];

  it("처음 → 영역 있고 배너·제출 횟수 없음, 정답 자리는 진행 중", async () => {
    await setup();
    expect(latestCard()).toBeInTheDocument();
    expect(latestItems()).toHaveLength(0);
    expect(attemptCount()).toBeUndefined();
    expect(endIcon(END_PLAYING)).toBeInTheDocument();
  });

  it("500위 제출 → 배너에 단어·500위, 제출 횟수 1, 미터 > 0, 기록 표에도 그 단어", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    expect(bubble().textContent).toContain("사과");
    expect(bubble().textContent).toContain("500위");
    // 평소 단어에는 아이콘 없음 (힌트·다시 내기 등 예외만 아이콘)
    expect(within(bubble()).queryByRole("img")).not.toBeInTheDocument();
    expect(attemptCount()).toBe("1");
    expect(meterValue()).toBeGreaterThan(0);
    expect(rowsOf(historyTable())).toHaveLength(1);
  });

  it("500위 뒤 힌트 → 말풍선에 힌트 표시", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "힌트로 받은 단어" })).toBeInTheDocument());
  });

  it("힌트 단어를 다시 입력 → 다시 입력 표시, 힌트 표시 없음", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await user.click(hintButton());
    await waitFor(() => expect(gameServer.count("hint")).toBe(1));
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "힌트로 받은 단어" })).toBeInTheDocument());
    // 가짜 서버는 힌트 단어를 "힌트{순위}"로 준다
    const hintWord = `힌트${gameServer.normalHintRanks()[0]}`;
    await submitWord(user, "바나나", 300);
    await user.type(input(), hintWord);
    await user.click(submitButton());
    await waitFor(() => expect(within(bubble()).getByRole("img", { name: "이미 입력한 단어" })).toBeInTheDocument());
    expect(within(bubble()).queryByRole("img", { name: "힌트로 받은 단어" })).not.toBeInTheDocument();
  });

  it("500위 뒤 초성 힌트 → 말풍선에 초성·초성 표시", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await takeConsonantHint(user);
    await waitFor(() => expect(bubble().textContent).toContain("ㅈㄷ"));
    expect(within(bubble()).getByRole("img", { name: "초성 힌트" })).toBeInTheDocument();
  });

  it("500위 뒤 정답 → 말풍선에 정답, 정답 자리는 맞힘", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await submitAnswer(user);
    await waitFor(() => expect(bubble().textContent).toContain(ANSWER.word));
    expect(endIcon(END_SOLVED)).toBeInTheDocument();
  });

  it("500위 뒤 포기 → 말풍선에 정답, 정답 자리는 포기", async () => {
    const { user } = await setup();
    await submitWord(user, "사과", 500);
    await giveUpViaDialog(user);
    await waitFor(() => expect(bubble().textContent).toContain(ANSWER.word));
    expect(endIcon(END_GIVEN_UP)).toBeInTheDocument();
  });
});
