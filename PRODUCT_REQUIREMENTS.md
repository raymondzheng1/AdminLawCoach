# AdminLaw Coach — Product Requirements (PRD)

**Working title:** AdminLaw Coach (brand TBD). **Status:** v1 spec. **Owner:** Raymond. **Date:** 8 June 2026.
**Harness:** Inherits `C:\Users\Ivy\RayTasks\Projects\Harness.md`. **Stack tier: B (KV-only, no Supabase, no Auth, no Stripe).**
**Relationship to Adaptive IRAC:** identical Tier-B architecture and the same generation+verification+cost-guard engine. **The one difference is the corpus:** Adaptive IRAC lets each user upload their own materials; **AdminLaw Coach ships with a fixed, curated corpus — the rules, notes and model answers in `corpus/source/` — and is grounded ONLY in those.** No uploads. If both ship, they should share the engine packages.

> **Core idea:** a free, login-free study companion for one administrative-law course, pre-loaded with the provided **rules** (the JR hypothetical structure + the combined merits-review/judicial-review framework), **notes** (the review notes), and **model answers** (the Cat Act hypothetical, the merits-review answer, the Part-B essays). Everything it generates — practice questions, model answers, Q&A, feedback — is grounded **only** in that corpus, every citation verified and pinpointed to a source document, or it declines. Nothing outside the provided materials is ever introduced.

## 1. One-line product
A free, no-login web app that helps a student master this administrative-law course using **only the provided rules, notes and model answers**: ask questions and get answers grounded (and pinpointed) to the materials; generate and attempt practice hypotheticals and essays; see model answers; get feedback — with a hard guarantee that nothing is cited or asserted beyond the supplied corpus.

## 2. Why this design
- The provided corpus is **authoritative, course-aligned, and owned by us** — so (unlike a generic AI) the tool can be trusted to stay exactly inside the syllabus, and there is **no third-party copyright/upload risk**.
- It removes the only friction Adaptive IRAC has (uploading + confirming a corpus): the corpus is already curated and **the allow-list is pre-built and reviewed once**.
- It is the sharpest possible demonstration of the verified-citation moat: a closed, known corpus makes "cite only from these materials, pinpointed" trivially auditable.

## 3. Goals & non-goals
**Goals (MVP)**
- No login. Open the app → study this course immediately.
- **Ask** (Q&A grounded in the notes/rules, with pinpoints), **Practice** (generate hypos/essays from corpus topics), **Model answers** (serve the curated ones + generate fresh variations grounded in the corpus), **Feedback** (mark an attempt against the corpus + model-answer issue set), **Exam mode** (timed), **Explain** (a ground/case/concept, sourced).
- **Citation integrity:** every authority/proposition in any output maps to the fixed corpus allow-list and a pinpoint (document + location), or the output is rejected — never fabricated, never outside the corpus.
- Free to the user; **US$5 model-spend cap per session** (operator-funded) + optional **bring-your-own-API-key**.
- Responsive web; results on screen + downloadable.

**Non-goals (MVP)**
- No user uploads (the corpus is fixed). No accounts/DB/payments. No server-side storage of user work. Not legal advice. No web research beyond the corpus.

