import { describe, it, expect } from "vitest";
import { countWords, wordBudget, examClock, formatRemaining, paceStatus, DEFAULT_WPM } from "@/lib/exam";

describe("countWords", () => {
  it("counts whitespace-separated words, 0 for empty", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  one   two\nthree ")).toBe(3);
  });
});

describe("wordBudget", () => {
  it("scales with minutes and wpm", () => {
    expect(wordBudget(30)).toBe(30 * DEFAULT_WPM);
    expect(wordBudget(10, 25)).toBe(250);
  });
});

describe("examClock (injected clock)", () => {
  it("computes elapsed/remaining and expiry with a fixed now", () => {
    const start = 1_000_000;
    const mid = examClock(start + 10 * 60_000, start, 30); // 10 min into a 30-min exam
    expect(mid.expired).toBe(false);
    expect(mid.remainingMs).toBe(20 * 60_000);
    expect(mid.fractionRemaining).toBeCloseTo(20 / 30, 5);

    const done = examClock(start + 31 * 60_000, start, 30);
    expect(done.expired).toBe(true);
    expect(done.remainingMs).toBe(0);
  });
});

describe("formatRemaining", () => {
  it("formats mm:ss", () => {
    expect(formatRemaining(65_000)).toBe("1:05");
    expect(formatRemaining(600_000)).toBe("10:00");
  });
});

describe("paceStatus", () => {
  const start = 0;
  it("is behind when well under the expected words for time elapsed", () => {
    const clock = examClock(15 * 60_000, start, 30); // half-time
    expect(paceStatus(50, 600, clock)).toBe("behind"); // expected ~300
  });
  it("is ahead when comfortably over", () => {
    const clock = examClock(15 * 60_000, start, 30);
    expect(paceStatus(400, 600, clock)).toBe("ahead");
  });
});
