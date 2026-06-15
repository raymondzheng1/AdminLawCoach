import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/ask/route";
import { MemoryKv, __setKvForTests, __resetKvForTests } from "@/lib/kv";
import { __setRateLimiterForTests } from "@/lib/ratelimit";
import { __setLlmForTests } from "@/lib/generation/llm";
import { listAuthorities, __resetCorpusForTests } from "@/lib/corpus";
import { FakeLlm, NeverCalledLlm, json } from "@/tests/helpers/fakeLlm";

let realAuthority: string;
let realChunkId: string;

beforeAll(() => {
  __resetCorpusForTests();
  const a = listAuthorities().find((x) => x.type === "case" && x.name.length >= 5 && x.locations.length > 0)!;
  realAuthority = a.name;
  realChunkId = a.locations[0]!;
});

beforeEach(() => {
  __setKvForTests(new MemoryKv());
  __setRateLimiterForTests(async () => ({ ok: true, remaining: 99, limit: 100 })); // isolate cost-guard behaviour
});
afterEach(() => {
  __resetKvForTests();
  __setRateLimiterForTests(null);
  __setLlmForTests(null);
});

function ask(question: string, opts: { cookie?: string; byoKey?: string } = {}): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.cookie) headers.set("cookie", opts.cookie);
  if (opts.byoKey) headers.set("x-byo-key", opts.byoKey);
  return new NextRequest("http://localhost/api/ask", { method: "POST", headers, body: json({ question }) });
}

describe("/api/ask — grounded happy path", () => {
  it("returns a verified, sourced answer when the model cites real corpus authority", async () => {
    __setLlmForTests(
      new FakeLlm(() =>
        json({
          notCovered: false,
          answerMarkdown: "Legal unreasonableness is assessed against the statutory purpose.",
          citations: [{ authority: realAuthority, pinpoint: "Notes", chunkId: realChunkId }],
        }),
      ),
    );
    const res = await POST(ask("what is legal unreasonableness"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notCovered).toBe(false);
    expect(data.citations).toHaveLength(1);
    expect(data.sources[0].locationLabel).toBeTruthy();
    expect(data.usage.spentUsd).toBeGreaterThan(0); // metered
  });
});

describe("/api/ask — fabricated authority never reaches the user", () => {
  it("regenerates then falls back to 'not covered' rather than emit an out-of-corpus citation", async () => {
    const fake = new FakeLlm(() =>
      json({
        notCovered: false,
        answerMarkdown: "The decisive authority here is Frobnicator v Wibblesworth.",
        citations: [{ authority: "Frobnicator v Wibblesworth", pinpoint: "Sem 99 s9", chunkId: realChunkId }],
      }),
    );
    __setLlmForTests(fake);
    const res = await POST(ask("what is legal unreasonableness"));
    const data = await res.json();
    expect(data.notCovered).toBe(true);
    expect(data.citations).toHaveLength(0);
    expect(fake.calls.length).toBe(3); // regenerated from clean context up to the cap
    expect(JSON.stringify(data)).not.toContain("Frobnicator");
  });
});

describe("/api/ask — honest not-covered paths", () => {
  it("passes through the model's notCovered decision", async () => {
    const fake = new FakeLlm(() => json({ notCovered: true, answerMarkdown: "", citations: [] }));
    __setLlmForTests(fake);
    const res = await POST(ask("what is legal unreasonableness"));
    const data = await res.json();
    expect(data.notCovered).toBe(true);
    expect(fake.calls.length).toBe(1);
  });

  it("short-circuits to not-covered WITHOUT a model call when retrieval finds nothing", async () => {
    __setLlmForTests(new NeverCalledLlm());
    const res = await POST(ask("zqxwvk plumbus frobnicator wibblesworth nonsensical"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.notCovered).toBe(true);
  });
});

describe("/api/ask — cost guard", () => {
  it("blocks with 402 at the US$5 session cap", async () => {
    const kv = new MemoryKv();
    await kv.set("spend:cappedsession01", 5);
    __setKvForTests(kv);
    const fake = new NeverCalledLlm();
    __setLlmForTests(fake);
    const res = await POST(ask("what is unreasonableness", { cookie: "alc_sid=cappedsession01" }));
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.error).toBe("session_cap");
  });

  it("fails CLOSED with 503 when the KV store is down", async () => {
    __setKvForTests(null);
    __setLlmForTests(new NeverCalledLlm());
    const res = await POST(ask("what is unreasonableness"));
    expect(res.status).toBe(503);
  });

  it("BYO key bypasses the meter even when the store is down", async () => {
    __setKvForTests(null);
    __setLlmForTests(
      new FakeLlm(() =>
        json({
          notCovered: false,
          answerMarkdown: "Grounded answer using the supplied passages about the topic.",
          citations: [{ authority: realAuthority, pinpoint: "Notes", chunkId: realChunkId }],
        }),
      ),
    );
    const res = await POST(ask("what is unreasonableness", { byoKey: "sk-ant-" + "x".repeat(40) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.notCovered).toBe(false);
    expect(data.usage.byoKey).toBe(true);
    expect(data.usage.spentUsd).toBe(0);
  });
});
