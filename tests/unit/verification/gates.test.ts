import { describe, it, expect, beforeAll } from "vitest";
import { verifyGroundedAnswer, verifyFeedback } from "@/lib/verification";
import { getCorpus, listAuthorities, __resetCorpusForTests } from "@/lib/corpus";
import type { GroundedAnswer, Feedback } from "@/lib/schemas/answer";

let realAuthority: string;
let realChunkId: string;
let otherChunkId: string;

beforeAll(() => {
  __resetCorpusForTests();
  const auth = listAuthorities().find((a) => a.type === "case" && a.name.length >= 5 && a.locations.length > 0)!;
  realAuthority = auth.name;
  realChunkId = auth.locations[0]!;
  // A chunk that does NOT contain this authority (for the rebind test).
  otherChunkId = getCorpus().index.chunks.find((c) => !auth.locations.includes(c.id))!.id;
});

const askAnswer = (over: Partial<GroundedAnswer> = {}): GroundedAnswer => ({
  notCovered: false,
  answerMarkdown: "This is a sufficiently long grounded answer about the test.",
  citations: [{ authority: realAuthority, pinpoint: "Notes", chunkId: realChunkId }],
  ...over,
});

describe("citation-allowlist gate", () => {
  it("REJECTS an answer citing an authority not in the corpus (the core invariant)", () => {
    const r = verifyGroundedAnswer(
      askAnswer({ citations: [{ authority: "Frobnicator v Wibblesworth", pinpoint: "Sem 99 s9", chunkId: realChunkId }] }),
      { mode: "ask", contextChunkIds: [realChunkId] },
    );
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.gate === "citation")).toBe(true);
  });

  it("ACCEPTS an answer whose authority is in the corpus and bound to a real chunk", () => {
    const r = verifyGroundedAnswer(askAnswer(), { mode: "ask", contextChunkIds: [realChunkId] });
    expect(r.ok).toBe(true);
    expect(r.failures).toHaveLength(0);
  });
});

describe("pinpoint-binding gate", () => {
  it("rebinds a citation whose chunkId does not actually contain the authority", () => {
    const r = verifyGroundedAnswer(askAnswer({ citations: [{ authority: realAuthority, pinpoint: "x", chunkId: otherChunkId }] }), {
      mode: "ask",
      contextChunkIds: [realChunkId],
    });
    expect(r.ok).toBe(true);
    expect(r.answer.citations[0]!.chunkId).not.toBe(otherChunkId); // rebound to a chunk that holds it
  });

  it("rejects a grounded answer with no citations", () => {
    const r = verifyGroundedAnswer(askAnswer({ citations: [] }), { mode: "ask", contextChunkIds: [realChunkId] });
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.gate === "citation")).toBe(true);
  });
});

describe("structure gate", () => {
  it("requires IRAC markers for a hypo model answer", () => {
    const r = verifyGroundedAnswer(askAnswer({ answerMarkdown: "Some prose with no structure at all." }), {
      mode: "hypo",
      contextChunkIds: [realChunkId],
    });
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.gate === "structure")).toBe(true);
  });

  it("accepts a hypo answer that has Issue/Rule/Application/Conclusion", () => {
    const r = verifyGroundedAnswer(
      askAnswer({
        answerMarkdown: "Issue: jurisdiction. Rule: the test. Application: applying it here. Conclusion: it follows.",
      }),
      { mode: "hypo", contextChunkIds: [realChunkId] },
    );
    expect(r.ok).toBe(true);
  });
});

describe("jurisdiction gate", () => {
  it("rejects an out-of-jurisdiction (foreign-court) authority in the prose", () => {
    const r = verifyGroundedAnswer(askAnswer({ answerMarkdown: "Relying on R v Howe [1987] UKHL 1 here for the point." }), {
      mode: "ask",
      contextChunkIds: [realChunkId],
    });
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.gate === "jurisdiction")).toBe(true);
  });
});

describe("not-covered fallback", () => {
  it("is always valid output and carries no citations", () => {
    const r = verifyGroundedAnswer({ notCovered: true, answerMarkdown: "", citations: [{ authority: "x", pinpoint: "y", chunkId: "z" }] }, {
      mode: "ask",
      contextChunkIds: [],
    });
    expect(r.ok).toBe(true);
    expect(r.answer.citations).toHaveLength(0);
  });
});

describe("feedback verification", () => {
  it("rejects feedback whose OWN citation is not in the corpus", () => {
    const fb: Feedback = {
      notCovered: false,
      issuesSpotted: [],
      issuesMissed: [],
      structureComments: "",
      authorityUse: { ok: true, notes: "", flagged: [] },
      applicationDepth: "",
      rubricScore: 60,
      actions: ["a", "b", "c"],
      citations: [{ authority: "Made Up v Nobody", pinpoint: "Sem 1 s1", chunkId: realChunkId }],
    };
    const r = verifyFeedback(fb);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.gate === "citation")).toBe(true);
  });
});
