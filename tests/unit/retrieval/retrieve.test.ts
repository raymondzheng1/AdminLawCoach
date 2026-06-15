import { describe, it, expect, beforeAll } from "vitest";
import { retrieve, retrieveForTopic } from "@/lib/retrieval";
import { __resetCorpusForTests } from "@/lib/corpus";

beforeAll(() => __resetCorpusForTests());

describe("BM25-lite retrieval", () => {
  it("returns relevant chunks for a real course query", () => {
    const r = retrieve("what is the test for legal unreasonableness");
    expect(r.chunks.length).toBeGreaterThan(0);
    const joined = r.chunks.map((c) => c.text.toLowerCase()).join(" ");
    expect(joined).toContain("unreasonable");
  });

  it("respects the token/char budget and chunk cap", () => {
    const r = retrieve("jurisdiction standing remedies grounds unreasonableness bias", {
      budgetChars: 4000,
      maxChunks: 3,
    });
    expect(r.chunks.length).toBeLessThanOrEqual(3);
    expect(r.totalChars).toBeLessThanOrEqual(4000 + r.chunks[0]!.text.length);
  });

  it("returns nothing for an out-of-corpus gibberish query (drives the 'not covered' path)", () => {
    const r = retrieve("zqxwvk plumbus frobnicator wibblesworth nonsensical");
    expect(r.chunks.length).toBe(0);
  });

  it("boosts a topic's own chunks when retrieving for a topic", () => {
    const r = retrieveForTopic("mr-correct-preferable");
    expect(r.chunks.length).toBeGreaterThan(0);
  });
});
