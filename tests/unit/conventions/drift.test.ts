import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
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

// The PWA install affordance is an always-on Tier-B deliverable (§2.0 includes, §19).
// It was once dropped silently; pin its existence so it can't regress.
describe("drift: installable PWA deliverable (§19)", () => {
  const PWA_FILES = [
    "app/manifest.ts",
    "app/icon.svg",
    "app/apple-icon.png",
    "app/favicon.ico",
    "public/icon-192.png",
    "public/icon-512.png",
    "components/pwa/InstallPrompt.tsx",
  ];
  for (const f of PWA_FILES) {
    it(`${f} exists`, () => {
      expect(existsSync(resolve(ROOT, f))).toBe(true);
    });
  }
  it("manifest sets display:standalone, start_url and a 512 icon", () => {
    const m = read("app/manifest.ts");
    expect(m.includes("standalone")).toBe(true);
    expect(m.includes("start_url")).toBe(true);
    expect(m.includes("512")).toBe(true);
  });
  it("the install affordance is mounted in the app shell", () => {
    expect(read("components/study/StudyApp.tsx").includes("InstallPrompt")).toBe(true);
  });
  it("the root layout links the manifest source + theme color (§19.2)", () => {
    const layout = read("app/layout.tsx");
    expect(/themeColor/.test(layout)).toBe(true);
    expect(/appleWebApp/.test(layout)).toBe(true);
  });
});

describe("drift: generation prompts carry the grounding contract (§4.2)", () => {
  it("prompts.ts states the hard-no rule + pinpoint instruction", () => {
    const p = read("lib/generation/prompts.ts");
    expect(/only .*(supplied|provided|committed) corpus/i.test(p)).toBe(true);
    expect(/pinpoint/i.test(p)).toBe(true);
    expect(/not covered|cannot support|say so/i.test(p)).toBe(true);
  });
});
