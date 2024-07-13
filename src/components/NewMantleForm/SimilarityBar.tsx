import React from "react";

interface SimilarityBarProps {
  similarity: number | null;
  rank: number | null;
}

const SimilarityBar: React.FC<SimilarityBarProps> = ({ similarity, rank }) => {
  const barWidth = similarity !== null ? `${Math.abs(similarity) / 2}%` : "0%";
  const barColor =
    similarity !== null && similarity >= 0 ? "bg-blue-500" : "bg-red-500";

  const getRankDisplay = () => {
    if (rank === null) return "정답!";
    if (rank === -1) return "순위 밖";
    return `${rank}위`;
  };

  return (
    <div className="w-full">
      <div className="text-center text-xs text-gray-500 font-semibold">
        {getRankDisplay()}
      </div>
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 bottom-0 ${barColor}`}
          style={{
            width: barWidth,
            left: similarity !== null && similarity >= 0 ? "50%" : "auto",
            right: similarity !== null && similarity < 0 ? "50%" : "auto",
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs text-gray-400 z-10">
          {similarity !== null ? similarity.toFixed(2) : "정답!"}
        </div>
      </div>
    </div>
  );
};

export default SimilarityBar;
