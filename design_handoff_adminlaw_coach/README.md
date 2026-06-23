# Handoff: AdminLaw Coach — visual redesign (Direction A "Bound")

## Overview
AdminLaw Coach is a **free, login-free study companion for a single university administrative-law course**. Students ask questions, generate and attempt practice problems/essays, read model answers, get marked, and run timed mocks. The defining promise — and the thing the design must nail — is **visible trust**: every answer is composed **only** from the student's own course materials and **pinpointed to the exact source passage**, or it honestly says **"not covered."** Nothing outside the course materials is ever introduced.

This package is the **"Bound"** visual direction (chosen from three): a law-report classic — warm paper, deep navy, a single teal accent reserved for the trust/source motif, a serif display (Newsreader) paired with a system sans, and monospace pinpoint chips. Restraint carries the authority; the source panel is treated as a feature, not a footnote.

> The product is already built and live (Next.js + React + Tailwind). This is an **elevation of look & interaction quality**, keeping all functional surfaces intact.

---

## About the design files
The files in this bundle are **design references created in HTML** — prototypes showing the intended look and behavior. **They are not production code to copy directly.** The task is to **recreate these designs in the existing codebase** (Next.js App Router + React + **Tailwind v4**) using its established patterns, components, and data layer. Match the visuals pixel-for-pixel; implement the behavior idiomatically for the codebase.

- `direction-a-reference.html` — open it in a browser. It lays out the three designed screens as labeled frames (Landing, Ask desktop + mobile, Practice + feedback). **The pinpoint chips are live** — click one to see its source card highlight and scroll into view. This is the single most important interaction to reproduce faithfully.
- `tokens/theme.css` — Tailwind v4 `@theme` block; the **source of truth** for color/type/radius/shadow. Paste into `app/globals.css`.
- `tokens/tokens.json` — the same values as raw data.
- `brand/` — favicon, app icons (incl. maskable 192/512), `site.webmanifest`, and the OG share image.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and the signature interaction are final. Reproduce the UI pixel-perfectly using the codebase's libraries. Exact hex values, sizes, and measurements are given below and in `tokens/`.

---

## Brand & logo
- **Wordmark:** "AdminLaw Coach" set in **Newsreader 600** (serif), `letter-spacing:-0.01em`, color `#16213e`. Sizes: 19px (landing nav), 16px (app header), 15px (mobile).
- **Emblem:** a rounded-square (radius = 6/26 of the side) in navy `#1f3a5f`, containing an **"A" peak** (chevron) stroked in paper `#fbfaf7` and a **teal cross-beam** `#0f766e`. The cross-beam in the brand accent is the visual echo of the "sourced/anchored" idea. SVG source:

```html
<svg width="28" height="28" viewBox="0 0 26 26" aria-hidden="true">
  <rect width="26" height="26" rx="6" fill="#1f3a5f"/>
  <path d="M7 19 L13 7 L19 19" fill="none" stroke="#fbfaf7" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="9.2" y1="14.6" x2="16.8" y2="14.6" stroke="#0f766e" stroke-width="2.2" stroke-linecap="round"/>
</svg>
```
Lock-up: emblem + wordmark with an 11px gap, vertically centered.

---

## Design tokens
Full set in `tokens/theme.css` (Tailwind v4 `@theme`) and `tokens/tokens.json`. Summary:

