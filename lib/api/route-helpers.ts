import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, getClientIp } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { checkBudget, type GuardReason } from "@/lib/cost";
import { getChunk } from "@/lib/corpus";
import type { Citation } from "@/lib/schemas/answer";

const SESSION_MAX_AGE = 60 * 60 * 24;
const BYO_HEADER = "x-byo-key";

export interface RequestContext {
  sessionId: string;
  isNewSession: boolean;
  ip: string;
  apiKey?: string; // BYO key (header only, never logged §6.2)
  byoKey: boolean;
}

export function getRequestContext(req: NextRequest): RequestContext {
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing);
  const sessionId = valid ? existing! : crypto.randomUUID();
  const raw = req.headers.get(BYO_HEADER)?.trim();
  const apiKey = raw && /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : undefined;
  return {
    sessionId,
    isNewSession: !valid,
    ip: getClientIp(req),
    apiKey,
    byoKey: Boolean(apiKey),
  };
}

/** Build a JSON response, setting the session cookie when one was just minted. */
export function jsonResponse(
  body: unknown,
  ctx: RequestContext,
  init?: { status?: number },
): NextResponse {
  const res = NextResponse.json(body, { status: init?.status ?? 200 });
  if (ctx.isNewSession) {
    res.cookies.set(SESSION_COOKIE, ctx.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }
  return res;
}

const GUARD_COPY: Record<GuardReason, { status: number; message: string }> = {
  session_cap: {
    status: 402,
    message: "You've reached the free study allowance for this session. Add your own key to keep going, or come back in a new session.",
  },
  global_budget: {
    status: 402,
    message: "The free daily allowance has been reached. Please try again tomorrow, or add your own key to continue now.",
  },
  kv_unavailable: { status: 503, message: "The study service is temporarily unavailable. Please try again shortly." },
  kv_error: { status: 503, message: "The study service is temporarily unavailable. Please try again shortly." },
};

export type GuardBlock = { blocked: true; response: NextResponse };
export type GuardPass = { blocked: false };

/**
 * Shared preflight for every model-backed route: per-IP rate limit (fail-closed)
 * then the cost guard (fail-closed, BYO-key bypasses). Returns a ready response
 * when blocked, so the route just early-returns it.
 */
export async function preflight(
  ctx: RequestContext,
  opts: { ipLimit?: number; ipWindowSec?: number } = {},
): Promise<GuardBlock | GuardPass> {
  const rl = await rateLimit(`ip:${ctx.ip}`, opts.ipLimit ?? 30, opts.ipWindowSec ?? 60);
  if (!rl.ok) {
    return {
      blocked: true,
      response: jsonResponse(
        { error: "rate_limited", message: "Too many requests — please slow down for a moment." },
        ctx,
        { status: 429 },
      ),
    };
  }
  const decision = await checkBudget({ sessionId: ctx.sessionId, byoKey: ctx.byoKey });
  if (!decision.allowed) {
    const copy = decision.reason ? GUARD_COPY[decision.reason] : GUARD_COPY.kv_error;
    return {
      blocked: true,
      response: jsonResponse(
        {
          error: decision.reason ?? "blocked",
          message: copy.message,
          capUsd: decision.sessionCapUsd,
          spentUsd: Number(decision.sessionSpentUsd.toFixed(4)),
        },
        ctx,
        { status: copy.status },
      ),
    };
  }
  return { blocked: false };
}

export interface SourceRef {
  authority: string;
  pinpoint: string;
  chunkId: string;
  quote?: string;
  locationLabel: string;
  role: string;
  excerpt: string;
}

/** Resolve verified citations to displayable source passages for the trust panel (PRD §9). */
export function resolveSources(citations: Citation[]): SourceRef[] {
  return citations.map((c) => {
    const chunk = getChunk(c.chunkId);
    return {
      authority: c.authority,
      pinpoint: c.pinpoint,
      chunkId: c.chunkId,
      quote: c.quote,
      locationLabel: chunk?.locationLabel ?? "(unknown location)",
      role: chunk?.role ?? "unknown",
      excerpt: chunk ? chunk.text.slice(0, 600) : "",
    };
  });
}

/** Read + Zod-parse a JSON body; returns null on any malformed input. */
export async function parseBody<T>(req: NextRequest, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }): Promise<T | null> {
  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
