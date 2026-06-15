import Anthropic from "@anthropic-ai/sdk";
import type { TokenUsage } from "@/lib/cost/pricing";

/**
 * Thin LLM boundary (§4.4 — the seam the integration tests inject at). The default
 * impl calls Claude server-side; tests inject a fake so no network/key is needed.
 * Returns raw text; the runner parses strict JSON from it (SDK-version-proof, and
 * the structural-repair pass fixes malformed envelopes).
 */
export interface LlmRequest {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  apiKey?: string; // BYO-key override (client-held; never persisted/logged §6.2)
}

export interface LlmResponse {
  text: string;
  usage: TokenUsage;
}

export interface LlmClient {
  complete(req: LlmRequest): Promise<LlmResponse>;
}

export class LlmConfigError extends Error {
  constructor() {
    super("llm_unconfigured");
    this.name = "LlmConfigError";
  }
}

class AnthropicClient implements LlmClient {
  async complete(req: LlmRequest): Promise<LlmResponse> {
    const apiKey = req.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new LlmConfigError();
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: req.model,
      max_tokens: req.maxTokens,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const u = res.usage;
    return {
      text,
      usage: {
        inputTokens: u.input_tokens ?? 0,
        outputTokens: u.output_tokens ?? 0,
        cacheReadTokens: u.cache_read_input_tokens ?? 0,
        cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
      },
    };
  }
}

let injected: LlmClient | null = null;
const defaultClient = new AnthropicClient();

/** Test seam (§4.4): inject a fake LLM so handler tests run with no key/network. */
export function __setLlmForTests(client: LlmClient | null): void {
  injected = client;
}

export function getLlm(): LlmClient {
  return injected ?? defaultClient;
}
