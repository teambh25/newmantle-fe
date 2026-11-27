import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NicknameSetupModal from "./NicknameSetupModal";

// 응답 형태는 postgrest-js 기준
// - 프로필 없음: .single()이 0행을 받으면 PostgREST가 406 + PGRST116을 준다
// - 조회 실패: DB 중단·네트워크 오류. fetch가 실패하면 code가 빈 문자열인 error를 준다
const NO_PROFILE = {
  data: null,
  error: { code: "PGRST116", details: "The result contains 0 rows", hint: null, message: "JSON object requested, multiple (or no) rows returned" },
  status: 406,
};
const LOOKUP_FAILED = {
  data: null,
  error: { code: "", details: "", hint: "", message: "TypeError: Failed to fetch" },
  status: 0,
};

// 본인 프로필 조회가 응답했는지 알 수 있게 한다.
// setup.ts가 setInterval을 가짜로 바꿔서, 화면이 바뀌지 않으면 waitFor가 다시 확인하지 않는다
const profileLookup = vi.hoisted(() => ({
  result: null as unknown,
  answered: Promise.resolve(),
  markAnswered: () => {},
}));

// 닉네임 설정 창이 쓰는 메서드: getSession, profiles 조회(본인·중복 확인), profiles insert
// 실제 브라우저 클라이언트처럼 매번 같은 객체를 돌려준다 (컴포넌트 effect가 클라이언트를 의존성으로 둔다)
vi.mock("@/utils/supabase/client", () => {
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "user-1" } } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            profileLookup.markAnswered();
            return profileLookup.result;
          },
        }),
      }),
      insert: async () => ({ error: null }),
    }),
  };
  return { createClient: () => client };
});

describe("닉네임 설정 창", () => {
  beforeEach(() => {
    profileLookup.answered = new Promise<void>((resolve) => {
      profileLookup.markAnswered = resolve;
    });
  });

  it("로그인했고 프로필이 없는 상태 → 메인 화면을 연다 → 닉네임 설정 창이 열린다", async () => {
    profileLookup.result = NO_PROFILE;

    render(<NicknameSetupModal />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("로그인했고 닉네임 조회가 실패하는 상태 → 메인 화면을 연다 → 조회가 끝난 뒤에도 닉네임 설정 창이 열리지 않는다", async () => {
    profileLookup.result = LOOKUP_FAILED;

    render(<NicknameSetupModal />);

    // 조회 응답과 그 결과로 생기는 화면 갱신까지 끝난 뒤 확인한다
    await act(async () => {
      await profileLookup.answered;
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
