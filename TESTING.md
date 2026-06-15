# TESTING — AdminLaw Coach

One gate: `npm run verify` runs `corpus-check` → `no-ai-mentions` → `citation-format` → `typecheck` → `lint` → `vitest`. CI and pre-push run the same command. **71 tests / 10 files**, ~1.5s.

## Layers (§4.4)
- **Custom linters** (`scripts/*.mjs`) — domain invariants: corpus integrity (every authority/pinpoint/taxonomy location resolves to a chunk), no AI-mentions in customer copy, well-formed pinpoint labels + prompts carry the grounding contract.
- **Unit** (`tests/unit/`) — pure logic: extraction patterns, cost pricing, the cost guard, the 4 verification gates, BM25 retrieval, exam budgeting, localStorage progress.
- **Integration, Tier-B variant** (`tests/server/`) — real route handlers against injected in-memory substitutes (no DB, no network, no key): `__setKvForTests`, `__setRateLimiterForTests`, `__setLlmForTests`.
- **Drift-defence** (`tests/unit/conventions/`) — structural: every model route runs the cost guard + verifier; no `server-only` import in test-touched libs; prompts carry the hard-no rule. **Add the new route/lib to the list here when you create one — the test fails until it complies.**

## The three must-haves (PRD §7 / TECHNICAL_SPEC §7)
1. **Out-of-corpus citation is rejected** — `tests/unit/verification/gates.test.ts` + `tests/server/ask.route.test.ts` ("fabricated authority never reaches the user": the route regenerates from clean context then falls back to "not covered", and the fabricated name never appears in the response).
2. **Cost guard blocks at $5 and fails closed** — `tests/unit/cost/guard.test.ts` + `ask.route.test.ts` (402 at the cap; 503 when KV is down; BYO bypasses even with the store down).
3. **"Not covered" path** — `ask.route.test.ts` short-circuits to not-covered with **no model call** when retrieval finds nothing (verified live: gibberish → 200 notCovered, $0 spent).

## Regression-feedback loop (§4.5)
Reproduce → write a failing test named after the symptom → fix the code → the test stays forever. The suite only grows; never delete a test to go green.

## Rebuilding the corpus
`corpus/index.json` is committed. Re-run `npm run build-corpus` whenever `corpus/source/*.docx` changes, review the diff (the `corpusVersion` hash only changes when source content changes), and commit it. `corpus-check` then guards integrity in `verify`.
