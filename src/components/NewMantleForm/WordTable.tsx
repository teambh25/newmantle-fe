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
          <TableHead className="text-center w-20">🔄</TableHead>
          <TableHead className="text-center">단어</TableHead>
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
            <TableCell className="text-center py-2 w-20">
              {word.attempt}트
            </TableCell>
            <TableCell className="text-center py-2">{word.word}</TableCell>
            <TableCell className="w-1/2 py-2">
              <SimilarityBar similarity={word.similarity} rank={word.rank} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WordTable;
