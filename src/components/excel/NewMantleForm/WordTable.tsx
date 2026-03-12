import React from "react";
import Similarity from "../../classic/NewMantleForm/Similarity";
import { SubmittedWord } from "@/utils/api";
import { Lightbulb } from "lucide-react";

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
  startIndex?: number;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll, startIndex = 2 }) => {
  const displayedWords = showAll ? words : words.slice(0, 5);

  const getStyle = (rank: number | null) => {
    if (rank === null) return "text-[#217346] font-bold";
    if (rank === -1) return "text-gray-400";
    if (rank <= 10) return "text-[#217346] font-bold bg-[#e6f2ea]";
    if (rank <= 100) return "text-[#217346] font-semibold";
    return "text-gray-600";
  };

  return (
    <>
      {displayedWords.map((word, index) => (
        <div
          key={index}
          className={`excel-row text-sm sm:text-base ${word.correct ? "bg-[#dff0d8]" : ""} hover:bg-[#f3f2f1] transition-colors`}
        >
          <div className="sheet-cell-header">{index + startIndex}</div>
          <div className="excel-cell justify-center text-center">
            {word.attempt === -1 ? (
              <Lightbulb size={14} className="text-yellow-600" />
            ) : (
              word.attempt
            )}
          </div>
          <div className={`excel-cell justify-center text-center overflow-hidden text-ellipsis whitespace-nowrap ${word.correct ? "font-bold text-[#217346]" : ""}`}>
            {word.word}
          </div>
          <div
            className={`excel-cell justify-center text-center ${getStyle(
              word.correct ? null : word.rank
            )}`}
          >
            {word.correct
              ? "정답!"
              : word.attempt === -1 && word.rank === 0
              ? "힌트"
              : word.rank === -1
              ? "순위 밖"
              : word.rank !== undefined
              ? `${word.rank}위`
              : "N/A"}
          </div>
          <div className="excel-cell justify-center text-center">
            {word.attempt === -1 && word.rank === 0 ? (
              <span className="text-[#217346] font-bold">HINT</span>
            ) : (
              <Similarity
                similarity={word.similarity}
                rank={word.correct ? null : word.rank}
              />
            )}
          </div>
        </div>
      ))}
    </>
  );
};

export default WordTable;
