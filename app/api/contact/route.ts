import { NextResponse, type NextRequest } from "next/server";
import { ContactRequestSchema } from "@/lib/schemas/api";
import { getClientIp } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { parseBody } from "@/lib/api/route-helpers";
import { sendEmail, escapeHtml, ADMIN_EMAIL } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Contact form (Harness §16.3). Operator receives the enquiry at ADMIN_NOTIFY_EMAIL
 * with reply-to set to the sender; the sender gets an acknowledgement. Rate-limited
 * to 3/IP/hour (fail-closed §6.4). No content is logged (§6.2).
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
  const op = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Contact] ${subject ?? "Enquiry"} — ${name}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    text: `From: ${name} <${email}>\n\n${message}`,
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

  // Acknowledge to the sender — best-effort; don't fail the request if the ack bounces.
  await sendEmail({
    to: email,
    subject: "We’ve received your message",
    html: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for reaching out — we’ll be in touch shortly.</p>`,
    text: `Hi ${name},\n\nThanks for reaching out — we’ll be in touch shortly.`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
