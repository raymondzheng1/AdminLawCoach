import { getCorpus, listTaxonomy } from "@/lib/corpus";
import { normalizeForMatch } from "@/lib/corpus/patterns.mjs";
import type { CorpusChunk, Role } from "@/lib/schemas/corpus";

/**
 * DB-free retrieval (§7.2 grounding engine, TECHNICAL_SPEC §6): BM25-lite keyword
 * selection over the committed chunks, capped by a token budget so per-call cost
 * stays well under the session cap. No vector DB (CLAUDE.md Don't).
 */
const STOPWORDS = new Set(
  "the a an of to in is are was were be been being and or for on at by with as it its this that these those what which who whom how does do did can could would should will may might must not no than then so such from into out over under more most less least about against between within".split(
    " ",
  ),
);

function tokenize(s: string): string[] {
  return normalizeForMatch(s)
    .split(" ")
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

interface Bm25Index {
  version: string;
  df: Map<string, number>;
  chunkTerms: Map<string, Map<string, number>>;
  chunkLen: Map<string, number>;
  avgLen: number;
  n: number;
}

let cached: Bm25Index | null = null;

function buildIndex(): Bm25Index {
  const { index } = getCorpus();
  const df = new Map<string, number>();
  const chunkTerms = new Map<string, Map<string, number>>();
  const chunkLen = new Map<string, number>();
  let total = 0;
  for (const c of index.chunks) {
    const terms = tokenize(`${c.headingPath.join(" ")} ${c.text}`);
    const tf = new Map<string, number>();
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    chunkTerms.set(c.id, tf);
    chunkLen.set(c.id, terms.length);
    total += terms.length;
  }
  return {
    version: index.corpusVersion,
    df,
    chunkTerms,
    chunkLen,
    avgLen: index.chunks.length ? total / index.chunks.length : 1,
    n: index.chunks.length,
  };
}

function getIndex(): Bm25Index {
  const v = getCorpus().index.corpusVersion;
  if (!cached || cached.version !== v) cached = buildIndex();
  return cached;
}

export interface RetrievalOptions {
  topicIds?: string[]; // restrict/boost to these taxonomy items' chunk locations
  preferRoles?: Role[]; // gentle boost for these roles (e.g. "model" for model answers)
  budgetChars?: number;
  maxChunks?: number;
  minScore?: number;
}

export interface RetrievalResult {
  chunks: CorpusChunk[];
  scores: number[];
  totalChars: number;
}

const K1 = 1.5;
const B = 0.75;

/** Score the corpus against a free-text query (and optional topic/role boosts). */
export function retrieve(query: string, opts: RetrievalOptions = {}): RetrievalResult {
  const { chunkById, index } = getCorpus();
  const idx = getIndex();
  const budgetChars = opts.budgetChars ?? 22_000;
  const maxChunks = opts.maxChunks ?? 14;
  const minScore = opts.minScore ?? 0;

  const boostIds = new Set<string>();
  if (opts.topicIds?.length) {
    const items = listTaxonomy().filter((t) => opts.topicIds!.includes(t.id));
    for (const t of items) for (const loc of t.locations) boostIds.add(loc);
  }

  const qTerms = tokenize(query);
  const scored: { id: string; score: number }[] = [];
  for (const c of index.chunks) {
    const tf = idx.chunkTerms.get(c.id)!;
    const len = idx.chunkLen.get(c.id) ?? 1;
    let s = 0;
    for (const term of qTerms) {
      const f = tf.get(term);
      if (!f) continue;
      const dfi = idx.df.get(term) ?? 1;
      const idf = Math.log(1 + (idx.n - dfi + 0.5) / (dfi + 0.5));
      s += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * len) / idx.avgLen)));
    }
    if (boostIds.has(c.id)) s += s > 0 ? s * 0.5 : 1.5; // topic relevance boost / floor
    if (opts.preferRoles?.includes(c.role)) s *= 1.15;
    if (s > minScore) scored.push({ id: c.id, score: s });
  }

  scored.sort((a, b) => b.score - a.score);

  const chunks: CorpusChunk[] = [];
  const scores: number[] = [];
  let totalChars = 0;
  for (const { id, score } of scored) {
    const c = chunkById.get(id);
    if (!c) continue;
    if (chunks.length >= maxChunks) break;
    if (totalChars + c.text.length > budgetChars && chunks.length > 0) break;
    chunks.push(c);
    scores.push(score);
    totalChars += c.text.length;
  }
  return { chunks, scores, totalChars };
}

/** Build a query from a taxonomy topic (for practice/model generation with no free text). */
export function retrieveForTopic(topicId: string, opts: RetrievalOptions = {}): RetrievalResult {
  const item = listTaxonomy().find((t) => t.id === topicId);
  const query = item ? item.label : topicId;
  return retrieve(query, { ...opts, topicIds: [topicId, ...(opts.topicIds ?? [])] });
}
