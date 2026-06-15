# Harness proposal — machine-checked "definition of done" (launch-gate linter)

**Status:** Proposal awaiting maintainer approval (§1.6 — `Harness.md` is not edited unilaterally).
**Source project:** AdminLaw Coach, 2026-06-16.

## The bug class this prevents

A required **deliverable** that lives only in harness prose can be dropped silently, because nothing in `verify` fails when it's absent. On AdminLaw Coach the installable-PWA layer (§2.0 Tier-B "includes: PWA", §19) shipped missing — no manifest, no icons, no install affordance — and `verify` was green the whole time. The harness already records the *same* omission on **Margin** (Appendix C, 2026-06-14: the in-app install affordance "got skipped and had to be requested"). Two projects, same failure mode → it generalises.

Root cause: the drift-defence pattern (§4.3) is applied to **code conventions** ("every route calls the guard") but not to **deliverables** ("a manifest exists"). The fix is to apply the same pattern to the always-on deliverable surface.

## Proposed change

### 1. New subsection §4.7 — *Launch-gate linter (machine-checked definition of done)*

> **Principle:** The always-on deliverables for the project's tier (§2.0) are pinned by a `launch-gates` linter in `verify`, exactly as cross-cutting code conventions are pinned by drift tests (§4.3). A missing deliverable fails the build, not a human review.
>
> **Why:** requirements that live only in prose get dropped when a project's local checklist (its `CLAUDE.md` gates / build plan) doesn't re-enumerate them. The machine, not memory, must enforce "what must ship." (PWA install affordance dropped on Margin and again on AdminLaw Coach — both green `verify`.)
>
> **Apply:** add `scripts/launch-gates.mjs` to the `verify` chain at kickoff, seeded from the tier's `§2.0` *includes* row + the always-on sections (§6.6 headers, §8 SEO, §8.5 analytics, §19 PWA for app-like products, §17 admin for Tier A). It is a ~40-line existence/short-substring linter with an explicit "add the next deliverable here" comment. Derive the list from **the harness**, not the project doc alone — that is the step where §19-type requirements enter.

### 2. Appendix A bootstrap — add to step 6

> 6. Stand up the **`verify` gate** with at least typecheck + lint + tests; **and a `launch-gates` linter (§4.7) seeded from the tier's §2.0 includes + always-on sections**, so every required deliverable is machine-checked from day one.

### 3. Ship a template

Add a `launch-gates.mjs` template alongside the §4.2 linter skeleton. A working, tier-B reference implementation (AdminLaw Coach):

```js
// scripts/launch-gates.mjs — machine-checked definition-of-done (§4.7).
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exists = (r) => existsSync(resolve(ROOT, r));
const read = (r) => { try { return readFileSync(resolve(ROOT, r), "utf8"); } catch { return ""; } };
let failures = 0;
const need = (cond, msg) => { if (!cond) { console.error(`  ✗ ${msg}`); failures++; } };

// PWA (§19) — app-like/mobile-first products
need(exists("app/manifest.ts"), "PWA: manifest missing");
const m = read("app/manifest.ts");
need(/standalone/.test(m) && /start_url/.test(m) && /512/.test(m) && /maskable/.test(m), "PWA: manifest incomplete");
for (const f of ["app/icon.svg","app/apple-icon.png","app/favicon.ico","public/icon-192.png","public/icon-512.png"]) need(exists(f), `PWA icon missing: ${f}`);
need(exists("components/pwa/InstallPrompt.tsx"), "PWA: install affordance missing");
need(/InstallPrompt/.test(read("components/<app-shell>.tsx")), "PWA: install affordance not mounted");
// SEO (§8)
need(exists("app/sitemap.ts") && exists("app/robots.ts"), "SEO: sitemap/robots missing");
// Security headers (§6.6)
const vj = read("vercel.json");
for (const h of ["Content-Security-Policy","X-Content-Type-Options","Referrer-Policy","Permissions-Policy"]) need(vj.includes(h), `Security: header missing ${h}`);
// Analytics (§8.5)
need(/@vercel\/analytics/.test(read("app/layout.tsx")), "Analytics: <Analytics/> not mounted");
// Tier A only: need(exists("app/admin/..."), "Admin dashboard missing (§17)"); etc.

if (failures) { console.error(`\nlaunch-gates: ${failures} required deliverable(s) missing.`); process.exit(1); }
console.error("launch-gates OK.");
```

### 4. Appendix C changelog row

| Date | Section | Type | Summary | Source project |
|---|---|---|---|---|
| 2026-06-16 | §4.7 / Appendix A#6 | New | Launch-gate linter: machine-check the tier's always-on deliverables (PWA/SEO/headers/analytics) in `verify`, drift-test style — a deliverable dropped silently (PWA on Margin + AdminLaw Coach) fails the build instead | AdminLaw Coach |

## Honest limitation (worth stating in the section)

A launch-gate linter only enforces what's enumerated in it; it can't catch a requirement nobody wrote down. Completeness of the initial enumeration is the irreducible kickoff judgment — but seeding it from the **harness tier-includes + always-on sections** (not the project's local gate list) is what closes the gap that caused both misses.
