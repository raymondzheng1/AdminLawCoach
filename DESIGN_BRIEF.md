# Design Brief — AdminLaw Coach

> Hand this to a design session. It is self-contained — you don't need any other files to start.
> The product is **already built and live** at https://admin-law-coach.vercel.app/ — this is a redesign/elevation of a working app, not greenfield. View it on your phone and desktop before you start.

## 1. What it is (one paragraph)
AdminLaw Coach is a **free, login-free study companion for a single university administrative-law course**. A student can ask questions, generate and attempt practice problems/essays, read model answers, get their work marked, and run timed mocks. Its defining promise: **every answer is composed only from the student's own course materials and pinpointed to the exact source passage — or it honestly says "not covered."** Nothing outside the course materials is ever introduced. The trustworthiness *is* the product.

## 2. Who it's for
Law students revising for an exam — often stressed, time-pressured, studying in short bursts on a **phone** as much as a laptop. They value: clarity, speed, confidence that what they're reading is *exactly* what their course teaches (not generic internet law), and the ability to practise and self-check. They are not buying anything; there's no login. The bar is "a calm, credible study tool I trust and return to," not "a flashy app."

## 3. The one thing the design must nail: **visible trust**
The signature interaction is **sourcing**. Every grounded answer carries small **pinpoint chips** (e.g. `Li · Sem 21`), and a **source panel** shows the actual course passages behind the answer. Clicking a chip highlights its exact passage. Design this so it feels *effortless and reassuring*, never cluttered — the source panel is a feature, not a footnote. Equally, the **"not covered"** state must read as *integrity and care*, not as an error or a dead end.

## 4. Brand personality & tone
- **Trustworthy, credible, academic** — like a well-made law textbook or a respected study guide, not a startup.
- **Calm and uncluttered** — students are stressed; the UI should lower the temperature.
- **Quietly warm and encouraging**, especially in feedback and progress — supportive, never patronising.
- **Restraint over flash.** This is an authority product: no confetti, no gimmicks, no hype. Confidence is conveyed through typography, space, and precision, not decoration.
- Copy is plain-English and human. **Never mention AI, models, or any vendor** anywhere in the interface — the student sees a study companion, not the machinery.

## 5. Surfaces to design

