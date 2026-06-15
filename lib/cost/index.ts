import { getKv } from "@/lib/kv";
import { usdForUsage, type TokenUsage } from "@/lib/cost/pricing";

/**
 * Cost guard (§6.9) — run BEFORE every model call; meter actual usage AFTER.
 *  - hard US$5 session cap (operator-funded), keyed on the session cookie
 *  - global daily budget kill-switch
 *  - FAILS CLOSED: if the KV store is unavailable in production, deny (§6.4)
 *  - BYO-key bypasses the meter entirely (costs us nothing)
 */
// The operator-funded per-session cap. The Vercel env var is the source of truth;
// this fallback (used only when unset, e.g. local dev) matches the deployed value.
export const SESSION_CAP_USD = Number(process.env.SESSION_CAP_USD ?? "0.5");
export const GLOBAL_DAILY_BUDGET_USD = Number(process.env.GLOBAL_DAILY_BUDGET_USD ?? "50");

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h
const GLOBAL_TTL_SECONDS = 60 * 60 * 48; // 48h (covers UTC date rollover)

// Injectable clock so date-bucketed budget logic is unit-testable (§4.4).
let nowFn: () => number = () => Date.now();
export function __setNowForTests(fn: (() => number) | null): void {
  nowFn = fn ?? (() => Date.now());
}

function spendKey(sessionId: string): string {
  return `spend:${sessionId}`;
}
function globalKey(): string {
  const d = new Date(nowFn()).toISOString().slice(0, 10);
  return `budget:global:${d}`;
}

export type GuardReason = "session_cap" | "global_budget" | "kv_unavailable" | "kv_error";

export interface GuardDecision {
  allowed: boolean;
  bypass: boolean; // true when BYO-key
  reason?: GuardReason;
  sessionSpentUsd: number;
  sessionCapUsd: number;
}

export interface GuardInput {
  sessionId: string;
  byoKey?: boolean;
}

/** Preflight check. Deny (fail-closed) on any KV problem when not using a BYO key. */
export async function checkBudget({ sessionId, byoKey }: GuardInput): Promise<GuardDecision> {
  if (byoKey) {
    return { allowed: true, bypass: true, sessionSpentUsd: 0, sessionCapUsd: SESSION_CAP_USD };
  }
  const kv = getKv();
  if (!kv) {
    return { allowed: false, bypass: false, reason: "kv_unavailable", sessionSpentUsd: 0, sessionCapUsd: SESSION_CAP_USD };
  }
  try {
    const sessionSpent = Number((await kv.get(spendKey(sessionId))) ?? "0");
    if (sessionSpent >= SESSION_CAP_USD) {
      return { allowed: false, bypass: false, reason: "session_cap", sessionSpentUsd: sessionSpent, sessionCapUsd: SESSION_CAP_USD };
    }
    const globalSpent = Number((await kv.get(globalKey())) ?? "0");
    if (globalSpent >= GLOBAL_DAILY_BUDGET_USD) {
      return { allowed: false, bypass: false, reason: "global_budget", sessionSpentUsd: sessionSpent, sessionCapUsd: SESSION_CAP_USD };
    }
    return { allowed: true, bypass: false, sessionSpentUsd: sessionSpent, sessionCapUsd: SESSION_CAP_USD };
  } catch {
    // KV reachable-but-erroring → fail closed (§6.4).
    return { allowed: false, bypass: false, reason: "kv_error", sessionSpentUsd: 0, sessionCapUsd: SESSION_CAP_USD };
  }
}

export interface MeterInput {
  sessionId: string;
  byoKey?: boolean;
  model: string;
  usage: TokenUsage;
}

/** Record actual spend after a model call. No-op for BYO-key (costs us nothing). */
export async function meterUsage({ sessionId, byoKey, model, usage }: MeterInput): Promise<number> {
  if (byoKey) return 0;
  const usd = usdForUsage(model, usage);
  if (usd <= 0) return 0;
  const kv = getKv();
  if (!kv) return usd; // can't persist; guard already blocks new calls when KV is down
  try {
    const newSession = await kv.incrByFloat(spendKey(sessionId), usd);
    await kv.expire(spendKey(sessionId), SESSION_TTL_SECONDS);
    await kv.incrByFloat(globalKey(), usd);
    await kv.expire(globalKey(), GLOBAL_TTL_SECONDS);
    return newSession;
  } catch {
    return usd;
  }
}

export async function getSessionSpend(sessionId: string): Promise<number> {
  const kv = getKv();
  if (!kv) return 0;
  try {
    return Number((await kv.get(spendKey(sessionId))) ?? "0");
  } catch {
    return 0;
  }
}
