"use client";
import { useState } from "react";
import { RoleBadge } from "@/components/ui/primitives";
import type { SourceRef } from "@/lib/client/types";

/** The trust surface (PRD §9): the corpus passages behind the current answer. */
export function SourcePanel({ sources, focusedChunkId }: { sources: SourceRef[]; focusedChunkId?: string }) {
  return (
    <aside aria-label="Sources" className="flex flex-col gap-3">
      <h2 className="text-[var(--text-small)] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Sources behind this answer
      </h2>
      {sources.length === 0 ? (
        <p className="text-[var(--text-small)] text-[var(--color-muted)]">
          Every answer is pinpointed to your course materials. The exact passages appear here once you ask something.
        </p>
      ) : (
        sources.map((s, i) => <SourceItem key={`${s.chunkId}-${i}`} source={s} highlighted={s.chunkId === focusedChunkId} />)
      )}
    </aside>
  );
}

function SourceItem({ source, highlighted }: { source: SourceRef; highlighted: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      id={`src-${source.chunkId}`}
      className={`card p-3 transition-colors ${highlighted ? "ring-2 ring-[var(--color-accent)]" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={source.role} />
        <span className="font-medium">{source.authority}</span>
        <span className="pinpoint-chip">{source.pinpoint}</span>
      </div>
      <p className="mt-1 text-[var(--text-caption)] text-[var(--color-muted)]">{source.locationLabel}</p>
      {source.quote ? <p className="mt-2 border-l-2 border-[var(--color-accent)] pl-3 text-[14px] italic">“{source.quote}”</p> : null}
      {source.excerpt ? (
        <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[var(--text-caption)] font-medium text-[var(--color-accent)]">
          {open ? "Hide passage" : "Show passage"}
        </button>
      ) : null}
      {open ? <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[14px] text-[var(--color-ink)]">{source.excerpt}</p> : null}
    </div>
  );
}
