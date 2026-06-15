/**
 * Model selection (§11 — keys server-side only). Defaults chosen for the Tier-B
 * cost cap: Sonnet 4.6 is the best quality/cost balance for grounded legal IRAC;
 * Haiku 4.5 is the cheap structural-repair model. Override via env.
 */
export const DEFAULT_MODEL = process.env.ADMINLAW_DEFAULT_MODEL ?? "claude-sonnet-4-6";
export const SMALL_MODEL = process.env.ADMINLAW_SMALL_MODEL ?? "claude-haiku-4-5";
