export type CalendarStatus = "SUCCESS_WITHOUT_HINT" | "SUCCESS_WITH_HINT" | "FAIL" | "OUTAGE";

export interface CalendarEntry {
  date: string;
  status: CalendarStatus;
}

export interface StatSummary {
  total_success_days: number;
  current_streak: number;
  max_streak: number;
  avg_guess_when_correct: number;
  avg_hints_when_correct: number;
}

export interface StatOverviewResp {
  calendar: CalendarEntry[];
  summary: StatSummary;
}

export interface SharerStats {
  date: string;
  status: CalendarStatus;
  guess_count: number;
  hint_count: number;
}
