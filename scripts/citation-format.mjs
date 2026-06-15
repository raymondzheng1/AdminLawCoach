// @ts-check
/**
 * citation-format.mjs — structural linter for citation/pinpoint conventions (§4.2, TECHNICAL_SPEC §7).
 *  1. Every committed pinpoint label is well-formed ("Sem N sM" / "Sem N sM–K").
 *  2. Generation prompts (once present) must carry the grounding contract: the
 *     hard-no rule, the "only the supplied corpus" rule, and a pinpoint instruction.
 *     This is a drift defence — a prompt that forgets to ground is the whole risk.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const fail = (m) => {
  console.error(`  ✗ ${m}`);
  failures++;
};

// 1. Pinpoint label format.
const INDEX = resolve(ROOT, "corpus/index.json");
if (existsSync(INDEX)) {
  const ix = JSON.parse(readFileSync(INDEX, "utf8"));
  const PINPOINT = /^Sem ?\d+ ?s ?\d+(?:[–-]\d+)?$/i;
  for (const p of ix.pinpoints ?? []) {
    if (!PINPOINT.test(p.label)) fail(`malformed pinpoint label: "${p.label}"`);
  }
}

// 2. Generation prompts must ground (skip cleanly until the prompts module exists).
const PROMPTS_DIR = resolve(ROOT, "lib/generation");
if (existsSync(PROMPTS_DIR)) {
  const promptFiles = readdirSync(PROMPTS_DIR).filter((f) => /prompt/i.test(f) && /\.(ts|mjs)$/.test(f));
  const REQUIRED = [
    [/only .*(supplied|provided|committed) corpus/i, "must instruct: use ONLY the supplied corpus"],
    [/not covered|cannot support|say so/i, "must instruct the 'not covered' honesty fallback"],
    [/pinpoint/i, "must instruct pinpoint citation"],
  ];
  for (const f of promptFiles) {
    const src = readFileSync(join(PROMPTS_DIR, f), "utf8");
    for (const [re, why] of REQUIRED) {
      if (!re.test(src)) fail(`${f}: ${why}`);
    }
  }
}

if (failures) {
  console.error(`\ncitation-format: ${failures} problem(s).`);
  process.exit(1);
}
console.error("citation-format OK.");
