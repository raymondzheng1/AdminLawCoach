import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

// Every model-backed route MUST run the cost guard before spending, and route its
// output through the verifier. Add a route here when you create one — the test fails
// until it complies.
const MODEL_ROUTES = [
  "app/api/ask/route.ts",
  "app/api/explain/route.ts",
  "app/api/generate/answer/route.ts",
  "app/api/generate/question/route.ts",
  "app/api/feedback/route.ts",
];

describe("drift: cost guard on every model-backed route (§6.9)", () => {
  for (const route of MODEL_ROUTES) {
    it(`${route} runs the cost guard (preflight / handleGroundedRequest)`, () => {
      const src = read(route);
      const guarded = src.includes("handleGroundedRequest") || src.includes("preflight");
      expect(guarded).toBe(true);
    });
  }
});

describe("drift: grounded output is verified (§7, §11.2)", () => {
  it("the generation runner routes grounded output through the verifier", () => {
    const runner = read("lib/generation/runner.ts");
    expect(runner.includes("verifyGroundedAnswer")).toBe(true);
    expect(runner.includes("verifyFeedback")).toBe(true);
  });

  it("grounded routes go through the runner (which verifies)", () => {
    expect(read("lib/api/grounded.ts").includes("runGrounded")).toBe(true);
    expect(read("app/api/feedback/route.ts").includes("runFeedback")).toBe(true);
  });
});

describe("drift: no `server-only` import in libs the tests touch (§15)", () => {
  const TEST_TOUCHED_LIBS = [
    "lib/kv.ts",
    "lib/cost/index.ts",
    "lib/cost/pricing.ts",
    "lib/ratelimit.ts",
    "lib/generation/llm.ts",
    "lib/generation/runner.ts",
    "lib/verification/index.ts",
    "lib/retrieval/index.ts",
    "lib/corpus/index.ts",
  ];
  for (const lib of TEST_TOUCHED_LIBS) {
    it(`${lib} does not import "server-only"`, () => {
      expect(/import\s+["']server-only["']/.test(read(lib))).toBe(false);
    });
  }
});

describe("drift: generation prompts carry the grounding contract (§4.2)", () => {
  it("prompts.ts states the hard-no rule + pinpoint instruction", () => {
    const p = read("lib/generation/prompts.ts");
    expect(/only .*(supplied|provided|committed) corpus/i.test(p)).toBe(true);
    expect(/pinpoint/i.test(p)).toBe(true);
    expect(/not covered|cannot support|say so/i.test(p)).toBe(true);
  });
});
