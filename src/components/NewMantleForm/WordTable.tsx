import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Similarity from "./Similarity";
import { SubmittedWord } from "@/utils/api";
import { Lightbulb } from "lucide-react";

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll }) => {
  const displayedWords = showAll ? words : words.slice(0, 5);

  const getStyle = (rank: number | null) => {
    if (rank === null) return "text-green-600 font-bold";
    if (rank === -1) return "text-gray-400";
    if (rank <= 10) return "text-blue-600 font-bold";
    if (rank <= 100) return "text-blue-500 font-semibold";
    return "text-gray-600";
  };

  return (
    <Table className="table-fixed bg-white border-none rounded-sm overflow-hidden">
      <TableHeader className="border-b-2 border-game-brown">
        <TableRow>
          <TableHead className="text-center w-12 sm:w-16 font-black text-game-brown">#</TableHead>
          <TableHead className="text-center font-black text-game-brown">단어</TableHead>
          <TableHead className="text-center w-24 sm:w-28 font-black text-game-brown">순위</TableHead>
          <TableHead className="text-center w-24 sm:w-28 font-black text-game-brown">유사도</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedWords.map((word, index) => (
          <TableRow
            key={index}
            className={`border-b border-gray-100 ${word.correct ? "bg-lime-400 font-black border-y-2 border-game-brown" : ""} ${
              index === 0 && !word.correct ? "bg-game-yellow bg-opacity-30 font-black border-y-2 border-game-brown" : "font-bold text-game-brown"
            }`}
          >
            <TableCell className="text-center py-3 w-12 sm:w-16">
              {word.attempt === -1 ? (
                <Lightbulb size={18} className="inline font-bold" />
              ) : (
                word.attempt
              )}
            </TableCell>
            <TableCell className="text-center py-3 whitespace-nowrap overflow-hidden text-ellipsis text-game-brown">
              {word.word}
            </TableCell>
            <TableCell
              className={`text-center py-3 w-24 sm:w-28 ${getStyle(
                word.correct ? null : word.rank
              )}`}
            >
              {word.correct
                ? "정답!"
                : word.attempt === -1 && word.rank === 0
                ? "초성"
                : word.rank === -1
                ? "순위 밖"
                : word.rank !== undefined
                ? `${word.rank}위`
                : "N/A"}
            </TableCell>
            <TableCell className="text-center w-24 sm:w-28 py-3">
              {word.attempt === -1 && word.rank === 0 ? (
                <span className="text-blue-600 font-black">힌트</span>
              ) : (
                <Similarity
                  similarity={word.similarity}
                  rank={word.correct ? null : word.rank}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WordTable;
