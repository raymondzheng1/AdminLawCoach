"use client";
import { useEffect, useRef } from "react";
import { RoleBadge } from "@/components/ui/primitives";
import type { SourceRef } from "@/lib/client/types";

/**
 * The trust surface (§ signature). Cards carry a role badge + pinpoint, the
 * authority (serif), a location label, and an expandable passage. The card whose
 * chunk matches `focusedChunkId` lifts with a 2px teal ring and scrolls into view
 * (within the panel if it scrolls, else into the viewport). One highlight per panel.
 */
export function SourcePanel({ sources, focusedChunkId }: { sources: SourceRef[]; focusedChunkId?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusedChunkId) return;
    const el = document.getElementById(`src-${focusedChunkId}`);
    const panel = scrollRef.current;
    if (!el) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    if (panel && panel.scrollHeight > panel.clientHeight) {
      panel.scrollTo({ top: el.offsetTop - panel.offsetTop - 14, behavior });
    } else {
      el.scrollIntoView({ behavior, block: "center" });
    }
  }, [focusedChunkId]);

  return (
    <aside aria-label="Sources" className="rounded-card bg-panel p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-section font-semibold text-ink">Sources</h2>
        {sources.length > 0 ? (
          <span className="text-meta text-faint-2">
            {sources.length} {sources.length === 1 ? "passage" : "passages"}
          </span>
        ) : null}
      </div>

      {sources.length === 0 ? (
        <p className="text-caption leading-[1.55] text-muted">
          Every answer is pinpointed to your course materials — the exact passages appear here. Sources are tagged{" "}
          <span className="font-mono text-[11px] text-navy">RULES</span> (cases &amp; legislation),{" "}
          <span className="font-mono text-[11px] text-teal">NOTES</span> (your unit), and{" "}
          <span className="font-mono text-[11px] text-role-model-fg">MODEL</span> (worked answers).
        </p>
      ) : (
        <div ref={scrollRef} className="space-y-3 lg:max-h-[560px] lg:overflow-auto">
          {sources.map((s, i) => (
            <SourceCard key={`${s.chunkId}-${i}`} source={s} selected={s.chunkId === focusedChunkId} />
          ))}
        </div>
      )}
    </aside>
  );
}

function SourceCard({ source, selected }: { source: SourceRef; selected: boolean }) {
  const passage = source.quote || source.excerpt;
  return (
    <div
      id={`src-${source.chunkId}`}
      className={`rounded-card border border-line bg-surface p-4 transition-[box-shadow,border-color,transform] duration-200 ${selected ? "src-selected" : ""}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <RoleBadge role={source.role} />
        <span className="font-mono text-[11px] font-semibold text-teal">{source.pinpoint}</span>
      </div>
      <div className="font-serif text-section font-semibold leading-[1.3] text-ink">{source.authority}</div>
      <div className="text-meta text-faint">{source.locationLabel}</div>
      {passage ? (
        <p className="mt-2.5 border-t border-line-quote pt-2.5 text-[13.5px] leading-[1.65] text-quote">
          {source.quote ? `“${passage}”` : `${passage.slice(0, 240)}${passage.length > 240 ? "…" : ""}`}
        </p>
      ) : null}
    </div>
  );
}
