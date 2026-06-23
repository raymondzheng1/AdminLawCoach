"use client";
import { useState } from "react";
import { PinpointChip } from "@/components/study/PinpointChip";
import { SourcePanel } from "@/components/study/SourcePanel";
import type { SourceRef } from "@/lib/client/types";

/**
 * Landing "A real answer looks like this" demo — uses the SAME chip + source-panel
 * components as the app, with REAL in-corpus authorities (Li, SZVFW; never the
 * out-of-corpus Wednesbury). Content is the genuine Australian unreasonableness
 * standard present in the course materials; framed as illustrative of the format.
 */
const SOURCES: SourceRef[] = [
  {
    role: "rules",
    authority: "Minister for Immigration v Li",
    pinpoint: "Li [76]",
    chunkId: "li",
    locationLabel: "(2013) 249 CLR 332 · legal unreasonableness",
    excerpt: "",
    quote:
      "An inference of unreasonableness may be drawn where a decision lacks an evident and intelligible justification, even where a particular error in reasoning cannot be identified.",
  },
  {
    role: "notes",
    authority: "Legal unreasonableness",
    pinpoint: "Sem 21",
    chunkId: "szvfw",
    locationLabel: "Seminar 21 — Unreasonableness",
    excerpt: "",
    quote:
      "Li recast the Australian standard: review is not confined to decisions that are irrational, but extends to outcomes lacking a justification that can be understood (SZVFW).",
  },
];

export function LandingPreview() {
  const [focused, setFocused] = useState<string | undefined>(SOURCES[0]!.chunkId);
  return (
    <div className="mx-auto grid max-w-[860px] overflow-hidden rounded-card border border-line bg-surface md:grid-cols-[1.5fr_1fr]">
      <div className="p-6 md:border-r md:border-line-faint">
        <div className="mb-3 font-serif text-section font-semibold text-ink">When is a discretion legally unreasonable?</div>
        <p className="text-[15px] leading-[1.75] text-body-soft">
          A discretion may be set aside as legally unreasonable where it lacks an evident and intelligible justification
          <PinpointChip label="Li · Sem 21" targetChunkId="li" onActivate={setFocused} />. The standard reaches outcomes that
          cannot be understood on the material before the decision-maker
          <PinpointChip label="SZVFW · Notes" targetChunkId="szvfw" onActivate={setFocused} />.
        </p>
      </div>
      <div className="bg-panel p-5">
        <SourcePanel sources={SOURCES} focusedChunkId={focused} />
      </div>
    </div>
  );
}
