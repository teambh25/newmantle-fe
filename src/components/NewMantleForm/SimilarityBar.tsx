import React from "react";

interface SimilarityProps {
  similarity: number | null;
}

const Similarity: React.FC<SimilarityProps> = ({ similarity }) => {
  const getSimilarityColor = (similarity: number | null) => {
    if (similarity === null) return "text-green-600 font-bold";
    if (similarity >= 70) return "text-blue-600 font-semibold";
    if (similarity >= 50) return "text-blue-500";
    return "text-gray-600";
  };

  return (
    <span className={`${getSimilarityColor(similarity)}`}>
      {similarity !== null ? similarity.toFixed(2) : "정답!"}
    </span>
  );
};

export default Similarity;
