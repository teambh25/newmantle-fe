// 게임 서버(v2 API)를 흉내 내는 가짜 fetch.
// 응답 형태는 docs/api/game-v2.md 기준. 앱 내부 함수가 아니라 HTTP 경계에서 가로채므로
// API 클라이언트 구현이 바뀌어도 테스트는 그대로 쓸 수 있다.

export type RequestKind = "guess" | "hint" | "give-up" | "stats";

export interface RecordedRequest {
  kind: RequestKind;
  path: string;
  word?: string;
  rank?: number;
}

type GateResult = "ok" | "fail";

export interface HeldRequest {
  /** 붙잡아 둔 요청에 정상 응답한다 */
  release: () => Promise<void>;
  /** 붙잡아 둔 요청을 실패(500)로 응답한다 */
  fail: () => Promise<void>;
}

interface Gate {
  promise: Promise<GateResult>;
  resolve: (r: GateResult) => void;
  match?: (r: RecordedRequest) => boolean;
}

function createGate(): Gate {
  let resolve!: (r: GateResult) => void;
  const promise = new Promise<GateResult>((r) => (resolve = r));
  return { promise, resolve };
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

export const ANSWER = {
  word: "정답",
  tag: "명사",
  description: "테스트용 정답",
};

class FakeGameServer {
  requests: RecordedRequest[] = [];
  private guessRanks = new Map<string, number>();
  private failNextKinds: RequestKind[] = [];
  private holdNextGates = new Map<RequestKind, Gate[]>();

  reset() {
    this.requests = [];
    this.guessRanks.clear();
    this.failNextKinds = [];
    this.holdNextGates.clear();
  }

  /** 추측 단어의 순위를 정한다. 정하지 않은 단어는 순위 밖(-1) */
  setRank(word: string, rank: number) {
    this.guessRanks.set(word, rank);
  }

  /** 다음 kind 요청 1회를 실패(500)시킨다 */
  failNext(kind: RequestKind) {
    this.failNextKinds.push(kind);
  }

  /** 다음 kind 요청 1회(match가 있으면 조건에 맞는 요청)를 직접 응답시키기 전까지 붙잡아 둔다 */
  holdNext(kind: RequestKind, match?: (r: RecordedRequest) => boolean): HeldRequest {
    const gate: Gate = { ...createGate(), match };
    const gates = this.holdNextGates.get(kind) ?? [];
    gates.push(gate);
    this.holdNextGates.set(kind, gates);
    return {
      release: async () => {
        gate.resolve("ok");
        await flush();
      },
      fail: async () => {
        gate.resolve("fail");
        await flush();
      },
    };
  }

  count(kind: RequestKind, filter?: (r: RecordedRequest) => boolean) {
    return this.requests.filter((r) => r.kind === kind && (!filter || filter(r))).length;
  }

  /** 일반 힌트(1~999)로 요청된 순위 목록 */
  normalHintRanks(): number[] {
    return this.requests
      .filter((r) => r.kind === "hint" && r.rank !== 0)
      .map((r) => r.rank!);
  }

  consonantHintCount() {
    return this.count("hint", (r) => r.rank === 0);
  }

  fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const path = url.replace(/^.*?(\/v2\/)/, "/v2/");
    const req = this.parse(path);
    this.requests.push(req);

    let fail = false;
    const failIndex = this.failNextKinds.indexOf(req.kind);
    if (failIndex !== -1) {
      this.failNextKinds.splice(failIndex, 1);
      fail = true;
    }

    const gates = this.holdNextGates.get(req.kind) ?? [];
    const gateIndex = gates.findIndex((g) => !g.match || g.match(req));
    const gate = gateIndex === -1 ? undefined : gates.splice(gateIndex, 1)[0];
    if (gate) {
      fail = (await gate.promise) === "fail" || fail;
    }

    if (fail) return jsonResponse(500, { detail: "fake server error" });
    return jsonResponse(200, this.body(req));
  };

  private parse(path: string): RecordedRequest {
    let m = path.match(/^\/v2\/quizzes\/[^/]*\/guess\/(.+)$/);
    if (m) return { kind: "guess", path, word: decodeURIComponent(m[1]) };
    m = path.match(/^\/v2\/quizzes\/[^/]*\/hint\/(-?\d+)$/);
    if (m) return { kind: "hint", path, rank: Number(m[1]) };
    if (/^\/v2\/quizzes\/[^/]*\/give-up$/.test(path)) return { kind: "give-up", path };
    if (path.startsWith("/v2/stats")) return { kind: "stats", path };
    throw new Error(`fakeGameServer: 알 수 없는 요청 ${path}`);
  }

  private body(req: RecordedRequest): unknown {
    switch (req.kind) {
      case "guess": {
        if (req.word === ANSWER.word) {
          return { correct: true, rank: null, score: null, answer: ANSWER };
        }
        const rank = this.guessRanks.get(req.word!) ?? -1;
        return { correct: false, rank, score: rank === -1 ? 5 : 50, answer: null };
      }
      case "hint":
        return req.rank === 0
          ? { hint: "ㅈㄷ", score: null }
          : { hint: `힌트${req.rank}`, score: 50 };
      case "give-up":
        return ANSWER;
      case "stats":
        return { hint_count: 0 };
    }
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

export const gameServer = new FakeGameServer();
