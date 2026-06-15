// @ts-check
/**
 * Shared corpus-extraction patterns — the SINGLE source of truth (§3.1, §3.3)
 * for both the build script (scripts/build-corpus.mjs) and the runtime verifier
 * (lib/verification). Written as plain ESM JS so the .mjs build script can import
 * it directly; TS callers import it through the adjacent patterns.d.mts.
 *
 * Correctness note: the verifier never trusts a curated name list alone — it
 * anchors on whether a cited authority's NORMALISED form is present in the
 * committed corpus text (see corpusContainsNormalised). These extractors decide
 * what to SURFACE (browse lists, taxonomy) and what to SCAN FOR in generated
 * prose; extraction precision affects UX, not the grounding guarantee.
 */

const AU_JURIS = "Cth|Vic|NSW|Qld|SA|WA|Tas|NT|ACT";

/** Build the regexes fresh each call so global-flag lastIndex never leaks across calls. */
function makeRegexes() {
  return {
    // "Drake v Minister", "Kioa v West", "Plaintiff S157 v Commonwealth"
    caseVs:
      /\b[A-Z][A-Za-z'’.-]+(?: [A-Z][A-Za-z0-9'’.-]+){0,4} v\.? [A-Z][A-Za-z0-9'’.-]+(?: [A-Z][A-Za-z0-9'’.-]+){0,6}/g,
    // "Re McBain", "Ex parte Australian Catholic Bishops Conference"
    reEx: /\b(?:Re|Ex parte) [A-Z][A-Za-z'’.-]+(?: [A-Z][A-Za-z'’.-]+){0,5}/g,
    // Reporter-style citations: "(2008) 248 ALR 390" / "[2002] HCA 11"
    reporter: /(?:\(\d{4}\) \d+ [A-Z]{2,6} \d+|\[\d{4}\] [A-Z]{2,6} \d+)/g,
    // Statute titles: "Administrative Review Tribunal Act 2024 (Cth)", "VCAT Act 1998 (Vic)"
    actName: new RegExp(
      `\\b[A-Z][A-Za-z]+(?: [A-Z()&][A-Za-z()&]*)* Act \\d{4}(?: \\((?:${AU_JURIS})\\))?`,
      "g",
    ),
    // Section refs carrying a subsection or an Act abbreviation — the meaningful ones.
    sectionAbbrev: /\b(?:ART|ADJR|VCAT|ALA|HCA) s\.? ?\d+[A-Za-z]*(?:\([0-9A-Za-z]+\))*/g,
    sectionSub: /\bs\.? ?\d+[A-Za-z]*\((?:\d+|[ivxlc]+|[a-z])\)(?:\([0-9A-Za-z]+\))*/g,
    // Course pinpoint labels: "Sem 5 s7", "Sem 23 s11–12", "Sem 21 s9"
    pinpoint: /\bSem ?\d+ ?s ?[0-9]+(?:[–-][0-9]+)?/g,
    // Obvious out-of-(AU)-jurisdiction reporter markers (foreign-court guard).
    foreignReporter: /\b(?:UKHL|UKSC|EWCA|EWHC|US|SCC|NZSC|NZCA|SCR|QB|AC|WLR|All ER) \d+/g,
  };
}

/** Curly quotes / dashes → ascii; lowercase; collapse all non-alphanumerics to single spaces. */
export function normalizeForMatch(s) {
  return String(s)
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Display-stable form of an authority/pinpoint label (collapse internal whitespace). */
export function normalizeAuthority(s) {
  return String(s).replace(/\s+/g, " ").replace(/[’]/g, "’").trim();
}

/**
 * Token-boundary membership test over normalized text. Prevents short tokens
 * ("li", "bare", "acf") from matching as substrings of unrelated words
 * ("applies", "embarked", "factual"). Both args must be normalizeForMatch output.
 */
export function tokenIncludes(haystackNorm, needleNorm) {
  if (!needleNorm) return false;
  return ` ${haystackNorm} `.includes(` ${needleNorm} `);
}

/** Strip a course-pinpoint or "(No 2)"-style embedded parenthetical that crept into a case name. */
function cleanCaseName(name) {
  return normalizeAuthority(name.replace(/\(\s*Sem[^)]*\)/gi, " ").replace(/\s+,/g, ","));
}

