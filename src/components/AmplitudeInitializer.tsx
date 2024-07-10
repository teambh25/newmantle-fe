"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/utils/amplitude";

export default function AmplitudeInitializer() {
  useEffect(() => {
    initAmplitude();
  }, []);

  return null;
}