### Color
| Token | Hex | Use |
|---|---|---|
| paper | `#fbfaf7` | app background (warm paper) |
| paper-sunk | `#f6f4ee` | recessed band (landing trust preview) |
| panel | `#faf8f3` | source-panel background |
| surface | `#ffffff` | cards, inputs, header |
| ink | `#16213e` | headings / deepest ink |
| body | `#23221d` | answer body copy |
| body-soft | `#33312b` | secondary body |
| muted | `#5c584d` | supporting text |
| faint | `#8a8577` | captions / meta |
| faint-2 | `#9a9486` | finest print (AA on paper) |
| **navy** | `#1f3a5f` | **primary action**, RULES badge |
| **teal** | `#0f766e` | **accent — trust/source motif only** |
| teal-tint | `#e9f1ef` | pinpoint-chip background (default) |
| teal-border | `#cfe3df` | pinpoint-chip border (default) |
| line | `#e7e3d9` | soft card border |
| line-strong | `#e0dccf` | input border |
| line-faint | `#ece6da` | internal dividers |
| role-rules | `#1f3a5f` | RULES badge fill (white text) |
| role-notes | `#0f766e` | NOTES badge fill (white text) |
| role-model-fg | `#7a5b18` | MODEL badge text (outline style) |
| role-model-border | `#d8b56a` | MODEL badge border |
| good | `#1f6b3a` | feedback "spotted" |
| warn | `#a05a1a` | feedback "missed" |
| flag | `#c2a86a` | authority-check / not-covered left border |
| flag-bg | `#faf7ef` | not-covered / flag background |

**Accent discipline:** teal is reserved for the trust motif (chips, source accents, "answer" labels, progress arc, primary-on-light affordances in the app). Navy is the primary action color. Don't introduce new hues.

### Typography — 4-step scale (keep ≤5 sizes per screen)
| Role | Family | Size / line-height | Weight |
|---|---|---|---|
| Hero (landing H1) | serif | 50 / 1.08, `-0.015em` | 600 |
| Page title (app) | serif | 28 / 1.15 | 600 |
| Section / card head | serif | 17 / 1.4 | 600 |
| Body (answers) | sans | 16 / 1.75 | 400 |
| Caption / support | sans | 13 / 1.55 | 400 |
| Meta (finest) | sans | 12 / 1.5 | 400 |
| Pinpoint chip | mono | 12 / 1 | 600 |

Fonts: **Newsreader** (serif display), system sans stack (body), **Spline Sans Mono** (chips, citation labels, code-like meta). Load Newsreader + Spline Sans Mono via Google Fonts (`next/font` recommended). **Readability floor: ≥12px** for any informational text.

### Radius / Shadow / Layout
- Radius: chip 4, input 6, card 5, **CTA 3** (crisp, letterpress-feel — not pill-soft), pill 100 (topic/type tags).
- Shadow: card `0 1px 3px rgba(0,0,0,.08)`; selected-source lift `0 0 0 2px #0f766e, 0 12px 28px rgba(0,0,0,.16)`.
- Desktop work area: **2-column** `1fr / 372px` (content / source panel). Mobile: stacked.

---

## ★ Signature pattern: pinpoint chip → source panel
This is the heart of the product. Reproduce all three states exactly.

### Pinpoint chip
A small mono pill placed inline in answer text, immediately after the clause it supports.
- **Default:** text `#0f766e` (teal), background `#e9f1ef`, 1px border `#cfe3df`, radius 4, padding `2px 8px`, font Spline Sans Mono 600 / 12px, `vertical-align:1px`. Label format: `Case · Location` (e.g. `Li · Sem 21`, `Wednesbury · Notes 4`, `Li [76] · Rules`).
- **Hover/focus:** background → teal `#0f766e`, text → white; `transition: all .15s ease`. Visible focus ring (`outline:2px solid #0f766e; outline-offset:2px`). **Touch target ≥44px** — pad the hit area even though the pill looks small.
- **Click:** highlights the matching source card in the panel and scrolls it into view.

### Source card (in the source panel)
Each card = role badge + pinpoint label, authority name (serif 600, `#16213e`), location label (`#8a8577`), and an expandable passage quote (13.5/1.65, `#4a473f`, separated by a 1px `#eee7d9` top rule). Card: white, 1px `#e7e3d9`, radius 5, padding `15px 16px`, 12px gap between cards.
- **Default:** as above.
- **Selected/highlighted (chip clicked):** border → the card's accent (teal `#0f766e`), `box-shadow: 0 0 0 2px #0f766e, 0 12px 28px rgba(0,0,0,.16)`, `transform: translateY(-1px)`, `transition: .18s`. Only one card highlighted at a time **per panel**; selecting another resets the previous. On load, the first source card is pre-highlighted so the panel reads as "connected."

