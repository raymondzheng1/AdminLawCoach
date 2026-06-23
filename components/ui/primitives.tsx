import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

type ButtonVariant = "primary" | "teal" | "secondary" | "ghost";

// Crisp, letterpress-feel CTAs (radius 3) — not pill-soft (§ tokens).
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-cta font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";
const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-navy text-surface hover:bg-navy/90",
  teal: "bg-teal text-surface hover:bg-teal/90",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-paper",
  ghost: "text-navy hover:bg-teal-tint",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${BTN_BASE} ${BTN_VARIANTS[variant]} min-h-[44px] px-4 py-2 text-caption ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-surface shadow-card ${className}`}>{children}</div>;
}

export function Spinner({ label = "Working…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-caption text-muted" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-teal" aria-hidden />
      {label}
    </span>
  );
}

// Three distinct role treatments (§ source role badges): RULES solid navy,
// NOTES solid teal, MODEL outline gold (the only outlined badge).
const ROLE_LABEL: Record<string, string> = { rules: "RULES", notes: "NOTES", model: "MODEL" };
const ROLE_STYLE: Record<string, string> = {
  rules: "bg-role-rules text-surface border border-role-rules",
  notes: "bg-role-notes text-surface border border-role-notes",
  model: "bg-surface text-role-model-fg border border-role-model-border",
};
export function RoleBadge({ role }: { role: string }) {
  const key = role in ROLE_LABEL ? role : "model";
  return (
    <span className={`rounded-[3px] px-[6px] py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${ROLE_STYLE[key]}`}>
      {ROLE_LABEL[key]}
    </span>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-input border border-line-strong bg-surface p-3 text-body-soft leading-relaxed outline-none focus:border-teal ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-input border border-line-strong bg-surface px-3 py-2 text-body-soft outline-none focus:border-teal ${className}`}
      {...props}
    />
  );
}

/** "Not covered" — integrity, not error: gold left border, never red, info glyph (§ component). */
export function NotCoveredNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-input border border-line-strong border-l-[3px] border-l-flag bg-flag-bg p-4">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="var(--color-flag-icon)" strokeWidth="1.8" />
        <path d="M12 7.5v5" stroke="var(--color-flag-icon)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.1" fill="var(--color-flag-icon)" />
      </svg>
      <div>
        <div className="mb-0.5 text-caption font-semibold text-flag-fg">Not covered in your materials</div>
        <div className="text-caption leading-[1.55] text-muted">
          {children ?? "The provided course materials don’t address this, so it’s left out rather than guessed. Everything shown is from your course — try rephrasing, or pick a topic."}
        </div>
      </div>
    </div>
  );
}