### A. Marketing landing (`/`)
Follows a **consumer/educational hierarchy** (intrigue → demonstration → frictionless start):
1. **Hero** — one-sentence value + a single primary CTA ("Start studying — free").
2. **Live trust preview** — a realistic example answer with pinpoint chips, demonstrating the sourcing promise. (No fake testimonials/stats — there are no users to cite yet; don't fabricate social proof.)
3. **What's inside** — 3–4 feature cards (Ask / Practice / Model answers / Exam).
4. **How it works** — 3 numbered steps.
5. **Closing CTA** + footer (with "not legal advice / for practice, not live assessment" notices).

### B. The study app (`/study`) — the core product
A focused app shell:
- **Header:** wordmark, a **usage meter**, and a subtle **"Use your own key"** affordance.
- **Mode switcher:** 6 modes — **Ask · Practice · Model answers · Exam · Explain · Progress.** On mobile this is a single horizontal **scrolling** row (must never wrap to two lines).
- **Two-column work area on desktop** (main content + a persistent **source panel** on the right); **stacked** on mobile (content, then sources).
- **Footer:** academic-integrity + not-legal-advice line.
- A dismissible **"Install app"** banner (it's an installable PWA).

### C. The six modes (what each screen contains)
- **Ask** — a question box (+ example prompts) → a formatted answer with pinpoint chips. The everyday mode.
- **Explain** — look up a ground/case/concept → a short, sourced explanation.
- **Practice** — pick a **topic** + **type** (hypothetical/essay) → a generated question → an **attempt editor** (with live word count) → **feedback** + an optional "show model answer."
- **Model answers** — paste a prompt → a worked answer (IRAC for problems; contention → both sides → preferred for essays), sourced throughout.
- **Exam** — a **timed mock**: setup (topic/type/minutes) → a **live countdown + word budget + pace indicator** (ahead / on-track / behind) → submit → feedback. The countdown is a key, high-attention moment.
- **Progress** — per-topic stats, a **"practise your weak area"** nudge with a one-tap action, recent attempts, and export/import (all single-device; nothing stored on a server).

### D. Cross-cutting components (design these as a system)
- **Source panel** — a list of source cards: a **role badge** (RULES / NOTES / MODEL — three distinct treatments), the authority name, a **pinpoint chip**, the location label, and an expandable passage. A card **highlights** when its chip is clicked.
- **Pinpoint chip** — a small, clearly-interactive pill; the trust motif. Tapping it reveals/scrolls to its source.
- **Feedback result** — a **0–100 rubric score**, "issues spotted/missed," structure notes, an "authority use" flag (calls out anything the student cited that *isn't* in the course materials), and **3 next actions**. Make the score reveal feel earned and motivating.
- **Usage meter** — an honest, non-naggy indicator of the small free-session allowance (a spend bar), or "using your own key."
- **"Not covered" notice** — calm, reassuring, integrity-forward.
- **Empty / loading / error states** — see §10.

## 6. Signature moments to make satisfying
1. **Chip → source.** Clicking a pinpoint chip highlighting its exact passage in the panel — the payoff of the trust promise.
2. **Generating an answer** takes ~10–30s. The waiting state must feel intentional and calm (consider a streaming/skeleton treatment), never a frozen spinner.
3. **Exam countdown + pace** — focused, a little urgent, never anxiety-inducing.
4. **Feedback score** — a moment of constructive reveal.

## 7. Visual system — starting point (evolve or replace freely)
The current implementation uses a "trustworthy academic" direction you can refine or rethink:
- **Palette:** warm paper `#fbfaf7`, deep ink `#16213e`, primary navy `#1f3a5f`, **accent teal** `#0f766e` (used for the trust/source motif), muted grey-blue, soft border `#e7e3d9`.
- **Type:** a **serif display** (currently Newsreader/Georgia) for headings + a system sans for body — the textbook pairing reinforces credibility.
- **Logo:** currently a simple bold "A" peak on navy with a teal cross-beam. A stronger, distinctive **wordmark + emblem** would be welcome.
Treat these as a floor, not a ceiling — propose a more refined, distinctive system if you can, but keep the *trustworthy-academic* register.

## 8. Hard constraints (so the design is implementable)
- **Stack:** Next.js (App Router) + React + **Tailwind v4** with design tokens as **CSS variables** (`@theme`). Deliver tokens as a clean palette + type scale + spacing/radius set that map 1:1 to CSS variables.
- **Responsive, mobile-first:** must be excellent at **375×812** and scale up; the desktop content+source layout is a 2-column split.
- **Accessibility: WCAG AA** contrast minimum; visible focus states; the mode-switcher and chips must be obviously interactive.
- **Copy rule (non-negotiable):** no "AI", "LLM", or vendor names anywhere user-visible.
- **Compliance copy must remain:** "a study aid, not legal advice; for practice/revision, not live assessment."
- **Installable PWA:** needs an app icon set (favicon, apple-touch, maskable 192/512) + an OG/social share image — please include these.
- **Performance:** keep it light (it's a fast, text-first tool) — avoid heavy hero imagery or large illustration payloads.
- **Dark mode:** optional but welcome (currently light-only).

## 9. Readability & touch floors (the measurable bar)
- **≥12px** for any informational text (captions, chips, table cells, timestamps).
- **~44px** minimum touch targets for chips, mode tabs, dismiss buttons, pickers.
- A disciplined **4-step type scale** (page title / section / body / caption) — avoid more than ~5 distinct sizes on a screen.
- Audience skews exam-stressed and reads on phones — favour generous line-height and clear hierarchy over density.

## 10. States to design (the commonly-missed ones)
For every generative surface: **loading** (the ~10–30s wait), **empty** (no sources yet; no progress yet — design a purposeful day-zero, not a void), **error** (rate-limited; **free allowance reached** → a gentle "add your own key to continue" path; service unavailable), **not-covered** (integrity, not failure), and **success**.

## 11. What to avoid
- Generic "AI-SaaS slop": purple gradients, sterile Inter-on-white, cookie-cutter hero + 3 cards + CTA with no point of view.
- **Fabricated social proof** — no fake testimonials, user counts, or logos. There are no users yet; don't invent any.
- Gamification that undermines credibility (confetti, badges, mascots) — this is an authority product. Subtle progress/streak motivation in the Progress tab is fine; whimsy elsewhere is not.
- Clutter that buries the source/trust surface, or walls of tiny low-contrast fine print.

## 12. Deliverables requested
1. **2–3 distinct visual directions** (mood + a hero/landing frame each) to choose from — tailored to "trustworthy academic study tool," not generic.
2. For the chosen direction: a **component system** (tokens, type scale, core primitives: buttons, cards, inputs, chips, badges, the source card).
3. **Key screens at mobile (375) + desktop:** landing; Ask with a populated source panel; Practice with feedback; Exam (timed, mid-attempt); Progress.
4. The **source-panel + pinpoint-chip pattern** specified in detail (default, hover, selected/highlighted).
5. All the **states** from §10.
6. **Brand kit:** wordmark + emblem, favicon/app-icon set (incl. maskable), and an OG share image.
7. Hand-off as tokens + specs that map cleanly to Tailwind v4 CSS variables.

## 13. Reference for the current build
- Live: https://admin-law-coach.vercel.app/ (try `/study` on a phone)
- It's a real, working app — you are elevating its look and interaction quality, keeping all functional surfaces above intact.
