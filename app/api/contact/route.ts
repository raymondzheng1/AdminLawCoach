import { NextResponse, type NextRequest } from "next/server";
import { ContactRequestSchema } from "@/lib/schemas/api";
import { getClientIp } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { parseBody } from "@/lib/api/route-helpers";
import { sendEmail, escapeHtml, ADMIN_EMAIL } from "@/lib/email";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact form (Harness §16.3). Operator receives the enquiry at ADMIN_NOTIFY_EMAIL
 * with reply-to set to the sender (no sender acknowledgement). Rate-limited to
 * 3/IP/hour (fail-closed §6.4). No content is logged (§6.2).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`contact:${ip}`, 3, 60 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "You’ve sent a few messages already — please try again later." },
      { status: 429 },
    );
  }

  const body = await parseBody(req, ContactRequestSchema);
  if (!body) return NextResponse.json({ error: "invalid_input", message: "Please check the form and try again." }, { status: 400 });

  const { name, email, subject, message } = body;
  const footerHtml = `<hr style="border:none;border-top:1px solid #e7e3d9;margin:16px 0"><p style="color:#8a8577;font-size:12px">Sent via the ${SITE.name} contact form · ${SITE.url}</p>`;
  const footerText = `\n\n— Sent via the ${SITE.name} contact form · ${SITE.url}`;
  const op = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[${SITE.name}] ${subject ?? "Contact enquiry"} — ${name}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>${footerHtml}`,
    text: `From: ${name} <${email}>\n\n${message}${footerText}`,
    replyTo: email,
  });

  if (!op.ok) {
    if (op.error === "resend_unconfigured") {
      return NextResponse.json(
        { error: "unconfigured", message: "The contact form isn’t set up yet. Please email us directly in the meantime." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "send_failed", message: "Something went wrong sending your message. Please try again." }, { status: 502 });
  }

  // No sender acknowledgement — the operator simply receives the enquiry (reply-to the sender).
  return NextResponse.json({ ok: true });
}
