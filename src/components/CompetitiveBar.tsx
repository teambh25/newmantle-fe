import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CompetitiveBarProps {
  currentAttempts: number;
  sharedAttempts: number;
  theme: "classic" | "excel";
  gameCompleted: boolean;
}

export default function CompetitiveBar({
  currentAttempts,
  sharedAttempts,
  theme,
  gameCompleted,
}: CompetitiveBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const maxBarValue = sharedAttempts * 2;
  const myBarWidth = Math.max(0, 100 - (currentAttempts / maxBarValue) * 100);

  const isTrailing = currentAttempts < sharedAttempts;
  const isTied = currentAttempts === sharedAttempts;
  
  if (theme === "excel") {
    return (
      <div className="w-full flex justify-center py-2 bg-white">
        <div className="w-full border border-[#d4d4d4] p-3 text-sm flex flex-col space-y-3">
          <div className="flex justify-between items-center text-[#444] font-bold">
            <span>나의 시도: {currentAttempts}</span>
            <span>친구의 기록: {sharedAttempts}</span>
          </div>
          <div className="relative w-full h-3 bg-red-400 border border-gray-300">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${myBarWidth}%` }}
              className={`h-full ${
                isTrailing ? "bg-[#217346]" : isTied ? "bg-[#217346]" : "bg-gray-500"
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Classic Theme
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col space-y-4">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">나의 시도</span>
          <span className="text-2xl font-bold text-blue-600 leading-none">{currentAttempts}</span>
        </div>
        <div className="text-center text-sm font-medium text-gray-700 px-2 pb-0.5">
          VS
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 mb-1">친구의 기록</span>
          <span className="text-2xl font-bold text-red-500 leading-none">{sharedAttempts}</span>
        </div>
      </div>

      <div className="relative w-full h-4 bg-red-400 rounded-full overflow-hidden shadow-inner flex">
        {/* Progress Fill (My Bar) */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${myBarWidth}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className={`h-full rounded-r-full ${
            gameCompleted && currentAttempts <= sharedAttempts ? "bg-green-500" :
            isTrailing ? "bg-blue-500" : isTied ? "bg-yellow-400" : "bg-gray-400"
          }`}
          style={{ transformOrigin: "left" }}
        />
      </div>
      
    </div>
  );
}
