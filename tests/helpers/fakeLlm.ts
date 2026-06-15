import type { LlmClient, LlmRequest, LlmResponse } from "@/lib/generation/llm";
import type { TokenUsage } from "@/lib/cost/pricing";

const SMALL_USAGE: TokenUsage = { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 0, cacheWriteTokens: 0 };

/** A controllable in-memory LLM for handler tests (§4.4) — no network, no key. */
export class FakeLlm implements LlmClient {
  calls: LlmRequest[] = [];
  constructor(private readonly handler: (req: LlmRequest, callIndex: number) => string) {}
  async complete(req: LlmRequest): Promise<LlmResponse> {
    const text = this.handler(req, this.calls.length);
    this.calls.push(req);
    return { text, usage: SMALL_USAGE };
  }
}

/** Fake that throws if ever called — proves a code path short-circuited before the model. */
export class NeverCalledLlm implements LlmClient {
  async complete(): Promise<LlmResponse> {
    throw new Error("LLM should not have been called");
  }
}

export const json = (obj: unknown): string => JSON.stringify(obj);
