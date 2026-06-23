/** Brand emblem (§): navy rounded square, paper "A" peak, teal cross-beam — the
 *  "sourced/anchored" motif. Source SVG from the design handoff. */
export function Emblem({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="6" fill="#1f3a5f" />
      <path d="M7 19 L13 7 L19 19" fill="none" stroke="#fbfaf7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9.2" y1="14.6" x2="16.8" y2="14.6" stroke="#0f766e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
