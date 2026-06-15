# AdminLaw Coach — Technical Spec (Tier B, closed corpus)

Inherits `Harness.md`. **Tier B.** Mirrors Adaptive IRAC's engine; the difference is a **fixed, build-time corpus** instead of runtime uploads.

## 0. Knowledge sources (read first)
- **Substantive law + citable authority** → the **committed corpus** in `corpus/source/` (the provided rules, notes, model answers). This is the *only* source of substance and citations. Nothing else is ever introduced.
- **Answer method/structure** (IRAC, MR-vs-JR shapes, essay method, citation/pinpoint formats) → shipped in `KNOWLEDGE/answer-structures.md` + the generation prompts. Method only.
- **Issue/ground taxonomy** → extracted at build time from the corpus (the rules/structure docs already enumerate the grounds) and committed in `corpus/index.json`.
Unlike Adaptive IRAC, **the corpus and allow-list are built once at build time and committed**, not constructed per session.

## 1. Stack (harness §2.0 Tier B) — same as Adaptive IRAC
Next.js (App Router) + TS strict · Vercel Pro `syd1` · browser `localStorage` (only client state: attempts, generated items, single-device progress) · Upstash Redis (cost meter + rate limit, fail-closed) · Anthropic Claude API server-side (cost-efficient default + small model; prompt caching) · optional BYO key (client-held) · GA4 (PII-safe). **No Supabase, no Auth, no Stripe, no vector DB (unless keyword retrieval proves insufficient).**

## 2. The corpus build (the distinctive piece)
- **Source:** `corpus/source/*.docx` (the provided materials), each tagged with a role: `rules` | `notes` | `model`.
- **Build step (`scripts/build-corpus.mjs`, run at build / committed output):**
  1. Parse each docx → clean text + structure (headings, the case→pinpoint labels like "Sem 21 s9", "Notes p…").
  2. Chunk with stable ids + location labels.
  3. Extract **authorities** (cases, statute sections, course concepts) and **issue/ground taxonomy** → the **allow-list**.
  4. Emit **`corpus/index.json`**: `{ chunks[], authorities[] (with locations), taxonomy[], roleMap }`. Committed and diffable (harness §3.5 "reference data is committed; derived state computed").
  5. A **corpus linter** (`scripts/corpus-check.mjs`, in `verify`) asserts every authority resolves to ≥1 chunk location and the index parses against its Zod schema.
- Rebuild only when the source materials change; `corpus/index.json` is the runtime source of truth (no DB).

## 3. Module layout
```
corpus/source/         # provided docx (committed)
corpus/index.json      # built allow-list + chunks + taxonomy (committed, diffable)
lib/
  corpus/        # load index.json, lookups (authority→locations, topic→chunks)
  retrieval/     # whole-corpus-in-context budgeter + BM25-lite keyword select over index.json
  generation/    # runner (retry/fresh-context), prompts (method from KNOWLEDGE), models
  verification/  # citation-allowlist gate, IRAC/essay-structure gate, jurisdiction gate, pinpoint binding
  feedback/      # mark attempt vs corpus + model-answer issue set
  exam/          # timed-session + word-budget (pure; injectable clock)
  cost/          # token→USD, per-session/IP/global budget meter (Upstash), fail-closed
  byokey/        # optional user key (client-held; never persisted server-side)
  schemas/       # Zod schemas (incl. corpus index shape)
  storage/       # localStorage adapters (attempts, progress) + export/print
components/ ui/ + <feature>/
scripts/         # build-corpus.mjs, corpus-check.mjs, + named dynamic scripts (§6.8)
KNOWLEDGE/       # answer-structures.md (method)
```

## 4. "Data model"
- **Committed:** `corpus/index.json` (the corpus — read-only at runtime).
- **localStorage (Zod-typed, versioned):** `Attempt[]`, generated `Question[]`/`ModelAnswer[]`, `Progress` (single device) + export/import JSON. **No user content server-side.**
- **Upstash KV:** `spend:{sessionId}` (TTL 24h), `ip:{ip}`, `budget:global:{date}`. No user content in KV.

## 5. API routes (stateless; Zod; rate-limited; cost-guarded; AI key server-side)
- `POST /api/ask` — { question } → grounded answer over the corpus (retrieval + generation + verification), pinpoints returned.
- `POST /api/generate/question` — { type, topic, difficulty } → practice item from corpus topics.
- `POST /api/generate/answer` — { question } → grounded model answer (verified) — or serve a curated one if it exists.
- `POST /api/feedback` — { question, attemptText } → feedback.
- `POST /api/explain` — { authorityOrConcept } → sourced explanation from the corpus.
- All run the **cost guard first** (fail-closed), meter usage after; BYO-key bypasses the shared meter. No upload route, no auth, no DB.

## 6. Generation + verification pipeline (harness §11) — unchanged engine
```
request (+ corpus context selected by lib/retrieval from index.json)
  → COST GUARD (session<$5 & global budget ok, or BYO-key)  ← fail-closed
  → generate (default model; system prompt = method + HARD-NO: use ONLY the supplied corpus; if not covered, say so)
  → VERIFY: structure · citation-allowlist (∈ committed corpus authorities) · jurisdiction · pinpoint-binding
  → pass → render with click-to-source pinpoints + meter usage
  → fail(structural) → small-model envelope repair → re-verify
  → fail(content)    → regenerate from CLEAN context, cap N=3
  → exhausted → "not covered by the provided materials" (never fabricate)
```

## 7. Quality gates & tests (harness §4)
- `verify` = `tsc --noEmit` + `eslint` + `vitest run` + linters: `corpus-check` (index integrity; every authority resolves), `no-ai-mentions`, `citation-format` (pinpoint present), `tokens`.
- **Drift tests (§4.3):** every generate/ask route runs output through `verifyAnswer`; every model call passes the cost guard; customer copy free of AI-mentions.
- **Integration (Tier-B variant):** Anthropic mocked at the edge, Upstash via `__setKvForTests`. Must-have tests: (a) verifier **rejects** an answer citing an authority **not in `corpus/index.json`**; (b) cost guard **blocks** at \$5 and **fails closed** when KV down; (c) "not covered" path when retrieval returns nothing relevant.
- Clock seam for exam timer.

## 8. Security/privacy (harness §6)
- No accounts/PII; attempts in memory + localStorage only; never logged; BYO-key never stored/logged. The corpus is our own material. HTTP security headers + CSP. **Injection defence (§6.5):** the corpus is trusted content we authored, but still treat any user-entered text (questions, attempts) as data, not instructions.

## 9. Deploy/ops
- §2.2 deploy discipline; env vars in CLAUDE.md; Upstash provisioned + fail-closed; rebuild + commit `corpus/index.json` whenever `corpus/source/` changes (a `scripts/build-corpus.mjs` run, reviewed in the diff); no DB backups needed (no server-side user state; corpus is in git).