### Role badges (three distinct treatments)
Mono 600, ~9.5–10px, `letter-spacing:.08em`, padding `2–3px 6–7px`, radius 3.
- **RULES** (cases & legislation): solid navy `#1f3a5f`, white text.
- **NOTES** (course materials): solid teal `#0f766e`, white text.
- **MODEL** (worked answers): **outline** — white fill, text `#7a5b18`, 1px border `#d8b56a`. (Distinct by being the only outlined badge.)

### Source panel
Background `#faf8f3`; header "Sources" (serif 16/600) with a count on the right (`N passages`). Desktop: right column, `max-height` with internal scroll. Mobile: the same cards stack **below** the answer (content first, then sources).

---

## Screens (designed — reproduce pixel-perfectly)

### 1. Marketing landing (`/`)
**Purpose:** intrigue → demonstrate the sourcing promise → frictionless start. **No fabricated social proof** (no testimonials, user counts, logos).
**Layout (desktop, ~1100px content):**
- **Nav** (padding `20px 40px`, bottom border `#ece6da`): emblem + wordmark left; "How it works", "What's inside", and a navy "Start studying" button (`#1f3a5f`, white, radius 3, `10px 18px`) right.
- **Hero** (centered, `60px 40px 40px`): a pill eyebrow — teal dot + "Only your course materials. Nothing else." (white pill, 1px `#d8e0da`); H1 hero serif "Every answer, traced back to your own course materials." (`#16213e`, max-width 740); 18px sub `#5c584d` max-width 560; primary CTA "Start studying — free" + a text link "See how sourcing works →" (underline `#cfd8d2`); reassurance line "No login. No account. Nothing stored on a server."
- **Live trust preview** (band `#f6f4ee`, `40px`): italic serif kicker "A real answer looks like this", then a real example answer card with **working pinpoint chips** beside a mini source panel. This is the demo of the promise — it must use the same chip/source components as the app.
- **What's inside** (`36px 40px`): 4 cards (Ask / Practice / Model answers / Exam) — serif 17 head + 13 caption, white, 1px `#e7e3d9`, radius 4.
- **Footer:** compliance line "A study aid, not legal advice. For practice and revision, not live assessment." (12px `#9a9486`).
- Also include (per product spec, lay out in the same system): a **"How it works" 3-step** band and a **closing CTA**.

### 2. Study · Ask — desktop + mobile (the everyday mode)
**Purpose:** ask a plain question → get a formatted, sourced answer.
**App shell (reused by all modes):**
- **Header** (`14px 24px`, white, border `#ece6da`): emblem + wordmark; right side = **usage meter** ("Free sessions" label + an 88×7 spend bar, filled teal to ~38%) and a subtle **"Use your own key"** link (navy, 1px underline `#cfd8d2`).
- **Mode switcher** (`10px 18px`, band `#fdfcf8`): 6 tabs — **Ask · Practice · Model answers · Exam · Explain · Progress**. Active = navy fill, white text, radius 3; inactive = `#5c584d` text. **Each tab ≥44px touch target.** On **mobile** this is a single horizontal **scrolling** row (`overflow-x:auto; white-space:nowrap`) — **never wraps to two lines**; hide the scrollbar.
- **Footer:** "A study aid, not legal advice. For practice, not live assessment."

**Ask body — desktop (2-col `1fr / 372px`):**
- Left (`28px 30px`, right border `#ece6da`): the asked question in a white pill row with a navy "Ask" button; an "Answer" label (serif 13, uppercase, teal, `.04em`); answer paragraphs at 16/1.75 `#23221d` with inline pinpoint chips; and a **"Not covered" notice** at the end.
- Right: the **source panel** with 3 cards (RULES Li, NOTES Sem 21, MODEL Q3), first pre-highlighted.

