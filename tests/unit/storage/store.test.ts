import { describe, it, expect } from "vitest";
import {
  loadStore,
  saveStore,
  addQuestion,
  addAttempt,
  weakestTopic,
  averageScore,
  exportJson,
  importJson,
} from "@/lib/storage";
import { EMPTY_STORE, type StoredQuestion, type StoredAttempt } from "@/lib/schemas/storage";

class FakeStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
}

const q = (topicId: string): StoredQuestion => ({
  id: "q1",
  createdAt: 1,
  topicId,
  type: "hypothetical",
  title: "t",
  prompt: "p",
});
const att = (topicId: string, score?: number): StoredAttempt => ({
  id: "a1",
  createdAt: 1,
  topicId,
  kind: "hypothetical",
  question: "qq",
  attemptText: "answer",
  wordCount: 1,
  score,
});

describe("store persistence", () => {
  it("round-trips through a storage adapter and rejects corrupt data", () => {
    const s = new FakeStorage();
    const store = addQuestion(structuredClone(EMPTY_STORE), q("unreasonableness"));
    saveStore(store, s);
    expect(loadStore(s).questions).toHaveLength(1);

    s.setItem("alc_store_v1", "{not json");
    expect(loadStore(s).questions).toHaveLength(0); // falls back to empty
  });
});

describe("progress accounting", () => {
  it("updates practiced/attempts and averages scores per topic", () => {
    let store = structuredClone(EMPTY_STORE);
    store = addQuestion(store, q("unreasonableness"));
    store = addAttempt(store, att("unreasonableness", 70));
    store = addAttempt(store, att("unreasonableness", 90));
    expect(store.progress.byTopic["unreasonableness"]!.practiced).toBe(1);
    expect(store.progress.byTopic["unreasonableness"]!.attempts).toBe(2);
    expect(averageScore(store.progress, "unreasonableness")).toBe(80);
  });
});

describe("weakestTopic nudge", () => {
  it("prefers the lowest-average scored topic", () => {
    let store = structuredClone(EMPTY_STORE);
    store = addAttempt(store, att("a", 90));
    store = addAttempt(store, att("b", 40));
    expect(weakestTopic(store.progress, ["a", "b"])).toBe("b");
  });
  it("falls back to the least-practised topic when nothing is scored", () => {
    let store = structuredClone(EMPTY_STORE);
    store = addQuestion(store, { ...q("a"), id: "x" });
    expect(weakestTopic(store.progress, ["a", "b"])).toBe("b"); // b never practised
  });
});

describe("export / import", () => {
  it("round-trips and rejects invalid imports", () => {
    const store = addAttempt(structuredClone(EMPTY_STORE), att("a", 50));
    const json = exportJson(store);
    expect(importJson(json)?.attempts).toHaveLength(1);
    expect(importJson("garbage")).toBeNull();
  });
});
