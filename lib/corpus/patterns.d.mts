// Type declarations for patterns.mjs — keeps the single JS source of truth (§3.1)
// importable from strict-TS callers (verifier, retrieval) without an allowJs build.

export function normalizeForMatch(s: string): string;
export function normalizeAuthority(s: string): string;
export function tokenIncludes(haystackNorm: string, needleNorm: string): boolean;

export interface ExtractedAuthority {
  type: "case" | "statute";
  name: string;
}
export function extractAuthorities(text: string, emText?: string[]): ExtractedAuthority[];

export function extractPinpoints(text: string): string[];

export interface ProseCitation {
  kind: "case" | "reporter" | "statute" | "foreign";
  token: string;
}
export function extractCitationsFromProse(text: string): ProseCitation[];
