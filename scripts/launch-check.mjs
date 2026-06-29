// @ts-check
/**
 * launch-check.mjs — machine-checked launch checklist (Harness §4.7; the §4.3
 * drift-defence pattern applied to DELIVERABLES, not just code). The PWA install
 * affordance was once dropped because
 * it lived only in harness prose (§2.0 Tier-B "includes: PWA", §19) and nothing in
 * `verify` failed when it was absent. This linter asserts the Tier-B always-on surface
 * EXISTS, so a missing deliverable turns the build red instead of slipping silently.
 *
 * Add the new always-on deliverable here the day the tier/harness requires one.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exists = (rel) => existsSync(resolve(ROOT, rel));
const read = (rel) => {
  try {
    return readFileSync(resolve(ROOT, rel), "utf8");
  } catch {
    return "";
  }
};

let failures = 0;
const need = (cond, msg) => {
  if (!cond) {
    console.error(`  ✗ ${msg}`);
    failures++;
  }
};

// --- PWA / installable (§19, Tier-B includes) ---------------------------------------------
need(exists("app/manifest.ts"), "PWA: app/manifest.ts (web manifest) missing");
const manifest = read("app/manifest.ts");
need(/standalone/.test(manifest), 'PWA: manifest must set display: "standalone"');
need(/start_url/.test(manifest), "PWA: manifest must set start_url");
need(/512/.test(manifest), "PWA: manifest must reference a 512px icon");
need(/maskable/.test(manifest), "PWA: manifest must include a maskable icon");
for (const f of ["app/icon.svg", "app/apple-icon.png", "app/favicon.ico", "public/icon-192.png", "public/icon-512.png"]) {
  need(exists(f), `PWA: icon asset missing — ${f} (run \`npm run icons\`)`);
}
need(exists("components/pwa/InstallPrompt.tsx"), "PWA: in-app install affordance component missing");
need(/InstallPrompt/.test(read("components/study/StudyApp.tsx")), "PWA: InstallPrompt is not mounted in the app shell");

// --- SEO (§8) -----------------------------------------------------------------------------
need(exists("app/sitemap.ts"), "SEO: app/sitemap.ts missing");
need(exists("app/robots.ts"), "SEO: app/robots.ts missing");
need(/SITE|NEXT_PUBLIC_SITE_URL/.test(read("app/sitemap.ts")), "SEO: sitemap must use the env-driven base URL (single source, §8)");

// --- Security headers (§6.6) --------------------------------------------------------------
const vercelJson = read("vercel.json");
for (const h of ["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
  need(vercelJson.includes(h), `Security: vercel.json missing header ${h}`);
}

// --- Analytics (§8.2 / §8.5) --------------------------------------------------------------
const layout = read("app/layout.tsx");
need(/@vercel\/analytics/.test(layout) && /<Analytics/.test(layout), "Analytics: <Analytics/> not mounted in the root layout (§8.5)");
need(/GoogleAnalytics/.test(layout), "Analytics: GA4 loader not mounted in the root layout (§8.2)");

// --- Contact form (§16.3) -----------------------------------------------------------------
need(exists("app/contact/page.tsx"), "Contact: app/contact/page.tsx missing (§16.3)");
need(exists("app/api/contact/route.ts"), "Contact: app/api/contact/route.ts missing (§16.3)");
need(exists("lib/email.ts"), "Contact: lib/email.ts shared helper missing (§16.2)");
need(/rateLimit/.test(read("app/api/contact/route.ts")), "Contact: route must rate-limit (§16.3, fail-closed)");

// --- Platform guards (§15) ----------------------------------------------------------------
// The Marketplace injects KV_REST_API_*, not the legacy UPSTASH_*; readUpstashEnv must accept
// both, pinned by its own unit test (§4.7).
const kv = read("lib/kv.ts");
need(/KV_REST_API_URL/.test(kv) && /UPSTASH_REDIS_REST_URL/.test(kv), "Platform: readUpstashEnv must accept both KV env-name pairs (§15)");
need(exists("tests/unit/kv/env.test.ts"), "Platform: §15 dual-KV-env-name guard test missing");

if (failures) {
  console.error(`\nlaunch:check — ${failures} required deliverable(s) missing.`);
  process.exit(1);
}
console.error("launch:check OK — PWA · SEO · security headers · analytics all present.");
