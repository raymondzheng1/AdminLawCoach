"use client";

export interface ModeDef {
  id: string;
  label: string;
}

/**
 * 6-mode switcher. A single horizontal row that scrolls on mobile and NEVER wraps
 * (§ non-negotiable). Active tab = navy fill; each tab is a ≥44px touch target.
 */
export function ModeSwitcher({ modes, active, onSelect }: { modes: readonly ModeDef[]; active: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Study modes" className="no-scrollbar flex gap-1.5 overflow-x-auto whitespace-nowrap bg-[#fdfcf8] px-4 py-2.5 sm:gap-1">
      {modes.map((m) => {
        const on = m.id === active;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[44px] shrink-0 items-center rounded-cta px-4 text-caption font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
              on ? "bg-navy text-surface" : "text-muted hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </nav>
  );
}
