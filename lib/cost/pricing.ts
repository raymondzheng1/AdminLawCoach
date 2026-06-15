/**
 * Per-model token pricing in USD per 1M tokens (from the claude-api reference,
 * 2026-06). Cache write = 1.25× input (5-min TTL), cache read = 0.1× input.
 * Used by the cost meter to convert token usage → USD (§6.9).
 */
export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheWritePerMTok: number;
  cacheReadPerMTok: number;
}

export const PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15, cacheWritePerMTok: 3.75, cacheReadPerMTok: 0.3 },
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5, cacheWritePerMTok: 1.25, cacheReadPerMTok: 0.1 },
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25, cacheWritePerMTok: 6.25, cacheReadPerMTok: 0.5 },
};

/** Conservative fallback for an unknown model id — over-meter rather than under (§6.4 spirit). */
const FALLBACK: ModelPricing = PRICING["claude-opus-4-8"]!;

export interface TokenUsage {
  inputTokens: number; // uncached input (the API's input_tokens is the uncached remainder)
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export function pricingFor(model: string): ModelPricing {
  return PRICING[model] ?? FALLBACK;
}

/** Convert a single call's token usage to USD. */
export function usdForUsage(model: string, usage: TokenUsage): number {
  const p = pricingFor(model);
  const cost =
    (usage.inputTokens * p.inputPerMTok +
      usage.outputTokens * p.outputPerMTok +
      usage.cacheReadTokens * p.cacheReadPerMTok +
      usage.cacheWriteTokens * p.cacheWritePerMTok) /
    1_000_000;
  return Number.isFinite(cost) && cost > 0 ? cost : 0;
}
