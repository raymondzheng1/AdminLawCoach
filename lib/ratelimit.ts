import { getKv } from "@/lib/kv";

/**
 * Fixed-window per-key rate limiter (§6.4). FAILS CLOSED when the KV store is
 * unavailable in production — a missing guardrail denies, never allows.
 */
export interface RateResult {
  ok: boolean;
  remaining: number;
  limit: number;
}

type Limiter = (key: string, limit: number, windowSeconds: number) => Promise<RateResult>;

const kvLimiter: Limiter = async (key, limit, windowSeconds) => {
  const kv = getKv();
  if (!kv) return { ok: false, remaining: 0, limit }; // fail-closed
  try {
    const rkey = `rl:${key}`;
    const count = await kv.incr(rkey);
    if (count === 1) await kv.expire(rkey, windowSeconds);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), limit };
  } catch {
    return { ok: false, remaining: 0, limit }; // fail-closed on KV error
  }
};

let injected: Limiter | null = null;

/** Test seam (§4.4): inject a limiter (e.g. always-allow, or counting). */
export function __setRateLimiterForTests(fn: Limiter | null): void {
  injected = fn;
}

export function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateResult> {
  return (injected ?? kvLimiter)(key, limit, windowSeconds);
}
