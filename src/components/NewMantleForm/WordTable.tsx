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

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll }) => {
  const displayedWords = showAll ? words : words.slice(0, 5);

  const getStyle = (rank: number) => {
    if (rank === -1) return "text-gray-400";
    if (rank <= 10) return "text-blue-600 font-bold";
    if (rank <= 100) return "text-blue-500 font-semibold";
    return "text-gray-600";
  };

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-12 sm:w-16">🔄</TableHead>
          <TableHead className="text-center">단어</TableHead>
          <TableHead className="text-center w-20 sm:w-24">순위</TableHead>
          <TableHead className="text-center w-20 sm:w-24">유사도</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedWords.map((word, index) => (
          <TableRow
            key={index}
            className={`${word.correct ? "bg-green-100" : ""} ${
              index === 0 ? "bg-blue-50" : ""
            }`}
          >
            <TableCell className="text-center py-2 w-12 sm:w-16">
              {word.attempt}
            </TableCell>
            <TableCell className="text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {word.word}
            </TableCell>
            <TableCell
              className={`text-center py-2 w-20 sm:w-24 ${getStyle(word.rank)}`}
            >
              {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
            </TableCell>
            <TableCell className="text-center w-20 sm:w-24 py-2">
              <Similarity similarity={word.similarity} rank={word.rank} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WordTable;
