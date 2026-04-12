import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatSummary } from "@/types/stats";
import { Trophy, Flame, Target, Lightbulb, TrendingUp } from "lucide-react";

interface StatsSummaryCardsProps {
  summary: StatSummary;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const StatsSummaryCards: React.FC<StatsSummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: "총 정답 일수",
      value: summary.total_success_days,
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    },
    {
      title: "현재 연속 정답",
      value: `${summary.current_streak}일`,
      icon: <Flame className="h-5 w-5 text-orange-500" />,
    },
    {
      title: "최대 연속 정답",
      value: `${summary.max_streak}일`,
      icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: "평균 추측 횟수",
      value: summary.avg_guess_when_correct.toFixed(1),
      icon: <Target className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "평균 힌트 사용",
      value: summary.avg_hints_when_correct.toFixed(1),
      icon: <Lightbulb className="h-5 w-5 text-yellow-300" />,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3"
    >
      {cards.map((card, idx) => (
        <motion.div key={idx} variants={itemVariants} className={idx === 4 ? "col-span-2 sm:col-span-1" : ""}>
          <Card className="hover:shadow-lg transition-shadow bg-card shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-0 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-1 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};
