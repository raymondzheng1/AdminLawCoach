"use client";

export interface ModeDef {
  id: string;
  label: string;
}

/** Horizontal, scroll-on-mobile tab row (avoids the §14.5 wrap-into-two-rows bug). */
export function ModeSwitcher({ modes, active, onSelect }: { modes: readonly ModeDef[]; active: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Study modes" className="-mx-4 overflow-x-auto px-4">
      <div className="flex min-w-max gap-2 py-1">
        {modes.map((m) => {
          const on = m.id === active;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              aria-current={on ? "page" : undefined}
              className={`min-h-[44px] shrink-0 rounded-full border px-4 text-[14px] font-semibold transition-colors ${
                on
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
