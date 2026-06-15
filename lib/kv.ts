// NB: deliberately NOT importing "server-only" — that makes the module un-importable
// in vitest (§15). These modules are server-only by convention (imported only by route
// handlers); pinned by tests/unit/conventions/server-only.test.ts.
import { Redis } from "@upstash/redis";

/**
 * Minimal KV surface used by the cost meter + rate limiter. Backed by Upstash
 * Redis in production; an in-memory impl in dev/test. The cost guard FAILS CLOSED
 * when no store is configured in production (§6.4) — getKv() returns null there.
 */
export interface Kv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | number, opts?: { ex?: number }): Promise<void>;
  incrByFloat(key: string, by: number): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

/**
 * Accept EITHER the Upstash names OR the Vercel-Marketplace KV_* names (§15 gotcha:
 * the Marketplace injects KV_REST_API_URL/TOKEN, not the legacy UPSTASH_* pair).
 */
export function readUpstashEnv(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

class UpstashKv implements Kv {
  constructor(private readonly redis: Redis) {}
  async get(key: string) {
    const v = await this.redis.get<string | number | null>(key);
    return v === null || v === undefined ? null : String(v);
  }
  async set(key: string, value: string | number, opts?: { ex?: number }) {
    await this.redis.set(key, value, opts?.ex ? { ex: opts.ex } : undefined);
  }
  async incrByFloat(key: string, by: number) {
    return this.redis.incrbyfloat(key, by);
  }
  async incr(key: string) {
    return this.redis.incr(key);
  }
  async expire(key: string, seconds: number) {
    await this.redis.expire(key, seconds);
  }
}

/** In-memory KV for local dev + the Tier-B integration tests (§4.4). */
export class MemoryKv implements Kv {
  private store = new Map<string, { value: string; expiresAt: number | null }>();
  private fresh(key: string) {
    const e = this.store.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && e.expiresAt <= this.now()) {
      this.store.delete(key);
      return null;
    }
    return e;
  }
  // Overridable clock so expiry is testable without real time.
  now(): number {
    return globalThis.__ADMINLAW_FAKE_NOW__ ?? 1_700_000_000_000;
  }
  async get(key: string) {
    return this.fresh(key)?.value ?? null;
  }
  async set(key: string, value: string | number, opts?: { ex?: number }) {
    this.store.set(key, {
      value: String(value),
      expiresAt: opts?.ex ? this.now() + opts.ex * 1000 : null,
    });
  }
  async incrByFloat(key: string, by: number) {
    const cur = Number(this.fresh(key)?.value ?? "0");
    const next = cur + by;
    const prev = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: prev?.expiresAt ?? null });
    return next;
  }
  async incr(key: string) {
    return this.incrByFloat(key, 1);
  }
  async expire(key: string, seconds: number) {
    const e = this.store.get(key);
    if (e) e.expiresAt = this.now() + seconds * 1000;
  }
}

declare global {
  var __ADMINLAW_FAKE_NOW__: number | undefined;
}

let injected: Kv | null | undefined;
let devMemoryKv: MemoryKv | null = null;

/**
 * Resolve the KV. Returns null ONLY in production with no store configured, which
 * the cost guard treats as "fail closed". In dev/test, falls back to a process-wide
 * MemoryKv so the app runs before Upstash is provisioned (§4.4).
 */
export function getKv(): Kv | null {
  if (injected !== undefined) return injected;
  const env = readUpstashEnv();
  if (env) return new UpstashKv(new Redis({ url: env.url, token: env.token }));
  if (process.env.NODE_ENV === "production") return null; // fail-closed
  if (!devMemoryKv) devMemoryKv = new MemoryKv();
  return devMemoryKv;
}

export function isKvConfigured(): boolean {
  return injected != null || readUpstashEnv() !== null;
}

/** Test seam (§4.4): inject an in-memory KV, or null to simulate a down store. */
export function __setKvForTests(kv: Kv | null): void {
  injected = kv;
}
export function __resetKvForTests(): void {
  injected = undefined;
  devMemoryKv = null;
}
