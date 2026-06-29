// Shared email helper (Harness §16.2, Variant A — REST via fetch, zero extra deps).
// NB: deliberately NOT importing "server-only" (it makes the module un-importable in
// vitest, §15); server-only by convention — imported only by route handlers.
import { SITE } from "@/lib/site";

const RESEND_API_URL = "https://api.resend.com/emails";

// Defaults to Resend's shared sandbox sender — works with no verified domain and
// delivers to the Resend account owner (ADMIN_NOTIFY_EMAIL). Override for production (§16.1).
export const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? "raymond.zheng@gmail.com";

export interface EmailArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}
export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}
export type EmailSender = (args: EmailArgs) => Promise<EmailResult>;

const realSender: EmailSender = async ({ to, subject, html, text, replyTo }) => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Not configured (e.g. before Resend setup §16.1) — fail soft, never throw, never log content.
    console.warn("[email] RESEND_API_KEY not set — email not sent:", subject);
    return { ok: false, error: "resend_unconfigured" };
  }
  // Show the app name as the sender so the recipient knows it's from this app
  // (unless FROM_EMAIL already carries a display name).
  const from = FROM_EMAIL.includes("<") ? FROM_EMAIL : `${SITE.name} <${FROM_EMAIL}>`;
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) {
      // Never log the full Resend response — may carry delivery metadata treated as PII (§6.2).
      console.error("[email] Resend API error:", res.status);
      return { ok: false, error: `resend_${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    console.error("[email] send failed:", e instanceof Error ? e.message : "unknown");
    return { ok: false, error: "network_error" };
  }
};

let injected: EmailSender | null = null;

/** Test seam (§4.4): inject a fake sender so contact-route tests never hit Resend. */
export function __setEmailSenderForTests(sender: EmailSender | null): void {
  injected = sender;
}

export function sendEmail(args: EmailArgs): Promise<EmailResult> {
  return (injected ?? realSender)(args);
}

/** Escape user-supplied text before interpolating into an HTML email body (no injection). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
