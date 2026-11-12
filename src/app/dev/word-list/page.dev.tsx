// 개발 전용: 단어 목록 화면 확인용 (docs/tasks/ui/word-list.md 5장)
// *.dev.tsx는 개발 서버에서만 페이지로 인식된다 (next.config.mjs pageExtensions). 배포 빌드에는 경로가 없다
import SeedPanel from "./SeedPanel";

export default function DevWordListPage() {
  return <SeedPanel />;
}