// Generic capitalised words that are NOT case names (reduce italic-run false positives).
const CASE_STOPWORDS = new Set(
  [
    "Application", "Applications", "Decision", "Decisions", "Conclusion", "Issue", "Issues",
    "Rule", "Rules", "Nature", "Standing", "Remedies", "Remedy", "Note", "Notes", "Step",
    "Jurisdiction", "Grounds", "Ground", "Breach", "Consequences", "Example", "Examples",
    "Held", "Facts", "Analysis", "Introduction", "Background", "Summary", "Overview",
  ].map((w) => w.toLowerCase()),
);

function uniqStrings(arr) {
  return Array.from(new Set(arr));
}

function looksLikeCase(text) {
  const t = text.trim();
  if (t.length < 3 || t.length > 80) return false;
  if (/\bAct\b/.test(t)) return false; // a statute, not a case
  if (/^s\.? ?\d/.test(t)) return false; // a section ref
  if (!/[A-Z]/.test(t[0] ?? "")) return false;
  const isMultiParty = / v\.? | v$|Re |Ex parte |Plaintiff/.test(t);
  const isSingleName = /^[A-Z][A-Za-z'’]+$/.test(t);
  if (isSingleName && CASE_STOPWORDS.has(t.toLowerCase())) return false;
  return isMultiParty || isSingleName;
}

/**
 * Extract candidate authorities from a block of corpus text.
 * @param {string} text
 * @param {string[]} [emText] italicised runs (mammoth <em>) — strongest case-name signal
 * @returns {{type: "case"|"statute", name: string}[]}
 */
export function extractAuthorities(text, emText = []) {
  const re = makeRegexes();
  /** @type {{type: "case"|"statute", name: string}[]} */
  const out = [];

  for (const em of emText) {
    const name = cleanCaseName(em);
    if (looksLikeCase(name)) out.push({ type: "case", name });
  }
  for (const m of text.matchAll(re.caseVs)) out.push({ type: "case", name: cleanCaseName(m[0]) });
  for (const m of text.matchAll(re.reEx)) out.push({ type: "case", name: cleanCaseName(m[0]) });
  for (const m of text.matchAll(re.actName)) out.push({ type: "statute", name: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.sectionAbbrev)) out.push({ type: "statute", name: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.sectionSub)) out.push({ type: "statute", name: normalizeAuthority(m[0]) });

  // dedupe by normalized key, keep first (case preferred over statute on tie via order above)
  const seen = new Set();
  /** @type {{type: "case"|"statute", name: string}[]} */
  const deduped = [];
  for (const a of out) {
    const key = a.type + "::" + normalizeForMatch(a.name);
    if (a.name.length < 2 || seen.has(key)) continue;
    seen.add(key);
    deduped.push(a);
  }
  return deduped;
}

/** Extract course pinpoint labels ("Sem N sM"). */
export function extractPinpoints(text) {
  const re = makeRegexes();
  return uniqStrings(Array.from(text.matchAll(re.pinpoint), (m) => normalizeAuthority(m[0])));
}

/**
 * Extract authority-looking tokens from a GENERATED answer's prose, for the
 * verifier's body-scan. Conservative: only high-confidence citation shapes so a
 * legitimately-grounded answer is not over-rejected.
 * @param {string} text
 * @returns {{kind: "case"|"reporter"|"statute"|"foreign", token: string}[]}
 */
export function extractCitationsFromProse(text) {
  const re = makeRegexes();
  /** @type {{kind: "case"|"reporter"|"statute"|"foreign", token: string}[]} */
  const out = [];
  for (const m of text.matchAll(re.caseVs)) out.push({ kind: "case", token: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.reEx)) out.push({ kind: "case", token: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.reporter)) out.push({ kind: "reporter", token: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.actName)) out.push({ kind: "statute", token: normalizeAuthority(m[0]) });
  for (const m of text.matchAll(re.foreignReporter)) out.push({ kind: "foreign", token: normalizeAuthority(m[0]) });
  const seen = new Set();
  return out.filter((c) => {
    const k = c.kind + "::" + normalizeForMatch(c.token);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
