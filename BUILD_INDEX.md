# BUILD_INDEX — AdminLaw Coach (start here) — Tier B, closed corpus

Read order:
1. `C:\Users\Ivy\RayTasks\Projects\Harness.md` — global guardrails (**Tier B**).
2. `CLAUDE.md` — operating manual: Tier B, stack, do/don't, env, launch gates, **where knowledge lives**.
3. `PRODUCT_REQUIREMENTS.md` — what & why (closed corpus; grounding engine §7; cost guard §6.9).
4. `TECHNICAL_SPEC.md` — how. **Read §0 (knowledge sources) and §2 (the corpus build) first**, then the pipeline (§6) and cost guard.
5. `BUILD_PLAN.md` — M0–M4; build in order; verify green at each exit. **M0 builds the corpus index — do it first.**
6. `corpus/source/` — the provided rules, notes and model answers (the fixed corpus). `KNOWLEDGE/answer-structures.md` — the answer-method the generator follows.

**Three invariants that must never regress:** (1) every output passes `lib/verification` — cite only authorities in the committed corpus, pinpointed; (2) every model call passes the `lib/cost` guard (\$5/session, fail-closed); (3) when the corpus doesn't cover something, say "not covered" — never fabricate or reach outside it.
