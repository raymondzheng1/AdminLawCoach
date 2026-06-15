import {
  StoreSchema,
  EMPTY_STORE,
  type Store,
  type StoredAttempt,
  type StoredQuestion,
  type Progress,
} from "@/lib/schemas/storage";

/** localStorage adapter (client-only). All state is single-device by design (PRD §6.6). */
const KEY = "alc_store_v1";
const MAX_ITEMS = 200;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(custom?: StorageLike): StorageLike | null {
  if (custom) return custom;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return null;
}

export function loadStore(custom?: StorageLike): Store {
  const s = getStorage(custom);
  if (!s) return structuredClone(EMPTY_STORE);
  const raw = s.getItem(KEY);
  if (!raw) return structuredClone(EMPTY_STORE);
  try {
    const parsed = StoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : structuredClone(EMPTY_STORE);
  } catch {
    return structuredClone(EMPTY_STORE);
  }
}

export function saveStore(store: Store, custom?: StorageLike): void {
  const s = getStorage(custom);
  if (!s) return;
  s.setItem(KEY, JSON.stringify(store));
}

export function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Math.floor((typeof performance !== "undefined" ? performance.now() : 0) * 1000)}`;
}

function bumpTopic(progress: Progress, topicId: string | undefined, patch: (p: { practiced: number; attempts: number; scoredCount: number; scoreSum: number; lastScore?: number }) => void): Progress {
  if (!topicId) return progress;
  const cur = progress.byTopic[topicId] ?? { practiced: 0, attempts: 0, scoredCount: 0, scoreSum: 0 };
  const next = { ...cur };
  patch(next);
  return { byTopic: { ...progress.byTopic, [topicId]: next } };
}

export function addQuestion(store: Store, q: StoredQuestion): Store {
  return {
    ...store,
    questions: [q, ...store.questions].slice(0, MAX_ITEMS),
    progress: bumpTopic(store.progress, q.topicId, (p) => {
      p.practiced += 1;
    }),
  };
}

export function addAttempt(store: Store, a: StoredAttempt): Store {
  return {
    ...store,
    attempts: [a, ...store.attempts].slice(0, MAX_ITEMS),
    progress: bumpTopic(store.progress, a.topicId, (p) => {
      p.attempts += 1;
      if (typeof a.score === "number") {
        p.scoredCount += 1;
        p.scoreSum += a.score;
        p.lastScore = a.score;
      }
    }),
  };
}

export function averageScore(progress: Progress, topicId: string): number | null {
  const t = progress.byTopic[topicId];
  if (!t || t.scoredCount === 0) return null;
  return t.scoreSum / t.scoredCount;
}

/**
 * The "practise your weak area" nudge (PRD §6.6): among candidate topics, the one
 * with the lowest average score; if none scored yet, the least-practised one.
 */
export function weakestTopic(progress: Progress, candidateTopicIds: string[]): string | null {
  if (candidateTopicIds.length === 0) return null;
  const scored = candidateTopicIds
    .map((id) => ({ id, avg: averageScore(progress, id) }))
    .filter((x): x is { id: string; avg: number } => x.avg !== null);
  if (scored.length > 0) {
    scored.sort((a, b) => a.avg - b.avg);
    return scored[0]!.id;
  }
  // Nobody scored — suggest the least-practised topic.
  const byPractice = candidateTopicIds
    .map((id) => ({ id, practiced: progress.byTopic[id]?.practiced ?? 0 }))
    .sort((a, b) => a.practiced - b.practiced);
  return byPractice[0]?.id ?? null;
}

export function exportJson(store: Store): string {
  return JSON.stringify(store, null, 2);
}

export function importJson(raw: string): Store | null {
  try {
    const parsed = StoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
