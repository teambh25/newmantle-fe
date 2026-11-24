import * as amplitude from "@amplitude/analytics-browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAmplitude } from "./amplitude";

describe("initAmplitude", () => {
  beforeEach(() => {
    vi.mocked(amplitude.init).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("API 키 환경변수가 있으면 초기화할 때 그 키로 SDK를 초기화한다", () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "test-key");

    initAmplitude();

    expect(amplitude.init).toHaveBeenCalledTimes(1);
    expect(vi.mocked(amplitude.init).mock.calls[0][0]).toBe("test-key");
  });

  it("API 키 환경변수가 있으면 초기화할 때 유입 경로만 켜고 나머지 자동 수집은 끈다", () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "test-key");

    initAmplitude();

    const options = vi.mocked(amplitude.init).mock.calls[0][1] as {
      autocapture?: boolean;
      defaultTracking?: unknown;
    };
    expect(options?.autocapture).toBe(false);
    expect(options?.defaultTracking).toEqual({
      attribution: true,
      pageViews: false,
      sessions: false,
      formInteractions: false,
      fileDownloads: false,
    });
  });

  it.each([
    ["없으면", undefined],
    ["빈 값이면", ""],
  ])("API 키 환경변수가 %s 초기화할 때 SDK를 초기화하지 않는다", (_, value) => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", value);

    initAmplitude();

    expect(amplitude.init).not.toHaveBeenCalled();
  });
});
