import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readUpstashEnv } from "@/lib/kv";

/**
 * §15 platform gotcha: the Vercel Marketplace injects KV_REST_API_URL/TOKEN, NOT the
 * legacy UPSTASH_REDIS_REST_URL/TOKEN. Code reading only the legacy names sees undefined
 * and (per §6.4) fails closed silently. readUpstashEnv() must accept EITHER pair — pinned here.
 */
const VARS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const v of VARS) {
    saved[v] = process.env[v];
    delete process.env[v];
  }
});
afterEach(() => {
  for (const v of VARS) {
    if (saved[v] === undefined) delete process.env[v];
    else process.env[v] = saved[v];
  }
});

describe("readUpstashEnv — accepts either KV env-name pair (§15)", () => {
  it("reads the legacy UPSTASH_REDIS_REST_* pair", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://up.example.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "up-token";
    expect(readUpstashEnv()).toEqual({ url: "https://up.example.io", token: "up-token" });
  });

  it("reads the Marketplace KV_REST_API_* pair", () => {
    process.env.KV_REST_API_URL = "https://kv.example.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
    expect(readUpstashEnv()).toEqual({ url: "https://kv.example.io", token: "kv-token" });
  });

  it("prefers the UPSTASH_* pair when both are present", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://up.example.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "up-token";
    process.env.KV_REST_API_URL = "https://kv.example.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
    expect(readUpstashEnv()?.url).toBe("https://up.example.io");
  });

  it("returns null when neither pair is set (→ cost guard fails closed, §6.4)", () => {
    expect(readUpstashEnv()).toBeNull();
  });
});
