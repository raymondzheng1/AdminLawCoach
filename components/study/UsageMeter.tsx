"use client";
import type { UsageResponse } from "@/lib/client/types";

/** Usage meter (PRD §9). Shows session spend vs the free cap, or "your own key". */
export function UsageMeter({ usage }: { usage: UsageResponse | null }) {
  if (!usage) return null;
  if (usage.byoKey) {
    return <span className="text-[var(--text-caption)] font-medium text-[var(--color-accent)]">Using your own key</span>;
  }
  const pct = Math.min(100, usage.capUsd > 0 ? (usage.spentUsd / usage.capUsd) * 100 : 0);
  const near = pct >= 80;
  return (
    <div className="flex items-center gap-2" title={`Free session usage: $${usage.spentUsd.toFixed(2)} of $${usage.capUsd.toFixed(0)}`}>
      <span className="text-[var(--text-caption)] text-[var(--color-muted)]">Free session</span>
      <span className="h-2 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
        <span
          className="block h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: near ? "var(--color-warn)" : "var(--color-accent)" }}
        />
      </span>
      <span className="text-[var(--text-caption)] tabular-nums text-[var(--color-muted)]">
        ${usage.spentUsd.toFixed(2)}/${usage.capUsd.toFixed(0)}
      </span>
    </div>
  );
}
