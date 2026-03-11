"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CartoonFrame } from "@/components/ui/CartoonFrame";
import { useGameDate } from "@/hooks/useGameDate";

const NewMantleForm = dynamic(() => import("@/components/NewMantleForm"), {
  ssr: false,
});

export default function GameSection() {
  const gameDate = useGameDate();
  const [displayDate, setDisplayDate] = useState("");

  useEffect(() => {
    if (gameDate) {
      const [, month, day] = gameDate.split("-");
      setDisplayDate(`${parseInt(month)}월 ${parseInt(day)}일`);
    }
  }, [gameDate]);

  return (
    <CartoonFrame className="p-5 mt-5" bgColor="bg-white" label={displayDate || undefined}>
      <NewMantleForm />
    </CartoonFrame>
  );
}
