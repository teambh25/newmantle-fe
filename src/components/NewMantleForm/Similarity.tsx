import React from "react";

interface SimilarityProps {
  similarity: number | null;
  rank: number;
}

const Similarity: React.FC<SimilarityProps> = ({ similarity, rank }) => {
  const getStyle = (rank: number) => {
    if (rank === -1) return "text-gray-400";
    if (rank <= 10) return "text-blue-600 font-bold";
    if (rank <= 100) return "text-blue-500 font-semibold";
    return "text-gray-600";
  };

  return (
    <span className={getStyle(rank)}>
      {similarity !== null ? similarity.toFixed(2) : "정답!"}
    </span>
  );
};

export default Similarity;
