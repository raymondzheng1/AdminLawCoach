"use client";
import type { SubmitError } from "@/components/study/useSubmit";

/**
 * Calm error states (§ States) — never alarm-red; styled like the gold "flag"
 * notice. Three shapes: free-allowance reached (→ Use your own key), temporarily
 * unavailable (→ retry), and a generic fallback (→ retry).
 */
export function ErrorState({ error, onRetry, onUseKey }: { error: SubmitError; onRetry?: () => void; onUseKey?: () => void }) {
  const allowance = error.code === "session_cap" || error.code === "global_budget" || error.status === 402;
  const unavailable =
    error.status === 503 || error.status === 429 || error.code === "kv_unavailable" || error.code === "kv_error" || error.code === "service_unavailable" || error.code === "rate_limited";

  const heading = allowance ? "Free study allowance reached" : unavailable ? "Just a moment" : "Something went wrong";
  const body = allowance
    ? "You’ve used this session’s free study allowance. Add your own key to keep going — it stays in your browser and is never stored on our servers."
    : error.message;

  return (
    <div className="flex gap-3 rounded-input border border-line-strong border-l-[3px] border-l-flag bg-flag-bg p-4" role="alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--color-flag-icon)" strokeWidth="1.8" />
        <path d="M12 7.5v5" stroke="var(--color-flag-icon)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.1" fill="var(--color-flag-icon)" />
      </svg>
      <div>
        <div className="mb-0.5 text-caption font-semibold text-flag-fg">{heading}</div>
        <div className="text-caption leading-[1.55] text-muted">{body}</div>
        <div className="mt-2.5 flex gap-2">
          {allowance && onUseKey ? (
            <button
              onClick={onUseKey}
              className="rounded-cta bg-navy px-3.5 py-2 text-meta font-semibold text-surface transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Use your own key
            </button>
          ) : null}
          {!allowance && onRetry ? (
            <button
              onClick={onRetry}
              className="rounded-cta border border-line-strong bg-surface px-3.5 py-2 text-meta font-semibold text-navy transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
