"use client";
import { Textarea } from "@/components/ui/primitives";
import { countWords } from "@/lib/exam";

/** Attempt editor with a live word count; optional exam budget/pace readout. */
export function AttemptEditor({
  value,
  onChange,
  disabled,
  budget,
  pace,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  budget?: number;
  pace?: "ahead" | "on-track" | "behind";
}) {
  const words = countWords(value);
  const paceColor =
    pace === "behind" ? "text-[var(--color-warn)]" : pace === "ahead" ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]";
  return (
    <div>
      <Textarea
        rows={12}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Write your answer here. Structure it (IRAC for problems; contention → both sides → preferred for essays)."
        aria-label="Your attempt"
      />
      <div className="mt-1 flex items-center justify-between text-[var(--text-caption)] text-[var(--color-muted)]">
        <span className="tabular-nums">
          {words} word{words === 1 ? "" : "s"}
          {budget ? ` / ${budget} budget` : ""}
        </span>
        {pace ? <span className={`font-medium ${paceColor}`}>{pace === "on-track" ? "on track" : pace}</span> : null}
      </div>
    </div>
  );
}
