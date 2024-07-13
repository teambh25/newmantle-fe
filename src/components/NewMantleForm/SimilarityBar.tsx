import React from "react";

interface SimilarityBarProps {
  similarity: number | null;
  rank: number;
}

const SimilarityBar: React.FC<SimilarityBarProps> = ({ similarity, rank }) => {
  const barWidth = similarity !== null ? `${Math.abs(similarity) / 2}%` : "0%";
  const barColor =
    similarity !== null && similarity >= 0 ? "bg-blue-500" : "bg-red-500";

  return (
    <div className="w-full">
      <div className="text-center text-xs text-gray-500 font-semibold">
        {rank === -1 ? "순위 밖" : `${rank}위`}
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