## 4. Users & JTBD
- **Primary:** students taking this administrative-law course (Raymond's cohort and similar), revising for the exam.
- **JTBD:** "Let me practise and check my understanding of *this course* — its rules, its grounds, its model answers — and trust that everything is exactly what my course teaches and cites, nothing more."

## 5. The corpus (what ships in `corpus/source/`)
The provided materials, classified into three roles (the allow-list and retrieval treat them differently):
- **RULES / structure:** `01_RULES_JR_Hypo_structure` (grounds, ratios, the answer skeleton), `06_RULES_Combined_MR_JR_framework` (merits-review vs judicial-review method).
- **NOTES:** `02_NOTES_Review` (the detailed review notes — the substantive doctrine + cases + pinpoints).
- **MODEL ANSWERS:** `03_MODEL_CatAct_hypothetical`, `04_MODEL_MeritsReview_answer`, `05_MODEL_PartB_essays`, `07_MODEL_CatAct_full_HD` (worked examples to serve and to learn answer style from).
- The corpus is the **single source of truth** for both substance and citable authority. The set of authorities (cases, statutes, sections, course pinpoints like "Sem 21 s9") extracted from it **is** the allow-list.

## 6. Functional requirements (MVP)
### 6.1 Start (no login)
- Open → home with the study modes. A session id (httpOnly cookie) is issued for spend metering only. Optional BYO-key field (browser-stored).
### 6.2 Ask (grounded Q&A) — the everyday mode
- Free-text question ("What's the test for legal unreasonableness?", "How does merits review differ from judicial review?") → answer composed **only** from the corpus, with inline pinpoints (e.g. "*Li* — Notes/Sem 21 s9") click-to-source. If the corpus doesn't cover it: "the provided materials don't address this" — never guess.
### 6.3 Practice (generate from the corpus)
- Generate a **hypothetical** (facts raising taught grounds) or an **essay** (a contention from a covered topic), drawing topics/grounds from the corpus. Regenerate; keep in localStorage.
### 6.4 Model answers
- For any practice item (or the canonical ones), show a **model answer**: IRAC for hypos, contention→both-sides→preferred for essays. Serve the curated model answers where they exist; generate fresh ones grounded in the corpus otherwise. Every authority pinpointed and allow-list-verified.
### 6.5 Feedback
- Student writes an attempt (editor, word count, optional timer) → feedback: issues spotted/missed (vs the corpus + model-answer issue set), IRAC/essay structure, **authority use** (flag anything not in the corpus), application depth, rubric score, 3 actions. References only the allow-list.
### 6.6 Exam mode + progress
- Timed sessions (word/time budgeting per our typing-speed model); batch feedback. **Single-device** progress in localStorage (topics practised, weakest area) + a "practise your weak area" nudge.
### 6.7 Explain / lookup
- "Explain" a ground, case or concept → a short, sourced explanation drawn only from the corpus, with links to the exact passages. (A lightweight study-reference over the notes.)
### 6.8 Keep results
- Download/print answers and feedback. Nothing stored for the user server-side.
### 6.9 Cost guard (same as Adaptive IRAC)
- Hard **US$5 model-spend cap per session** (metered in Upstash), per-IP limits, a **global daily budget** kill-switch, fail-closed; **BYO-key bypasses** the cap and costs us nothing.

## 7. Grounding engine (the moat) — same as Adaptive IRAC, simpler because the corpus is fixed
1. **Allow-list is pre-built at build time from `corpus/source/` and committed as `corpus/index.json`** (authorities + pinpoints + chunked text), reviewed once. No runtime upload, no per-session allow-list construction.
2. **Retrieval without a vector DB.** The corpus is bounded; use whole-corpus-in-context where it fits a token budget, else keyword (BM25-lite) selection over `corpus/index.json`. (If the notes are large, chunk and keyword-select; embeddings optional and only if needed — prefer keyword to stay DB-free and cheap.)
3. **Post-processing verification (non-negotiable, harness §11/§11.2).** Every authority token in any output must be in the committed allow-list (citation-whitelist gate) + structure gate (IRAC/essay) + jurisdiction gate + pinpoint-binding gate (every citation resolves to a corpus location).
4. **Fail handling:** structural → small-model envelope repair; content (authority outside corpus) → reject + regenerate from clean context; attempt cap → "not covered by the provided materials" state. Never fabricate, never reach outside the corpus.
5. No AI-mentions in user copy; keys server-side; prompt caching; cache deterministic inputs.

## 8. Non-functional
- **Privacy/IP:** the corpus is our own material (no third-party upload risk); user attempts processed in memory, never stored server-side, never logged.
- **Cost:** \$5/session + global budget; cheap/small models; output caps; aggressive caching (the fixed corpus makes prompt-caching especially effective).
- **Fail-closed**, **data residency `syd1`**, **WCAG AA**, streamed generation.

## 9. UX (responsive; harness §14.0 consumer/educational model)
- **Landing:** hero ("Master [this course] — free, no sign-up; everything sourced to your materials") → modes (Ask / Practice / Model answers / Exam) → live preview (a real grounded answer with pinpoints) → how-it-works → CTA → footer.
- **App:** mode switcher (Ask / Practice / Model answers / Exam / Progress); a persistent **source panel** showing the pinpoints behind the current answer (the trust surface); usage meter + BYO-key affordance.
- Design system + 375×812 mobile pass.

## 10. Analytics & metrics (GA4 client-side, PII-safe)
- Events: open → ask/practice/model/exam → answer shown → attempt → feedback → download → cap-hit/BYO-key.
- North-star: weekly study sessions; trust metric: verified-citation pass rate (>99%); cost: avg \$/session, % hitting cap.

## 11. Legal / academic integrity
- Not legal advice; a study aid over the provided course materials. Academic-integrity notice (practice, not for live assessment). AI honesty: only the corpus, pinpointed, honest "not covered" states.

## 12. Out of scope / future
- Swappable corpora (the architecture supports it — `corpus/source/` + a rebuild — so the same app could later host other subjects/courses); accounts/progress sync/subscriptions (the "Pro" Tier-A upgrade); merging with Adaptive IRAC as two front-ends over one shared engine.

## 13. Open questions
- Brand/domain. · Default model + output caps to make \$5 stretch. · Whether to seed embeddings or stay keyword-only for retrieval over the (large) notes. · How much of the curated model answers to serve verbatim vs regenerate. · Whether to ship public (any student) or gate to the cohort.
