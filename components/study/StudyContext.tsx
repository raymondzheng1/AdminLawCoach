"use client";
import { createContext, useContext } from "react";
import type { SourceRef } from "@/lib/client/types";

export interface StudyCtx {
  setSources: (s: SourceRef[]) => void;
  focusSource: (chunkId: string) => void;
  refreshUsage: () => void;
  /** Toggle the source-panel loading shimmer (set by the source-bearing views). */
  setBusy: (busy: boolean) => void;
  /** Open the header "Use your own key" panel (from an allowance-reached error). */
  openByoKey: () => void;
}

const Ctx = createContext<StudyCtx | null>(null);

export const StudyProvider = Ctx.Provider;

export function useStudy(): StudyCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStudy must be used within StudyProvider");
  return v;
}
