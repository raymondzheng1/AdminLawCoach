/**
 * Exam mode — pure word/time budgeting with an injected clock so it is unit-testable
 * (§4.4). No globals; callers pass `now`.
 */

/** Sustained composing speed for exam-style legal answers (words/minute). Conservative. */
export const DEFAULT_WPM = 22;

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/** Suggested word budget for a timed answer. */
export function wordBudget(minutes: number, wpm: number = DEFAULT_WPM): number {
  return Math.max(0, Math.round(minutes * wpm));
}

export interface ExamClock {
  elapsedMs: number;
  remainingMs: number;
  durationMs: number;
  expired: boolean;
  fractionRemaining: number; // 1 → just started, 0 → time up
}

/** Compute timer state from a start time + duration, relative to `now` (ms epoch). */
export function examClock(now: number, startedAt: number, durationMinutes: number): ExamClock {
  const durationMs = Math.max(0, durationMinutes) * 60_000;
  const elapsedMs = Math.max(0, now - startedAt);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  return {
    elapsedMs,
    remainingMs,
    durationMs,
    expired: durationMs > 0 && elapsedMs >= durationMs,
    fractionRemaining: durationMs > 0 ? remainingMs / durationMs : 0,
  };
}

/** mm:ss for a remaining-ms value. */
export function formatRemaining(remainingMs: number): string {
  const total = Math.floor(remainingMs / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Pace assessment: are you on track for the word budget given time elapsed? */
export function paceStatus(wordsWritten: number, budget: number, clock: ExamClock): "ahead" | "on-track" | "behind" {
  if (budget <= 0 || clock.durationMs <= 0) return "on-track";
  const expectedByNow = budget * (1 - clock.fractionRemaining);
  if (wordsWritten >= expectedByNow * 1.1) return "ahead";
  if (wordsWritten <= expectedByNow * 0.75) return "behind";
  return "on-track";
}
