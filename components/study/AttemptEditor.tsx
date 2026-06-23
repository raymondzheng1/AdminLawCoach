"use client";
import { countWords } from "@/lib/exam";

/** Attempt editor: a bordered card with the answer area and a footer row (live word
 *  count + optional submit). Optional exam budget/pace readout. */
export function AttemptEditor({
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel = "Submit for marking",
  disabled,
  budget,
  pace,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  disabled?: boolean;
  budget?: number;
  pace?: "ahead" | "on-track" | "behind";
}) {
  const words = countWords(value);
  const paceColor = pace === "behind" ? "text-warn" : pace === "ahead" ? "text-teal" : "text-navy";
  return (
    <div className="rounded-input border border-line-strong bg-surface">
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Write your answer here — structure it (IRAC for problems; contention → both sides → preferred for essays)."
        aria-label="Your attempt"
        className="block min-h-[160px] w-full resize-y border-0 bg-transparent p-4 text-[15px] leading-[1.7] text-body-soft outline-none placeholder:text-faint"
      />
      <div className="flex items-center justify-between gap-3 border-t border-line-faint bg-panel px-4 py-2.5">
        <span className="text-meta tabular-nums text-faint-2">
          {words} word{words === 1 ? "" : "s"}
          {budget ? ` · ${budget} budget` : ""}
          {pace ? <span className={`ml-1 font-medium ${paceColor}`}>· {pace === "on-track" ? "on track" : pace}</span> : null}
        </span>
        {onSubmit ? (
          <button
            onClick={onSubmit}
            disabled={submitting || !value.trim()}
            className="rounded-input bg-teal px-4 py-2 text-caption font-semibold text-surface transition-colors hover:bg-teal/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {submitting ? "Marking…" : submitLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
