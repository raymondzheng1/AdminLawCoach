import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";
const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90",
  secondary: "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-paper)]",
  ghost: "text-[var(--color-primary)] hover:bg-[var(--color-accent-soft)]",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={`${BTN_BASE} ${BTN_VARIANTS[variant]} min-h-[44px] px-4 py-2 text-sm ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function Spinner({ label = "Working…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[var(--text-small)] text-[var(--color-muted)]" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" aria-hidden />
      {label}
    </span>
  );
}

const ROLE_STYLE: Record<string, string> = {
  rules: "bg-[#eef2f7] text-[var(--color-primary)] border-[#cdd9e6]",
  notes: "bg-[#fdf3e7] text-[var(--color-warn)] border-[#efd9b8]",
  model: "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[#bfe0da]",
};
export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${ROLE_STYLE[role] ?? "bg-[var(--color-paper)] text-[var(--color-muted)] border-[var(--color-border)]"}`}
    >
      {role}
    </span>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[15px] leading-relaxed outline-none focus:border-[var(--color-accent)] ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px] outline-none focus:border-[var(--color-accent)] ${className}`}
      {...props}
    />
  );
}

export function NotCoveredNotice() {
  return (
    <div className="rounded-lg border border-[#efd9b8] bg-[#fdf3e7] p-4 text-[15px] text-[var(--color-warn)]">
      <strong>Not covered.</strong> The provided course materials don&rsquo;t address this. Nothing outside your materials is
      ever introduced — try rephrasing, or pick a topic from the list.
    </div>
  );
}
