// 개발 전용: 가짜 단어 목록·예외 상황 확인 (docs/tasks/ui/dev-page.md)
// *.dev.tsx는 개발 서버에서만 페이지로 인식된다 (next.config.mjs pageExtensions). 배포 빌드에는 경로가 없다
import DevPanel from "./DevPanel";

export default function DevPage() {
  return <DevPanel />;
}
