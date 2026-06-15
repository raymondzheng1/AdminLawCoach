import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryKv, __setKvForTests, __resetKvForTests } from "@/lib/kv";
import { checkBudget, meterUsage, getSessionSpend, SESSION_CAP_USD } from "@/lib/cost";

beforeEach(() => __resetKvForTests());
afterEach(() => __resetKvForTests());

describe("cost guard — checkBudget", () => {
  it("BYO key bypasses the meter entirely", async () => {
    __setKvForTests(null); // even with no store, BYO is allowed
    const d = await checkBudget({ sessionId: "s1", byoKey: true });
    expect(d.allowed).toBe(true);
    expect(d.bypass).toBe(true);
  });

  it("fails CLOSED when the KV store is unavailable (§6.4)", async () => {
    __setKvForTests(null);
    const d = await checkBudget({ sessionId: "s1" });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("kv_unavailable");
  });

  it("fails CLOSED when the KV store throws", async () => {
    __setKvForTests({
      get: async () => {
        throw new Error("boom");
      },
      set: async () => {},
      incr: async () => 1,
      incrByFloat: async () => 1,
      expire: async () => {},
    });
    const d = await checkBudget({ sessionId: "s1" });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("kv_error");
  });

  it("allows under the cap and blocks at the US$5 session cap", async () => {
    const kv = new MemoryKv();
    __setKvForTests(kv);
    const ok = await checkBudget({ sessionId: "s2" });
    expect(ok.allowed).toBe(true);

    await kv.set("spend:s2", SESSION_CAP_USD); // simulate spend reaching the cap
    const blocked = await checkBudget({ sessionId: "s2" });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("session_cap");
  });
});

describe("cost guard — meterUsage", () => {
  it("increments session spend and is readable", async () => {
    const kv = new MemoryKv();
    __setKvForTests(kv);
    await meterUsage({
      sessionId: "s3",
      model: "claude-sonnet-4-6",
      usage: { inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
    });
    expect(await getSessionSpend("s3")).toBeCloseTo(3, 6);
  });

  it("does not meter BYO-key usage (costs us nothing)", async () => {
    const kv = new MemoryKv();
    __setKvForTests(kv);
    await meterUsage({
      sessionId: "s4",
      byoKey: true,
      model: "claude-opus-4-8",
      usage: { inputTokens: 5_000_000, outputTokens: 5_000_000, cacheReadTokens: 0, cacheWriteTokens: 0 },
    });
    expect(await getSessionSpend("s4")).toBe(0);
  });
});
