import React from "react";

interface SimilarityProps {
  similarity: number | null | undefined;
  rank: number | null;
}

const Similarity: React.FC<SimilarityProps> = ({ similarity, rank }) => {
  const getStyle = (rank: number | null) => {
    if (rank === null) return "text-green-600 font-bold";
    if (rank === -1) return "text-gray-400";
    if (rank <= 10) return "text-blue-600 font-bold";
    if (rank <= 100) return "text-blue-500 font-semibold";
    return "text-gray-600";
  };

  return (
    <span className={getStyle(rank)}>
      {similarity !== null && similarity !== undefined
        ? similarity.toFixed(2)
        : rank === null
        ? "정답!"
        : "N/A"}
    </span>
  );
};

export default Similarity;
