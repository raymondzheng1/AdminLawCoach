import type { NextRequest, NextResponse } from "next/server";

/**
 * No-login identity for spend metering only (§6.1, PRD §6.1). A random session id
 * lives in an httpOnly cookie; it is NOT a user account and carries no PII.
 */
export const SESSION_COOKIE = "alc_sid";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h, matches the KV spend TTL

export function getOrCreateSessionId(req: NextRequest, res: NextResponse): string {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) return existing;
  const id = crypto.randomUUID();
  res.cookies.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return id;
}

/** Best-effort client IP for per-IP rate limiting (never stored, never logged with content). */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
