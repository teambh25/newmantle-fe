// 피드백 Apps Script 웹앱을 흉내 내는 가짜 fetch (docs/specs/feedback-migration Dec-15).
// 외부 경계라서 HTTP에서 가로챈다. 받은 요청을 기록하고, 실패·무응답을 재현할 수 있다.

const SCRIPT_URL_PREFIX = "https://script.google.com/macros/s/";

type Outcome = "ok" | "rejected" | "network";

export interface FeedbackRequest {
  /** 본문 (JSON 파싱) */
  body: Record<string, unknown>;
  contentType: string | null;
  keepalive: boolean;
}

class FakeFeedbackScript {
  requests: FeedbackRequest[] = [];
  private nextOutcomes: Outcome[] = [];
  private holdingNext = false;

  reset() {
    this.requests = [];
    this.nextOutcomes = [];
    this.holdingNext = false;
  }

  matches(url: string) {
    return url.startsWith(SCRIPT_URL_PREFIX);
  }

  /** 다음 요청 1회를 성공 표시 없이 응답 (`{ ok: false }`, 스크립트가 거절하거나 저장에 실패함) */
  rejectNext() {
    this.nextOutcomes.push("rejected");
  }

  /** 다음 요청 1회를 네트워크 오류(fetch reject)로 */
  networkErrorNext() {
    this.nextOutcomes.push("network");
  }

  /** 다음 요청 1회에 응답하지 않는다. 요청의 signal로 중단되면 그때 AbortError로 reject */
  holdNext() {
    this.holdingNext = true;
  }

  fetch = async (_url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    this.requests.push({
      body: JSON.parse(String(init?.body ?? "{}")),
      contentType: headers.get("Content-Type"),
      keepalive: init?.keepalive === true,
    });

    if (this.holdingNext) {
      this.holdingNext = false;
      const signal = init?.signal;
      await new Promise<never>((_, reject) => {
        const abort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
        if (signal?.aborted) abort();
        signal?.addEventListener("abort", abort);
      });
    }

    const outcome = this.nextOutcomes.shift() ?? "ok";
    if (outcome === "network") throw new TypeError("Failed to fetch");
    const body = { ok: outcome === "ok" };
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) } as Response;
  };
}

export const feedbackScript = new FakeFeedbackScript();
