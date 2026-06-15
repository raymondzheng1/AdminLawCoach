# CLAUDE.md — AdminLaw Coach (operating manual, Tier B, closed corpus)

**Read `C:\Users\Ivy\RayTasks\Projects\Harness.md` first.** Sibling project **Adaptive IRAC** shares this engine — reuse its packages where possible; the only real difference is the corpus source (fixed here, uploaded there).

## Stack tier
**Tier B — KV-only, no Supabase, no Auth, no Stripe.** Honour Tier-B trims. Keep the §4 verify gate, §6 security, §8 SEO, §11 AI track.

## What this is
A free, **login-free** study companion for one administrative-law course, **pre-loaded with a fixed, curated corpus** (the provided rules, notes and model answers in `corpus/source/`). Everything it produces — Q&A, practice, model answers, feedback — is grounded **only** in that corpus, every citation verified and pinpointed to a source document, or it says "not covered". Never introduce anything outside the corpus.

## Where knowledge lives
- **Law + citable authority** → the committed corpus (`corpus/source/` → built into `corpus/index.json`). The ONLY source. Ship nothing else; cite nothing else.
- **Answer method/structure** → `KNOWLEDGE/answer-structures.md` + generation prompts (method only).
- **Issue/ground taxonomy** → extracted at build time into `corpus/index.json`.

## Stack
Next.js (App Router) + TS strict · Vercel Pro `syd1` · browser localStorage (only client state) · Upstash Redis (cost meter + rate limit, fail-closed) · Anthropic Claude API server-side (default cost-efficient + small model; prompt caching) · optional BYO key · GA4 (PII-safe). No DB/Auth/Stripe/vector-DB (keyword retrieval first; ask before adding any).

## Do
- Build the corpus with `scripts/build-corpus.mjs` → commit `corpus/index.json`; `corpus-check` linter in `verify`.
- Route **every** output through `lib/verification` (cite only ∈ committed corpus authorities, pinpointed) before display; reject + regenerate on content failure, never patch.
- Run the **cost guard** before every model call; fail-closed; BYO-key bypasses.
- Zod at every boundary; no `any`. One `verify` gate before push; tests with every fix; drift tests for conventions.
- Bash hygiene (§6.8): one program per call, no `cd`, no inline loops — use `scripts/*.mjs`.

## Don't
- Don't add user uploads (corpus is fixed), Supabase/Auth/Stripe/a vector DB (ask first).
- Don't let the model cite or assert anything outside the committed corpus; don't fabricate; prefer "not covered".
- Don't store user attempts server-side or log them; don't log BYO keys.
- Don't mention AI/LLM/Claude in customer copy.

## Env vars (placeholders in `.env.example`; secrets never committed)
`ANTHROPIC_API_KEY` (server-only) · `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` **or** the Marketplace `KV_REST_API_URL`/`KV_REST_API_TOKEN` (either pair accepted, §15) · `SESSION_CAP_USD` (operator-set in Vercel = 0.5; the PRD's \$5 is illustrative — the env var is authoritative) · `GLOBAL_DAILY_BUDGET_USD` (=50) · `NEXT_PUBLIC_SITE_URL` (canonical/sitemap/robots) · `NEXT_PUBLIC_GA_ID` (optional, GA4 no-ops when unset) · `ADMINLAW_DEFAULT_MODEL` (=`claude-sonnet-4-6`) · `ADMINLAW_SMALL_MODEL` (=`claude-haiku-4-5`, repair) · `RESEND_API_KEY`+`ADMIN_NOTIFY_EMAIL`+`FROM_EMAIL` (optional, only if contact form enabled).

## Commands
`npm run build-corpus` (rebuild + re-commit `corpus/index.json` whenever `corpus/source/` changes) · `npm run verify` (the one gate: `corpus-check` → `no-ai-mentions` → `citation-format` → `typecheck` → `lint` → `vitest`) · `npm run dev` / `npm run build`.

## Build state (M0–M4 shipped, verify green: 71 tests / 10 files)
- **Corpus** built from 7 docx → committed `corpus/index.json` (389 chunks · 219 authorities · 52 pinpoints · 20 taxonomy items). Extraction SoT: `lib/corpus/patterns.mjs` (shared by builder + verifier via `patterns.d.mts`).
- **Engine** (`lib/`): `cost` (token→USD meter, $5/session + global budget, fail-closed, BYO bypass) · `kv` (Upstash + MemoryKv dev/test, `__setKvForTests`) · `ratelimit` · `retrieval` (BM25-lite, token-budgeted) · `generation` (LLM seam `__setLlmForTests`, runner: generate→parse→small-model repair→verify→regenerate→"not covered") · `verification` (4 gates: structure · citation-allowlist · jurisdiction · pinpoint-binding, anchored on corpus text) · `exam` (injectable clock) · `storage` (localStorage, Zod-versioned).
- **Routes**: `POST /api/{ask,explain,generate/answer,generate/question,feedback}` · `GET /api/{meta,usage}`. All model routes: cost-guard → retrieve → runner → verify (pinned by `tests/unit/conventions/drift.test.ts`).
- **UI**: `/` landing (consumer §14.0) · `/study` client app (Ask/Practice/Model/Exam/Explain/Progress) with the source panel, usage meter, BYO-key. SEO: `sitemap.ts`/`robots.ts`/per-route metadata; `/study` is `noindex`.
- **Note (correctness anchor):** the verifier never trusts the curated authority list — it confirms each cited authority is present in the committed corpus text on token boundaries, then binds it to a real chunk. Extraction precision affects browse/UX, never the grounding guarantee.

## Launch gates
`verify` green (incl. `corpus-check`) ✓ · verifier rejects an out-of-corpus citation (integration test) ✓ · cost guard blocks at the session cap and fails closed when KV down ✓ · "not covered" path works ✓ (live-confirmed) · no-AI-mentions linter green ✓ · mobile 375×812 pass ✓ · BYO-key bypasses meter ✓.
