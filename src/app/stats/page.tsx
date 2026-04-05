"use client";

import React from "react";
import { format, subDays } from "date-fns";
import { fetchStatsOverview } from "@/utils/api";
import { StatOverviewResp } from "@/types/stats";
import { useQuery } from "@tanstack/react-query";
import { StatsSummaryCards } from "@/components/stats/StatsSummaryCards";
import { StatsCalendar } from "@/components/stats/StatsCalendar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AuthButton from "@/components/AuthButton";
import { SettingsButton } from "@/components/SettingsButton";
import { useUITheme } from "@/hooks/useUITheme";

export default function StatsPage() {
  const router = useRouter();
  const { theme, setTheme } = useUITheme();

  // 1. Fetch Session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const userId = session?.user?.id;

  // 2. Fetch Overview Stats
  const { data: overview, isLoading: overviewLoading, error: queryError } = useQuery({
    queryKey: ["statsOverview", userId],
    queryFn: async () => {
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 90), "yyyy-MM-dd");
      
      const data = await fetchStatsOverview(startDate, endDate);
      return data; // Return full StatOverviewResp
    },
    enabled: !!userId,
  });

  const isLoading = sessionLoading || overviewLoading;
  const error = !sessionLoading && !userId ? "로그인이 필요합니다." : queryError ? (queryError as Error).message : null;

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <main className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl flex flex-row items-center justify-between mb-6 mt-2 sm:mt-0"
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 sm:-ml-4">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2 relative top-[2px]">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 leading-none pb-0.5">
                개인 통계
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <AuthButton />
            <SettingsButton theme={theme} onThemeChange={setTheme} variant="classic" />
          </div>
        </motion.div>

        <div className="w-full max-w-2xl space-y-8 flex-grow flex flex-col pb-16">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-destructive/15 text-destructive p-4 rounded-md text-center">
              {error}
            </div>
          ) : overview ? (
            <div className="space-y-10">
              <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2">요약</h2>
                <StatsSummaryCards summary={overview.summary} />
              </section>
              
              <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2">최근 활동 기록</h2>
                <StatsCalendar calendar={overview.calendar} />
              </section>
            </div>
          ) : null}
        </div>
      </main>
      
    </div>
  );
}
