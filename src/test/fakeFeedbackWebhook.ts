// 피드백 웹훅(Make.com)을 흉내 내는 가짜 fetch.
// 외부 경계라서 HTTP에서 가로챈다. 받은 POST 본문을 기록하고, 실패·지연을 재현할 수 있다.

const WEBHOOK_HOST = "hook.eu2.make.com";

type Outcome = "ok" | "fail" | "network";

class FakeFeedbackWebhook {
  /** 받은 요청 본문 (JSON 파싱) */
  bodies: Record<string, unknown>[] = [];
  private nextOutcomes: Outcome[] = [];
  private holds: { promise: Promise<void>; resolve: () => void }[] = [];

  reset() {
    this.bodies = [];
    this.nextOutcomes = [];
    this.holds = [];
  }

  matches(url: string) {
    return url.includes(WEBHOOK_HOST);
  }

  /** 다음 요청 1회를 500으로 응답 */
  failNext() {
    this.nextOutcomes.push("fail");
  }

  /** 다음 요청 1회를 네트워크 오류(fetch reject)로 */
  networkErrorNext() {
    this.nextOutcomes.push("network");
  }

  /** 다음 요청 1회를 release() 전까지 붙잡아 둔다 */
  holdNext() {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    this.holds.push({ promise, resolve });
    return {
      release: async () => {
        resolve();
        await new Promise<void>((r) => setTimeout(r, 0));
      },
    };
  }

  fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
    this.bodies.push(JSON.parse(String(init?.body ?? "{}")));
    const hold = this.holds.shift();
    if (hold) await hold.promise;
    const outcome = this.nextOutcomes.shift() ?? "ok";
    if (outcome === "network") throw new TypeError("Failed to fetch");
    const status = outcome === "fail" ? 500 : 200;
    return { ok: status === 200, status, json: async () => ({}), text: async () => "" } as Response;
  };
}

export const feedbackWebhook = new FakeFeedbackWebhook();
