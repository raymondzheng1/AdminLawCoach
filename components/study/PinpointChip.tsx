"use client";

/**
 * Pinpoint chip (§ signature) — a small mono pill placed inline in answer text,
 * immediately after the clause it supports. Default teal-on-tint → teal fill on
 * hover/focus. Rendered as a <button> with an aria-label naming the source; the
 * transparent ::before expands the touch target to ≥44px without disturbing the
 * inline text flow. Click activates the matching source card.
 */
export function PinpointChip({
  label,
  targetChunkId,
  onActivate,
}: {
  label: string;
  targetChunkId: string;
  onActivate: (chunkId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onActivate(targetChunkId)}
      aria-label={`Source: ${label}`}
      className="relative mx-0.5 inline-flex items-center rounded-chip border border-teal-border bg-teal-tint px-2 py-0.5 align-[1px] font-mono text-chip font-semibold leading-none text-teal transition-colors hover:border-teal hover:bg-teal hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal before:absolute before:-inset-x-1 before:-inset-y-[11px] before:content-['']"
    >
      {label}
    </button>
  );
}
