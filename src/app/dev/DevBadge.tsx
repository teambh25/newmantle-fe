"use client";
// 개발 전용: 모든 화면 왼쪽 아래 DEV 표시 (누르면 /dev), 대기 중인 실패를 다음 요청 한 번에 적용 (docs/tasks/ui/dev-page.md 3·4)
// DevTools.tsx가 개발 서버에서만 불러온다. 배포 빌드에는 들어가지 않는다.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DEV_FAULTS_EVENT, readFaults, takeFault, TARGET_LABELS, writeFaults, type FaultTarget } from "./faults";

export default function DevBadge() {
  const pathname = usePathname();
  const [pending, setPending] = useState<FaultTarget[]>([]);

  useEffect(() => {
    const sync = () => setPending(readFaults());
    sync();
    window.addEventListener(DEV_FAULTS_EVENT, sync);
    window.addEventListener("storage", sync);

    const original = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const next = takeFault(url, readFaults());
      if (!next) return original(input, init);
      writeFaults(next);
      console.info(`[dev] 실패 주입: ${url}`);
      return Promise.resolve(
        new Response(JSON.stringify({ detail: "Server error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    };

    return () => {
      window.fetch = original;
      window.removeEventListener(DEV_FAULTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (pathname === "/dev") return null;

  return (
    <div className="fixed bottom-3 left-3 z-[100] max-w-[calc(100vw-96px)] flex items-center gap-2 rounded-md bg-gray-900/90 text-white text-xs px-2.5 py-1.5 shadow-lg">
      <a href="/dev" className="font-bold text-amber-300 underline underline-offset-2 shrink-0">
        DEV
      </a>
      {pending.length > 0 && (
        <>
          <span className="truncate">다음 {pending.map((t) => TARGET_LABELS[t]).join("·")} 실패</span>
          <button type="button" onClick={() => writeFaults([])} className="underline shrink-0">
            취소
          </button>
        </>
      )}
    </div>
  );
}
