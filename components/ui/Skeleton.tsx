/** Loading skeletons (§ States): calm shimmer, not a frozen spinner. */
export function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Placeholder for a grounded answer while it composes (~10–30s). */
export function AnswerSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <Shimmer className="mb-3 h-3 w-16 rounded-[3px]" />
      <div className="space-y-2.5">
        <Shimmer className="h-4 w-full rounded-[3px]" />
        <Shimmer className="h-4 w-[96%] rounded-[3px]" />
        <Shimmer className="h-4 w-[88%] rounded-[3px]" />
        <Shimmer className="h-4 w-[70%] rounded-[3px]" />
        <Shimmer className="mt-4 h-4 w-full rounded-[3px]" />
        <Shimmer className="h-4 w-[82%] rounded-[3px]" />
      </div>
      <span className="sr-only">Composing your answer…</span>
    </div>
  );
}

/** Placeholder source cards while passages resolve. */
export function SourceSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border border-line bg-surface p-4">
          <Shimmer className="mb-2 h-3 w-24 rounded-[3px]" />
          <Shimmer className="mb-2 h-4 w-2/3 rounded-[3px]" />
          <Shimmer className="h-12 w-full rounded-[3px]" />
        </div>
      ))}
    </div>
  );
}
