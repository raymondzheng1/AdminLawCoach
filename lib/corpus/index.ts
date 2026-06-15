import rawIndex from "@/corpus/index.json";
import { normalizeForMatch } from "@/lib/corpus/patterns.mjs";
import {
  CorpusIndexSchema,
  type CorpusIndex,
  type CorpusChunk,
  type Authority,
  type Pinpoint,
  type TaxonomyItem,
} from "@/lib/schemas/corpus";

interface LoadedCorpus {
  index: CorpusIndex;
  chunkById: Map<string, CorpusChunk>;
  authorityById: Map<string, Authority>;
  /** chunkId → normalized "<headingPath> <text>" used for membership tests. */
  normByChunk: Map<string, string>;
  /** space-padded concatenation of all normalized chunk text for token-boundary substring checks. */
  paddedBlob: string;
}

function build(index: CorpusIndex): LoadedCorpus {
  const chunkById = new Map(index.chunks.map((c) => [c.id, c]));
  const authorityById = new Map(index.authorities.map((a) => [a.id, a]));
  const normByChunk = new Map(
    index.chunks.map((c) => [c.id, normalizeForMatch(`${c.headingPath.join(" ")} ${c.text}`)]),
  );
  const paddedBlob = " " + Array.from(normByChunk.values()).join(" ") + " ";
  return { index, chunkById, authorityById, normByChunk, paddedBlob };
}

let cached: LoadedCorpus | null = null;

export function getCorpus(): LoadedCorpus {
  if (!cached) cached = build(CorpusIndexSchema.parse(rawIndex));
  return cached;
}

/** Test seam: inject a fixture corpus (validated) so route/verifier tests stay DB-free (§4.4). */
export function __setCorpusForTests(raw: unknown): void {
  cached = build(CorpusIndexSchema.parse(raw));
}
export function __resetCorpusForTests(): void {
  cached = null;
}

export function getChunk(id: string): CorpusChunk | undefined {
  return getCorpus().chunkById.get(id);
}
export function getChunks(ids: readonly string[]): CorpusChunk[] {
  const c = getCorpus();
  return ids.map((id) => c.chunkById.get(id)).filter((x): x is CorpusChunk => Boolean(x));
}
export function getAuthorityById(id: string): Authority | undefined {
  return getCorpus().authorityById.get(id);
}
export function listAuthorities(): Authority[] {
  return getCorpus().index.authorities;
}
export function listPinpoints(): Pinpoint[] {
  return getCorpus().index.pinpoints;
}
export function listTaxonomy(): TaxonomyItem[] {
  return getCorpus().index.taxonomy;
}
export function getTaxonomyItem(id: string): TaxonomyItem | undefined {
  return getCorpus().index.taxonomy.find((t) => t.id === id);
}
export function corpusVersion(): string {
  return getCorpus().index.corpusVersion;
}

/**
 * Is a (normalized) authority/phrase present in the committed corpus, on token
 * boundaries? This — not any curated name list — is the grounding anchor (§7, §11.2).
 */
export function corpusContainsNormalised(norm: string): boolean {
  if (!norm) return false;
  return getCorpus().paddedBlob.includes(` ${norm} `);
}

/** Chunk ids whose text token-contains the normalized phrase (for pinpoint binding). */
export function findChunkIdsForNormalised(norm: string): string[] {
  if (!norm) return [];
  const out: string[] = [];
  for (const [id, text] of getCorpus().normByChunk) {
    if (` ${text} `.includes(` ${norm} `)) out.push(id);
  }
  return out;
}
