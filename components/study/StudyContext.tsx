"use client";
import { createContext, useContext } from "react";
import type { SourceRef } from "@/lib/client/types";

export interface StudyCtx {
  setSources: (s: SourceRef[]) => void;
  focusSource: (chunkId: string) => void;
  refreshUsage: () => void;
}

const Ctx = createContext<StudyCtx | null>(null);

export const StudyProvider = Ctx.Provider;

export function useStudy(): StudyCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudy must be used within StudyProvider");
  return v;
}