**Ask body — mobile (375):** header → scrolling mode row → asked question → "Answer" + paragraphs with chips → "Sources" → stacked source cards. Body 15/1.7; chips remain ≥44px hit area.

**"Not covered" notice** (integrity, not error): row with an outline info glyph (`#b08a3a`), heading "Not covered in your materials" (`#5a4818` 600), and a calm explanation. Container: 1px `#e0dccf`, **left border 3px `#c2a86a`**, background `#faf7ef` (`#fff` when inside the feedback panel), radius 4. Never red, never an error icon.

### 3. Study · Practice + feedback
**Purpose:** pick topic + type → attempt → get marked.
- **Topic/type tags** (pills, radius 100): active navy fill/white; inactive white, `#5c584d`, 1px `#e0dccf` ("Unreasonableness", "Hypothetical", "Essay").
- **Question card:** serif kicker "Your question" (teal), prompt set in serif 17/1.6 `#16213e`, white card.
- **Attempt editor:** white, 1px `#e0dccf`, radius 6; body text area (min-height 120) + a footer row with a **live word count** ("248 words · autosaved", `#9a9486`) and a **teal** "Submit for marking" button.
- **Feedback panel (right):** 
  - **Rubric score** reveal: a teal progress **ring** (108×108, track `#ece6da`, stroke 9, `stroke-linecap:round`) with the number in serif 34 `#16213e` and "/ 100" caption; a one-line encouraging verdict in teal. Make the reveal feel earned (animate the ring sweep + count-up).
  - **✓ Spotted** (`#1f6b3a`) and **○ Missed** (`#a05a1a`) blocks.
  - **Authority check** flag: calls out anything the student cited that **isn't** in the course materials (e.g. "You cited *Carltona* — that's not in your course materials."). Same flag styling as "not covered" (gold left border).
  - **3 next actions** as tappable rows (navy text, white, 1px `#e0dccf`).

---

## Surfaces specified but NOT yet pixel-designed
These are part of the product and the shell/components above; they are **not** in the HTML reference yet. Build them in the same system; we can produce hi-fi frames on request.
- **Explain** — look up a ground/case/concept → a short, sourced explanation (Ask shell, single concept in, sourced answer out).
- **Model answers** — paste a prompt → a worked answer (IRAC for problems; contention → both sides → preferred for essays), **sourced throughout** with the same chips/source panel.
- **Exam** — timed mock: setup (topic / type / minutes) → **live countdown + word budget + pace indicator (ahead / on-track / behind)** → submit → feedback. The countdown is a high-attention moment: focused, a little urgent, never anxiety-inducing. Suggested treatment: a fixed top bar with mono countdown, a word-budget meter, and a pace chip that shifts teal→navy→gold without alarm-red.
- **Progress** — per-topic stats, a "practise your weak area" nudge with a one-tap action, recent attempts, and **export/import** (single-device; nothing on a server). Subtle motivation only — no badges/confetti/mascots.

---

## States to build (§10 of the brief — for every generative surface)
- **Loading (~10–30s):** intentional, calm. Use a **skeleton/streaming** treatment for the answer and source cards (shimmer on `#f6f4ee`), not a frozen spinner. Source cards can populate as they resolve.
- **Empty / day-zero:** purposeful, not a void. Ask = example prompts to tap. Progress = a welcoming "your progress will build here" with one starter action. Source panel before a question = a quiet explainer of RULES/NOTES/MODEL.
- **Error:**
  - **Rate-limited / service unavailable:** calm retry, no jargon.
  - **Free allowance reached:** gentle, non-naggy → "You've used your free sessions. Add your own key to keep studying." with the **"Use your own key"** path. The usage meter is the honest, ongoing indicator (spend bar; or "using your own key").
- **Not covered:** integrity-forward (see component above) — care, not failure.
- **Success:** the populated answer + highlighted source, the score reveal.

---

