// 기기 타임존과 현재 시각을 고정하는 테스트 도구.
import { afterEach, vi } from "vitest";

export const KST_AFTERNOON = "2026-11-10T05:00:00Z"; // KST 11/10 14:00, LA 11/9 21:00
export const SAME_DAY = "2026-11-10T10:00:00Z"; // KST 11/10 19:00, LA 11/10 02:00

const originalTZ = process.env.TZ;

export function setClock(timeZone: string, isoTime: string) {
  process.env.TZ = timeZone;
  // setup.ts가 이미 interval만 가짜로 설치해 둬서, 해제 후 Date까지 포함해 다시 설치한다
  vi.useRealTimers();
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(new Date(isoTime));
}

// 이 모듈을 import한 테스트 파일에서 타임존을 원래대로 되돌린다 (시각은 setup.ts가 되돌림)
afterEach(() => {
  process.env.TZ = originalTZ;
});
