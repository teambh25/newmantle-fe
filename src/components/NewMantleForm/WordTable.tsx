import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SimilarityBar from "./SimilarityBar";
import { SubmittedWord } from "@/utils/api";

interface WordTableProps {
  words: SubmittedWord[];
  showAll: boolean;
}

const WordTable: React.FC<WordTableProps> = ({ words, showAll }) => {
  const displayedWords = showAll ? words : words.slice(0, 5);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center w-12">#</TableHead>
          <TableHead className="text-center">단어</TableHead>
          <TableHead className="text-center w-20">순위</TableHead>
          <TableHead className="text-center">유사도</TableHead>
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
            <TableCell className="text-center py-2 w-12">
              {word.attempt}
            </TableCell>
            <TableCell className="text-center py-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {word.word}
            </TableCell>
            <TableCell className="text-center py-2 w-20">
              {word.rank === -1 ? "순위 밖" : `${word.rank}위`}
            </TableCell>
            <TableCell className="w-1/3 py-2">
              <SimilarityBar similarity={word.similarity} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WordTable;
