import { describe, it, expect } from "vitest";
import { usdForUsage, pricingFor } from "@/lib/cost/pricing";

describe("usdForUsage", () => {
  it("computes USD from per-MTok rates for the default model", () => {
    // sonnet 4.6: $3/MTok in, $15/MTok out
    const usd = usdForUsage("claude-sonnet-4-6", {
      inputTokens: 1_000_000,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    });
    expect(usd).toBeCloseTo(3, 6);
  });

  it("prices cache reads at 0.1x input and writes at 1.25x", () => {
    const usd = usdForUsage("claude-haiku-4-5", {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000, // $0.10
      cacheWriteTokens: 1_000_000, // $1.25
    });
    expect(usd).toBeCloseTo(1.35, 6);
  });

  it("falls back to the most expensive model for an unknown id (over-meter, never under)", () => {
    expect(pricingFor("mystery-model")).toEqual(pricingFor("claude-opus-4-8"));
  });
});
