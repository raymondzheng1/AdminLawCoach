# AdminLaw Coach — Build Plan (Tier B, closed corpus)

**M0 — Scaffold + corpus build (the distinctive first step).** Next.js+TS strict on Vercel Pro `syd1`; `verify` gate + CI; design tokens; GA4; Upstash; localStorage adapters; **`scripts/build-corpus.mjs`** parsing `corpus/source/*.docx` → committed **`corpus/index.json`** (chunks + authorities/pinpoints + taxonomy) + `corpus-check` linter. Exit: corpus builds, index committed and lints; empty app deploys; verify green.

**M1 — Cost guard + grounded Ask + verification (engine + budget).** `lib/cost` (\$5/session, per-IP, global budget, fail-closed) before every call; `lib/retrieval` (whole-corpus-or-keyword over index.json); `/api/ask` with the 4-gate verifier; pinpoint click-to-source; "not covered" state; BYO-key. Exit: integration tests prove (a) out-of-corpus citation rejected, (b) spend blocked at \$5 / fails closed, (c) "not covered" path. Ask works end-to-end.

**M2 — Practice + model answers + feedback.** Generate hypos/essays from corpus topics; serve curated model answers + generate grounded variants; attempt editor + feedback (issues, structure, authority use, rubric, actions). Exit: full practice loop grounded in the corpus.

**M3 — Exam mode + Explain + progress + export.** Timed sessions (word/time budgeting); Explain/lookup over the notes; single-device progress + weak-area nudge; download/print + export/import JSON. Exit: timed mock + sourced explanations + downloadable results.

**M4 — Landing + launch hardening.** Landing (§14 consumer model) with a real grounded-answer preview + the source panel; usage meter + BYO-key UI; rate limits + security headers; mobile pass; academic-integrity + not-legal-advice notices. Exit: launch gates met; near-zero operator cost.

**Post-MVP:** swappable corpora (other subjects via a new `corpus/source/` + rebuild); shared engine packages with Adaptive IRAC; "Pro" Tier-A (accounts/progress sync/subscriptions).
