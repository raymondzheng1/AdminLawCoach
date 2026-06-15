// @ts-check
/**
 * corpus-check.mjs — integrity linter for the committed corpus/index.json (§4.2, TECHNICAL_SPEC §2).
 * Fails the build if the index is malformed, or any authority/pinpoint/taxonomy
 * location does not resolve to a real chunk. The grounding guarantee depends on
 * every citable thing pinpointing to a source location — this pins that.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = resolve(ROOT, "corpus/index.json");

let failures = 0;
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failures++;
};

let ix;
try {
  ix = JSON.parse(readFileSync(INDEX, "utf8"));
} catch (e) {
  console.error(`corpus-check: cannot read/parse ${INDEX} — run \`npm run build-corpus\`.`);
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

// Top-level shape
for (const key of ["schemaVersion", "corpusVersion", "docs", "roleMap", "chunks", "authorities", "pinpoints", "taxonomy", "stats"]) {
  if (!(key in ix)) fail(`missing top-level key: ${key}`);
}
if (ix.schemaVersion !== 1) fail(`unexpected schemaVersion: ${ix.schemaVersion}`);
if (!Array.isArray(ix.chunks) || ix.chunks.length === 0) fail("no chunks");

const chunkIds = new Set((ix.chunks ?? []).map((c) => c.id));
const docIds = new Set((ix.docs ?? []).map((d) => d.id));

// Every chunk references a known doc + role; ids unique.
const seenChunk = new Set();
for (const c of ix.chunks ?? []) {
  if (seenChunk.has(c.id)) fail(`duplicate chunk id: ${c.id}`);
  seenChunk.add(c.id);
  if (!docIds.has(c.docId)) fail(`chunk ${c.id} references unknown docId ${c.docId}`);
  if (!["rules", "notes", "model"].includes(c.role)) fail(`chunk ${c.id} bad role ${c.role}`);
  if (!c.text || !c.locationLabel) fail(`chunk ${c.id} missing text/locationLabel`);
}

// roleMap covers every doc.
for (const d of ix.docs ?? []) {
  if (ix.roleMap?.[d.id] !== d.role) fail(`roleMap mismatch for ${d.id}`);
}

// Every location resolves to a real chunk; every citable thing has ≥1 location.
const checkLocations = (kind, items, labelKey) => {
  for (const it of items ?? []) {
    const label = it[labelKey] ?? it.id ?? "?";
    if (!Array.isArray(it.locations) || it.locations.length === 0) {
      fail(`${kind} "${label}" has no locations`);
      continue;
    }
    for (const loc of it.locations) {
      if (!chunkIds.has(loc)) fail(`${kind} "${label}" → unknown chunk ${loc}`);
    }
  }
};
checkLocations("authority", ix.authorities, "name");
checkLocations("pinpoint", ix.pinpoints, "label");
checkLocations("taxonomy", ix.taxonomy, "label");

// Stats consistency.
if (ix.stats?.chunkCount !== ix.chunks?.length) fail(`stats.chunkCount ${ix.stats?.chunkCount} ≠ ${ix.chunks?.length}`);
if (ix.stats?.authorityCount !== ix.authorities?.length) fail(`stats.authorityCount mismatch`);

if (failures) {
  console.error(`\ncorpus-check: ${failures} problem(s).`);
  process.exit(1);
}
console.error(
  `corpus-check OK — ${ix.docs.length} docs · ${ix.chunks.length} chunks · ${ix.authorities.length} authorities · ${ix.pinpoints.length} pinpoints · ${ix.taxonomy.length} taxonomy items (v${ix.corpusVersion}).`,
);
