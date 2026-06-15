// @ts-check
/**
 * no-ai-mentions.mjs — customer copy must never mention AI/LLM/the model vendor (§11, CLAUDE.md Don't).
 * Customers see the product, not the machinery. Scans rendered customer-facing
 * surfaces (app/, components/, lib/content). Skips comment lines and operator-only
 * files (generation prompts, scripts, tests) where vendor terms are legitimate.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["app", "components", "lib/content"];
// Operator-only subtrees that legitimately reference the model machinery.
const SKIP = ["lib/generation", "lib/cost", "node_modules", ".next"];

const FORBIDDEN = [
  [/\bAI\b/, "no 'AI' in customer copy"],
  [/\bA\.?I\.?-(?:powered|driven|generated|assisted)\b/i, "no 'AI-powered/-generated' in customer copy"],
  [/artificial intelligence/i, "no 'artificial intelligence'"],
  [/\bLLMs?\b/, "no 'LLM'"],
  [/large language model/i, "no 'large language model'"],
  [/\bClaude\b/, "no vendor name 'Claude'"],
  [/\bAnthropic\b/, "no vendor name 'Anthropic'"],
  [/\bGPT\b/i, "no 'GPT'"],
  [/\bchatbot\b/i, "no 'chatbot'"],
  [/machine learning/i, "no 'machine learning'"],
];

/** @type {string[]} */
const files = [];
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (SKIP.some((s) => rel.startsWith(s))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full);
    else if (/\.(tsx?|mdx?|json)$/.test(name)) files.push(full);
  }
}
for (const d of SCAN_DIRS) walk(resolve(ROOT, d));

let failures = 0;
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, "/");
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return; // skip comments
    for (const [re, why] of FORBIDDEN) {
      if (re.test(line)) {
        console.error(`  ✗ ${rel}:${i + 1} — ${why}\n      ${t.slice(0, 140)}`);
        failures++;
      }
    }
  });
}

if (failures) {
  console.error(`\nno-ai-mentions: ${failures} violation(s) in customer copy.`);
  process.exit(1);
}
console.error(`no-ai-mentions OK — scanned ${files.length} file(s).`);
