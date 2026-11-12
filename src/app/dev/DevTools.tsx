"use client";
// 개발 서버에서만 DEV 표시·실패 주입을 붙인다 (docs/tasks/ui/dev-page.md 4·5).
// 배포 빌드에서는 조건이 false로 고정돼 아래 import가 번들에서 빠진다.
import dynamic from "next/dynamic";

const DevBadge =
  process.env.NODE_ENV === "development" ? dynamic(() => import("./DevBadge"), { ssr: false }) : null;

export default function DevTools() {
  return DevBadge ? <DevBadge /> : null;
}
