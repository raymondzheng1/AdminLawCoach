import { describe, it, expect } from "vitest";
import {
  normalizeForMatch,
  tokenIncludes,
  extractAuthorities,
  extractPinpoints,
  extractCitationsFromProse,
} from "@/lib/corpus/patterns.mjs";

describe("normalizeForMatch", () => {
  it("lowercases, folds curly quotes/dashes, collapses punctuation to single spaces", () => {
    expect(normalizeForMatch("Drake v Minister (No 1)")).toBe("drake v minister no 1");
    expect(normalizeForMatch("Sem 23 s11–12")).toBe("sem 23 s11 12");
    expect(normalizeForMatch("Plaintiff S157’s case")).toBe("plaintiff s157 s case");
  });
});

describe("tokenIncludes", () => {
  it("matches on token boundaries, not substrings", () => {
    const hay = normalizeForMatch("In Li the court held it was unreasonable");
    expect(tokenIncludes(hay, "li")).toBe(true);
    // 'li' must NOT match inside 'applies' / 'policy'
    expect(tokenIncludes(normalizeForMatch("the policy applies"), "li")).toBe(false);
  });
  it("is false for the empty needle", () => {
    expect(tokenIncludes("anything", "")).toBe(false);
  });
});

describe("extractAuthorities", () => {
  it("extracts case names and statute titles, dedupes, prefers fuller form", () => {
    const text =
      "The test in Kioa v West applies. See also Drake v Minister for Immigration. " +
      "Under the VCAT Act 1998 (Vic) s 42(1) and the Judiciary Act 1903 (Cth).";
    const found = extractAuthorities(text);
    const names = found.map((a) => a.name);
    expect(names.some((n) => /Kioa v West/.test(n))).toBe(true);
    expect(found.some((a) => a.type === "statute" && /VCAT Act 1998 \(Vic\)/.test(a.name))).toBe(true);
    expect(found.some((a) => a.type === "statute" && /Judiciary Act 1903 \(Cth\)/.test(a.name))).toBe(true);
  });

  it("treats italic single-name runs as cases but rejects generic words", () => {
    const fromEm = extractAuthorities("body text", ["Kirk", "Conclusion", "Li"]);
    const names = fromEm.map((a) => a.name);
    expect(names).toContain("Kirk");
    expect(names).not.toContain("Conclusion"); // stopword
    expect(names).not.toContain("Li"); // too short (len < 3)
  });

  it("strips an embedded (Sem …) pinpoint from a case name", () => {
    const found = extractAuthorities("x", ["Bare (Sem 18 s7–10) v IBAC"]);
    expect(found[0]?.name).toBe("Bare v IBAC");
  });
});

describe("extractPinpoints", () => {
  it("captures Sem N sM course pinpoints", () => {
    expect(extractPinpoints("see Sem 5 s7 and Sem 23 s11–12")).toEqual(
      expect.arrayContaining(["Sem 5 s7", "Sem 23 s11–12"]),
    );
  });
});

describe("extractCitationsFromProse", () => {
  it("flags case, reporter, statute and foreign-court shapes for the verifier body-scan", () => {
    const cites = extractCitationsFromProse(
      "Relying on Smith v Jones (2099) 300 ALR 1 and the Made Up Act 2099 (Cth); cf R v Howe [1987] UKHL 1.",
    );
    const kinds = cites.map((c) => c.kind);
    expect(kinds).toContain("case");
    expect(kinds).toContain("reporter");
    expect(kinds).toContain("statute");
    expect(kinds).toContain("foreign");
  });
});
