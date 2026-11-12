// 개발 전용: 게임 요청을 다음 한 번 실패시켜 실패 화면을 본다 (docs/tasks/ui/dev-page.md)
// 대기 중인 실패는 localStorage에 두고, /dev 페이지가 쓰고 DevBadge가 읽어 적용한다.

export type FaultTarget = "guess" | "hint" | "consonant" | "giveUp";

export const DEV_FAULTS_KEY = "newmantle_dev_faults";
/** 같은 탭 안에서 대기 목록이 바뀌었음을 알린다 (storage 이벤트는 다른 탭에만 감) */
export const DEV_FAULTS_EVENT = "newmantle-dev-faults";

export const TARGET_LABELS: Record<FaultTarget, string> = {
  guess: "단어 제출",
  hint: "힌트",
  consonant: "초성 힌트",
  giveUp: "포기",
};

/** 게임 v2 요청 주소의 종류. 게임 요청이 아니면 null */
function targetOf(url: string): FaultTarget | null {
  const m = url.match(/\/v2\/quizzes\/[^/]+\/(guess\/|hint\/(\d+)|give-up)/);
  if (!m) return null;
  if (m[1] === "give-up") return "giveUp";
  if (m[1] === "guess/") return "guess";
  return m[2] === "0" ? "consonant" : "hint";
}

/** 이 요청을 실패시켜야 하면 그 종류를 뺀 대기 목록, 아니면 null */
export function takeFault(url: string, pending: FaultTarget[]): FaultTarget[] | null {
  const target = targetOf(url);
  if (!target || !pending.includes(target)) return null;
  return pending.filter((t) => t !== target);
}

export function readFaults(): FaultTarget[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEV_FAULTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFaults(pending: FaultTarget[]) {
  if (pending.length) localStorage.setItem(DEV_FAULTS_KEY, JSON.stringify(pending));
  else localStorage.removeItem(DEV_FAULTS_KEY);
  window.dispatchEvent(new Event(DEV_FAULTS_EVENT));
}
