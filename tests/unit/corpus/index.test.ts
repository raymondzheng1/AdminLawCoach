import { describe, it, expect } from "vitest";
import rawIndex from "@/corpus/index.json";
import { CorpusIndexSchema } from "@/lib/schemas/corpus";
import {
  getCorpus,
  corpusContainsNormalised,
  findChunkIdsForNormalised,
  listAuthorities,
  listTaxonomy,
  __resetCorpusForTests,
} from "@/lib/corpus";
import { normalizeForMatch } from "@/lib/corpus/patterns.mjs";

describe("committed corpus/index.json", () => {
  it("parses against the Zod schema", () => {
    expect(() => CorpusIndexSchema.parse(rawIndex)).not.toThrow();
  });

  it("has every authority/pinpoint/taxonomy location resolving to a real chunk", () => {
    const ix = CorpusIndexSchema.parse(rawIndex);
    const ids = new Set(ix.chunks.map((c) => c.id));
    for (const a of ix.authorities) for (const loc of a.locations) expect(ids.has(loc)).toBe(true);
    for (const p of ix.pinpoints) for (const loc of p.locations) expect(ids.has(loc)).toBe(true);
    for (const t of ix.taxonomy) for (const loc of t.locations) expect(ids.has(loc)).toBe(true);
  });

  it("covers the core admin-law grounds in its taxonomy", () => {
    __resetCorpusForTests();
    const ids = listTaxonomy().map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining(["unreasonableness", "procedural-fairness-hearing", "mr-correct-preferable"]),
    );
  });

  it("surfaces real cases in its authority list", () => {
    expect(listAuthorities().length).toBeGreaterThan(50);
  });
});

describe("grounding membership (the verifier anchor)", () => {
  it("confirms an in-corpus authority and rejects a fabricated one", () => {
    __resetCorpusForTests();
    // 'Kirk' and 'unreasonableness' are core to this course's corpus.
    expect(corpusContainsNormalised(normalizeForMatch("Kirk"))).toBe(true);
    expect(corpusContainsNormalised(normalizeForMatch("unreasonableness"))).toBe(true);
    // A plainly invented authority must NOT be found.
    expect(corpusContainsNormalised(normalizeForMatch("Frobnicator v Wibblesworth"))).toBe(false);
  });

  it("binds an in-corpus phrase to at least one chunk location", () => {
    const ids = findChunkIdsForNormalised(normalizeForMatch("unreasonableness"));
    expect(ids.length).toBeGreaterThan(0);
    const chunkIds = new Set(getCorpus().index.chunks.map((c) => c.id));
    for (const id of ids) expect(chunkIds.has(id)).toBe(true);
  });
});
