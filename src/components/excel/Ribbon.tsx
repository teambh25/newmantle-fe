import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownUp,
  Baseline,
  Bold,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Grid3x3,
  Italic,
  Merge,
  PaintBucket,
  Paintbrush,
  Palette,
  Percent,
  Rows3,
  Scissors,
  Search,
  Sigma,
  Table,
  Underline,
  WrapText,
} from "lucide-react";

// 엑셀 홈 탭 리본. 장식이고, 글꼴·크기 칸 자리에만 시도 횟수를 보여 준다 (specs/excel-ui Dec-59, Dec-67)
// 좁은 화면에서는 오른쪽 그룹부터 숨긴다

/** 그룹: 위에 버튼들, 아래 작은 회색 이름, 오른쪽 구분선 */
function Group({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col justify-between px-2 border-r border-gray-300 shrink-0 ${className}`}>
      <div className="flex items-start gap-1 flex-1">{children}</div>
      <span className="text-[10px] text-gray-500 text-center leading-none pt-1">{label}</span>
    </div>
  );
}

/** 작은 아이콘 버튼 (장식) */
function Icon({ icon: I, className = "" }: { icon: React.ElementType; className?: string }) {
  return (
    <span className={`w-6 h-6 flex items-center justify-center rounded-sm hover:bg-gray-200 text-gray-700 ${className}`} aria-hidden="true">
      <I size={15} />
    </span>
  );
}

/** 큰 아이콘 + 아래 글자 (붙여넣기, 조건부 서식 등) */
function BigButton({ icon: I, label, color = "text-gray-700" }: { icon: React.ElementType; label: string; color?: string }) {
  return (
    <span className="flex flex-col items-center justify-start px-1 rounded-sm hover:bg-gray-200 min-w-[2.75rem]" aria-hidden="true">
      <I size={24} className={color} />
      <span className="text-[10px] text-gray-700 mt-0.5 leading-tight text-center whitespace-nowrap">{label}</span>
    </span>
  );
}

export default function Ribbon() {
  return (
    <div className="w-full bg-[#f3f2f1] border-b border-gray-300 px-2 py-1.5 flex items-stretch h-[76px] shrink-0 overflow-hidden select-none">
      <Group label="Clipboard">
        <BigButton icon={ClipboardPaste} label="Paste" />
        <div className="flex flex-col">
          <Icon icon={Scissors} />
          <Icon icon={Copy} />
          <Icon icon={Paintbrush} />
        </div>
      </Group>

      <Group label="Font">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            {/* 글꼴·크기 칸 자리에 시도 횟수. 숫자는 게임 화면이 채우고, 채우기 전(로딩 중)에는 0 */}
            <div className="w-24 h-6 bg-white border border-gray-300 px-2 text-[13px] flex items-center justify-between shadow-sm">
              <span>시도 횟수</span>
              <ChevronDown size={12} className="text-gray-500" aria-hidden="true" />
            </div>
            <div
              id="excel-attempts-count"
              aria-label="제출 횟수"
              className="w-10 h-6 bg-white border border-gray-300 px-1 text-[13px] flex items-center justify-center shadow-sm tabular-nums empty:before:content-['0']"
            />
          </div>
          <div className="flex items-center">
            <Icon icon={Bold} />
            <Icon icon={Italic} />
            <Icon icon={Underline} />
            <span className="w-px h-4 bg-gray-300 mx-1" />
            <Icon icon={Grid3x3} />
            <Icon icon={PaintBucket} className="text-amber-500" />
            <Icon icon={Baseline} className="text-red-600" />
          </div>
        </div>
      </Group>

      <Group label="Alignment" className="hidden sm:flex">
        <div className="flex flex-col gap-1">
          <div className="flex items-center">
            <Icon icon={AlignLeft} />
            <Icon icon={AlignCenter} />
            <Icon icon={AlignRight} />
          </div>
          <div className="flex items-center">
            <Icon icon={WrapText} />
            <Icon icon={Merge} />
          </div>
        </div>
      </Group>

      <Group label="Number" className="hidden md:flex">
        <div className="flex flex-col gap-1">
          <div className="w-24 h-6 bg-white border border-gray-300 px-2 text-[13px] flex items-center justify-between shadow-sm">
            <span>General</span>
            <ChevronDown size={12} className="text-gray-500" aria-hidden="true" />
          </div>
          <div className="flex items-center">
            <Icon icon={Percent} />
            <span className="w-6 h-6 flex items-center justify-center text-[13px] font-bold text-gray-700" aria-hidden="true">,</span>
            <span className="w-8 h-6 flex items-center justify-center text-[10px] text-gray-700" aria-hidden="true">.00</span>
          </div>
        </div>
      </Group>

      <Group label="Styles" className="hidden lg:flex">
        <BigButton icon={Rows3} label="Conditional" color="text-[#217346]" />
        <BigButton icon={Table} label="Format Table" color="text-[#2b579a]" />
        <BigButton icon={Palette} label="Cell Styles" color="text-[#b7472a]" />
      </Group>

      <Group label="Editing" className="hidden xl:flex border-r-0">
        <BigButton icon={Sigma} label="AutoSum" />
        <BigButton icon={ArrowDownUp} label="Sort & Filter" />
        <BigButton icon={Search} label="Find" />
      </Group>
    </div>
  );
}
