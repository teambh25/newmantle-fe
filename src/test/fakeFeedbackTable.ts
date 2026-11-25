// Supabase `feedback` 테이블 insert를 흉내 내는 stub (docs/specs/feedback-migration Dec-16).
// Supabase client mock의 from("feedback")이 이걸 돌려준다. 받은 insert 행을 기록하고, 실패·지연을 재현할 수 있다.
// supabase-js처럼 실패해도 reject하지 않고 { error }로 응답한다 (네트워크 오류·중단 포함).

type Outcome = "ok" | "error" | "network";
type Result = { data: null; error: { message: string; code: string } | null };

const ERRORS: Record<Exclude<Outcome, "ok">, Result["error"]> = {
  // RLS·check 위반 등 PostgREST 오류 응답
  error: { message: "new row violates row-level security policy", code: "42501" },
  network: { message: "TypeError: Failed to fetch", code: "" },
};
const ABORTED: Result["error"] = { message: "AbortError: The operation was aborted.", code: "20" };

class FakeFeedbackTable {
  /** 받은 insert 행 (성공·실패 모두) */
  inserts: Record<string, unknown>[] = [];
  private nextOutcomes: Outcome[] = [];
  private holds: { promise: Promise<void>; resolve: () => void }[] = [];

  reset() {
    this.inserts = [];
    this.nextOutcomes = [];
    this.holds = [];
  }

  /** 다음 insert 1회를 오류 응답으로 */
  failNext() {
    this.nextOutcomes.push("error");
  }

  /** 다음 insert 1회를 네트워크 오류로 */
  networkErrorNext() {
    this.nextOutcomes.push("network");
  }

  /** 다음 insert 1회를 release() 전까지 붙잡아 둔다. abortSignal로 중단되면 그때 중단 오류로 응답 */
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

  /** supabase.from("feedback") 대신 */
  table = () => ({ insert: this.insert });

  private insert = (row: Record<string, unknown>) => {
    let signal: AbortSignal | undefined;
    const run = async (): Promise<Result> => {
      this.inserts.push(row);
      const hold = this.holds.shift();
      if (hold) {
        const aborted = await Promise.race([
          hold.promise.then(() => false),
          new Promise<boolean>((r) => {
            if (signal?.aborted) r(true);
            signal?.addEventListener("abort", () => r(true));
          }),
        ]);
        if (aborted) return { data: null, error: ABORTED };
      }
      const outcome = this.nextOutcomes.shift() ?? "ok";
      return { data: null, error: outcome === "ok" ? null : ERRORS[outcome] };
    };
    const builder = {
      abortSignal(s: AbortSignal) {
        signal = s;
        return builder;
      },
      then<T1 = Result, T2 = never>(
        onFulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
        onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
      ) {
        return run().then(onFulfilled, onRejected);
      },
    };
    return builder;
  };
}

export const feedbackTable = new FakeFeedbackTable();