## Interactions & behavior
- **Chip → source:** click a pinpoint chip → reset any highlighted card in *that* panel → highlight the matching card (`box-shadow: 0 0 0 2px #0f766e, 0 12px 28px rgba(0,0,0,.16)`, `translateY(-1px)`) → smooth-scroll it into view. One highlight per panel. On load, pre-highlight the first card. (See the inline script in the reference for exact logic.)
- **Mode switcher:** client-side route/tab change; preserves usage meter; mobile row scrolls horizontally.
- **Practice submit:** word count updates live; "Submit for marking" → loading → score reveal (animate ring + count-up over ~600–800ms).
- **Transitions:** chips `.15s`; source-card highlight `.18s`; keep everything subtle (no large motion, no confetti).
- **Responsive:** mobile-first; excellent at **375×812**; desktop is the 2-col split. Source panel moves below content on mobile.

## State management (guidance for the codebase)
- `mode` (Ask | Practice | ModelAnswers | Exam | Explain | Progress).
- Per query: `status` (idle | loading | streaming | success | not_covered | error), `answer`, `sources[]` (each: `role` RULES|NOTES|MODEL, `authority`, `pinpoint`, `location`, `passage`), `selectedSourceId`.
- Practice/Exam: `attemptText`, `wordCount`, `feedback` (score 0–100, spotted[], missed[], structureNotes, authorityFlags[], nextActions[3]).
- Exam: `durationMin`, `remaining`, `wordBudget`, `pace` (ahead|on_track|behind).
- Usage: `freeRemaining` / `usingOwnKey`. Progress + attempts persisted **locally** (single device); export/import as a file. No server storage.

## Accessibility (WCAG AA)
- Contrast: all text pairings meet AA on their backgrounds; keep finest print ≥12px and on `#9a9486` or darker over paper.
- Visible focus rings on chips, tabs, buttons, dismiss controls.
- Chips and mode tabs must be **obviously interactive** and **≥44px** touch targets.
- Chips: render as `<button>` with `aria-label` naming the source (e.g. "Source: Minister v Li, Seminar 21"); on activation move focus/scroll to the highlighted card; respect `prefers-reduced-motion` (skip the scroll/lift animation).

---

## PWA / favicon / icon wiring
Files are in `brand/`. In the Next.js app, put the PNG/SVG icons under `public/icons/` and `site.webmanifest` + `og-image.png` where referenced below.

**Head (or Next.js `metadata`):**
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#1f3a5f">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```
- `favicon.svg` — primary, scalable (all modern browsers).
- `favicon-16/32/48.png` — raster fallbacks. (If you need a legacy `favicon.ico`, generate it from `favicon-32.png`.)
- `apple-touch-icon.png` — 180×180 (iOS rounds corners itself).
- `icon-192.png`, `icon-512.png` — PWA "any".
- `maskable-192.png`, `maskable-512.png` — PWA "maskable" (mark sits inside the safe zone; navy fills the bleed).
- `og-image.png` — 1200×630 social share.
- Background/theme colors in the manifest: `#fbfaf7` / `#1f3a5f`.

---

## Copy rules & compliance (non-negotiable)
- **Never** reference "AI", "LLM", models, or any vendor anywhere user-visible. The student sees a study companion, not machinery.
- Keep the compliance line present: **"A study aid, not legal advice; for practice/revision, not live assessment."**
- Tone: plain-English, calm, quietly encouraging — never patronising, no hype, no gamification gimmicks.

## Files in this bundle
- `direction-a-reference.html` — the designed screens (live chip → source). Start here.
- `tokens/theme.css` — Tailwind v4 `@theme` tokens (paste into globals).
- `tokens/tokens.json` — raw token values.
- `brand/favicon.svg`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-192/512.png` — icon set.
- `brand/site.webmanifest` — PWA manifest.
- `brand/og-image.png` — 1200×630 social share image.

Sample legal content (Li, Wednesbury, the visa-cancellation hypothetical) is **illustrative** of an Australian administrative-law unit — replace with the actual course corpus; never introduce authorities outside the student's materials.
