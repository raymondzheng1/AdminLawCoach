import {
  corpusContainsNormalised,
  findChunkIdsForNormalised,
  getChunk,
} from "@/lib/corpus";
import { normalizeForMatch, extractCitationsFromProse } from "@/lib/corpus/patterns.mjs";
import type { GroundedAnswer, Feedback, Citation } from "@/lib/schemas/answer";

/**
 * The grounding verifier (§7, §11.2). Four gates, each anchored on the COMMITTED
 * corpus, not a curated list:
 *   1. structure        — required IRAC/essay shape for the mode
 *   2. citation-allowlist — every cited authority is present in the corpus
 *   3. jurisdiction      — no out-of-(AU)-jurisdiction authority leaks in
 *   4. pinpoint-binding  — every citation resolves to a real corpus chunk
 * Failures are content failures → the runner regenerates from clean context; it
 * never patches a failed answer in-loop (laundering a wrong draft past the gate).
 */
export type Mode = "ask" | "explain" | "hypo" | "essay";
export type Gate = "structure" | "citation" | "jurisdiction" | "pinpoint";

export interface VerificationFailure {
  gate: Gate;
  detail: string;
}

export interface VerifyResult {
  ok: boolean;
  failures: VerificationFailure[];
  answer: GroundedAnswer; // possibly rebound (chunkId fixes) — a structural, non-content repair
}

const STRUCTURE_MARKERS: Record<Mode, { re: RegExp; label: string }[]> = {
  ask: [],
  explain: [],
  hypo: [
    { re: /\bissue/i, label: "Issue" },
    { re: /\b(rule|ratio)/i, label: "Rule" },
    { re: /\bappl(y|ication|ies|ied)/i, label: "Application" },
    { re: /\bconclu/i, label: "Conclusion" },
  ],
  essay: [
    { re: /\bcontention|contend/i, label: "Contention" },
    { re: /\bagainst/i, label: "Case against" },
    { re: /\bprefer/i, label: "Preferred position" },
  ],
};

function checkStructure(answer: GroundedAnswer, mode: Mode, failures: VerificationFailure[]): void {
  const body = answer.answerMarkdown;
  if (mode === "ask" || mode === "explain") {
    if (body.trim().length < 20) failures.push({ gate: "structure", detail: "answer too short / empty" });
    return;
  }
  for (const m of STRUCTURE_MARKERS[mode]) {
    if (!m.re.test(body)) failures.push({ gate: "structure", detail: `missing ${m.label} section` });
  }
}

/** Each cited authority must resolve into the committed corpus. */
function checkCitationAllowlist(citations: Citation[], failures: VerificationFailure[]): void {
  for (const c of citations) {
    const norm = normalizeForMatch(c.authority);
    if (!corpusContainsNormalised(norm)) {
      failures.push({ gate: "citation", detail: `authority not in corpus: "${c.authority}"` });
    }
  }
}

/**
 * Scan the prose for authority-looking tokens the model may have asserted without
 * grounding. Foreign-court tokens are a jurisdiction breach. For hypo answers,
 * bare "X v Y" party names are the (fictional) scenario, so they are not flagged.
 */
function checkProse(body: string, mode: Mode, failures: VerificationFailure[]): void {
  for (const cite of extractCitationsFromProse(body)) {
    if (cite.kind === "foreign") {
      failures.push({ gate: "jurisdiction", detail: `out-of-jurisdiction authority: "${cite.token}"` });
      continue;
    }
    if (cite.kind === "case" && mode === "hypo") continue; // fictional parties allowed in a hypo answer
    const norm = normalizeForMatch(cite.token);
    if (!corpusContainsNormalised(norm)) {
      failures.push({ gate: "citation", detail: `ungrounded authority in prose: "${cite.token}"` });
    }
  }
}

/** Bind each citation to a real chunk that actually contains the authority. */
function checkPinpointBinding(
  citations: Citation[],
  contextChunkIds: Set<string>,
  failures: VerificationFailure[],
): Citation[] {
  return citations.map((c) => {
    if (!c.pinpoint || c.pinpoint.trim().length === 0) {
      failures.push({ gate: "pinpoint", detail: `missing pinpoint for "${c.authority}"` });
      return c;
    }
    const norm = normalizeForMatch(c.authority);
    const claimed = getChunk(c.chunkId);
    const claimedHolds = claimed ? normalizeForMatch(`${claimed.headingPath.join(" ")} ${claimed.text}`).includes(norm) : false;
    if (claimed && claimedHolds) return c;

    // Rebind: prefer a context chunk that contains the authority, else any corpus chunk.
    const candidates = findChunkIdsForNormalised(norm);
    const inContext = candidates.find((id) => contextChunkIds.has(id));
    const fixedId = inContext ?? candidates[0];
    if (fixedId) return { ...c, chunkId: fixedId };

    failures.push({ gate: "pinpoint", detail: `cannot bind "${c.authority}" to a corpus location` });
    return c;
  });
}

export interface VerifyOptions {
  mode: Mode;
  contextChunkIds: readonly string[];
}

export function verifyGroundedAnswer(answer: GroundedAnswer, opts: VerifyOptions): VerifyResult {
  const failures: VerificationFailure[] = [];

  // The honest "not covered" fallback is always valid output (never fabricate, §7.4).
  if (answer.notCovered) {
    return { ok: true, failures: [], answer: { ...answer, citations: [] } };
  }

  const contextSet = new Set(opts.contextChunkIds);
  checkStructure(answer, opts.mode, failures);
  checkCitationAllowlist(answer.citations, failures);
  checkProse(answer.answerMarkdown, opts.mode, failures);
  const reboundCitations = checkPinpointBinding(answer.citations, contextSet, failures);

  // A grounded answer with zero citations is suspect — require at least one anchor.
  if (answer.citations.length === 0) {
    failures.push({ gate: "citation", detail: "grounded answer has no citations" });
  }

  return { ok: failures.length === 0, failures, answer: { ...answer, citations: reboundCitations } };
}

/**
 * Feedback verification: the feedback's OWN citations must be grounded, but its
 * prose legitimately names the student's out-of-corpus authorities to flag them —
 * so we do NOT body-scan feedback prose.
 */
export function verifyFeedback(fb: Feedback): { ok: boolean; failures: VerificationFailure[]; feedback: Feedback } {
  const failures: VerificationFailure[] = [];
  if (fb.notCovered) return { ok: true, failures: [], feedback: { ...fb, citations: [] } };
  checkCitationAllowlist(fb.citations, failures);
  const rebound = checkPinpointBinding(fb.citations, new Set(), failures);
  return { ok: failures.length === 0, failures, feedback: { ...fb, citations: rebound } };
}
