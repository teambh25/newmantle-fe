import Link from "next/link";

// 왼쪽 아래 엑셀 시트 탭. 규칙·통계는 classic 페이지로 이동한다 (docs/specs/excel-ui Dec-11, Dec-27)
// 공지사항은 설정 메뉴에서 들어간다
const TAB = "flex items-center h-full px-4 sm:px-5 border-r border-gray-300 whitespace-nowrap";

export default function SheetTabs() {
  return (
    <nav className="bg-[#f3f2f1] border-t border-gray-300 pl-2 sm:pl-4 flex items-stretch text-sm shrink-0 h-8">
      <span
        aria-current="page"
        className={`${TAB} bg-white border-t-2 border-t-[#217346] text-[#217346] font-bold shadow-[0_-2px_5px_rgba(0,0,0,0.05)]`}
      >
        게임
      </span>
      <Link href="/rule" className={`${TAB} text-gray-700 hover:bg-[#e1dfdd]`}>
        규칙
      </Link>
      <Link href="/stats" className={`${TAB} text-gray-700 hover:bg-[#e1dfdd]`}>
        통계
      </Link>
    </nav>
  );
}
