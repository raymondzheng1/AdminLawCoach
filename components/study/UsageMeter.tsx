"use client";
import type { UsageResponse } from "@/lib/client/types";

/** Usage meter (§ shell): "Free session" label + an 88×7 spend bar, or "Using your own key". */
export function UsageMeter({ usage }: { usage: UsageResponse | null }) {
  if (!usage) return null;
  if (usage.byoKey) {
    return <span className="text-meta font-medium text-teal">Using your own key</span>;
  }
  const pct = Math.min(100, usage.capUsd > 0 ? (usage.spentUsd / usage.capUsd) * 100 : 0);
  const near = pct >= 80;
  return (
    <div className="flex items-center gap-2" title={`Free session usage: $${usage.spentUsd.toFixed(2)} of $${usage.capUsd.toFixed(2)}`}>
      <span className="text-meta text-faint">Free session</span>
      <span className="h-[7px] w-[88px] overflow-hidden rounded-[4px] bg-line-faint">
        <span
          className="block h-full rounded-[4px] transition-all"
          style={{ width: `${pct}%`, backgroundColor: near ? "var(--color-warn)" : "var(--color-teal)" }}
        />
      </span>
    </div>
  );
}
