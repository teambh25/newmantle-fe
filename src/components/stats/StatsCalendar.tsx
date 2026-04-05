import React from "react";
import { format, subDays, startOfWeek, addDays, differenceInDays } from "date-fns";
import { CalendarEntry, CalendarStatus } from "@/types/stats";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatsCalendarProps {
  calendar: CalendarEntry[];
}

const colorMap = {
  SUCCESS_WITHOUT_HINT: "bg-blue-600 dark:bg-blue-600", // 진한 파란색
  SUCCESS_WITH_HINT: "bg-blue-300 dark:bg-blue-400",    // 연한 파란색
  FAIL: "bg-gray-100 dark:bg-gray-800",                 // 기록 없음과 동일
  OUTAGE: "bg-gray-200 dark:bg-gray-700",
  NONE: "bg-gray-100 dark:bg-gray-800",                 // 빈 칸 색상
};

const labelMap = {
  SUCCESS_WITHOUT_HINT: "정답 (힌트 X)",
  SUCCESS_WITH_HINT: "정답 (힌트 O)",
  FAIL: "실패",
  OUTAGE: "이용 불가",
  NONE: "기록 없음",
};

export const StatsCalendar: React.FC<StatsCalendarProps> = ({ calendar }) => {
  const today = new Date();
  
  // Show exactly 15 weeks
  const WEEKS_TO_SHOW = 15;
  // Start on the Sunday 15 weeks ago
  const startDate = startOfWeek(subDays(today, WEEKS_TO_SHOW * 7), { weekStartsOn: 0 }); // 0 = Sunday
  const daysDiff = differenceInDays(today, startDate) + 1;

  // Generate all dates from startDate to today
  const dates = Array.from({ length: daysDiff }).map((_, i) => addDays(startDate, i));

  const entryMap = new Map<string, CalendarStatus>();
  calendar.forEach((entry) => {
    entryMap.set(entry.date, entry.status);
  });

  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="p-4 bg-white dark:bg-background rounded-lg border shadow-sm w-full overflow-x-auto excel-theme-border">
        {/* GitHub style exact layout: columns=weeks, rows=days. We use flex-col for rows if flex, or grid-rows-7 */}
        <div className="min-w-max flex gap-1">
          {Array.from({ length: Math.ceil(daysDiff / 7) }).map((_, weekIndex) => (
            <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dateIndex = weekIndex * 7 + dayIndex;
                const date = dates[dateIndex];
                
                // If it's outside the [startDate, today] range, show an invisible block to keep exact grid alignment
                if (!date || date > today) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-0 pointer-events-none" />;
                }

                const dateStr = format(date, "yyyy-MM-dd");
                const status = entryMap.get(dateStr) || "NONE";
                const colorClass = colorMap[status as keyof typeof colorMap];

                return (
                  <TooltipProvider key={dateStr}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-transform hover:ring-1 hover:ring-black ${colorClass} ${status === "NONE" || status === "OUTAGE" ? "hover:ring-0" : ""}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-semibold">{dateStr}</p>
                        <p className="text-xs text-muted-foreground">{labelMap[status as keyof typeof labelMap]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
