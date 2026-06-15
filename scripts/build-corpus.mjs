// @ts-check
/**
 * build-corpus.mjs — parse corpus/source/*.docx into the committed, diffable
 * corpus/index.json (chunks + authorities + pinpoints + issue taxonomy).
 * Reference data is committed; derived state is computed at runtime (harness §3.5).
 *
 * Run: npm run build-corpus   (rebuild + re-commit index.json whenever source/ changes)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import {
  extractAuthorities,
  extractPinpoints,
  normalizeForMatch,
  normalizeAuthority,
  tokenIncludes,
} from "../lib/corpus/patterns.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = resolve(ROOT, "corpus/source");
const OUT = resolve(ROOT, "corpus/index.json");
const SCHEMA_VERSION = 1;
const MAX_CHUNK_CHARS = 1400;

/** Map a source filename to its corpus role. */
function roleFor(file) {
  if (/RULES/i.test(file)) return "rules";
  if (/NOTES/i.test(file)) return "notes";
  if (/MODEL/i.test(file)) return "model";
  return "notes";
}

/** Human title from a filename like "06_RULES_Combined_MR_JR_framework.docx". */
function titleFor(file) {
  return basename(file, ".docx")
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .trim();
}

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};
function decodeEntities(s) {
  return s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function emRuns(html) {
  return Array.from(html.matchAll(/<em>([\s\S]*?)<\/em>/g), (m) => stripTags(m[1])).filter(Boolean);
}

/**
 * Parse mammoth HTML into ordered blocks: headings (with level) and body paragraphs.
 * @returns {{tag:string, level:number, text:string, em:string[]}[]}
 */
function parseBlocks(html) {
  const noImg = html.replace(/<img[^>]*>/g, "");
  /** @type {{tag:string, level:number, text:string, em:string[]}[]} */
  const blocks = [];
  for (const m of noImg.matchAll(/<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const tag = m[1];
    const inner = m[2];
    const text = stripTags(inner);
    if (!text) continue;
    const level = tag[0] === "h" ? Number(tag[1]) : 0;
    blocks.push({ tag, level, text, em: emRuns(inner) });
  }
  return blocks;
}

/** Chunk a doc's blocks under their heading context. */
function chunkDoc(docId, role, docTitle, blocks) {
  /** @type {{id:string, docId:string, role:string, headingPath:string[], locationLabel:string, text:string, em:string[]}[]} */
  const chunks = [];
  /** @type {{level:number, text:string}[]} */
  let stack = [];
  let buf = "";
  let bufEm = [];
  let seq = 0;

  const flush = () => {
    const body = buf.trim();
    if (!body) {
      buf = "";
      bufEm = [];
      return;
    }
    const headingPath = stack.map((s) => s.text);
    const label = [docTitle, ...headingPath].join(" › ");
    chunks.push({
      id: `${docId}#${seq++}`,
      docId,
      role,
      headingPath,
      locationLabel: label,
      text: body,
      em: bufEm.slice(),
    });
    buf = "";
    bufEm = [];
  };

  for (const b of blocks) {
    if (b.level > 0) {
      flush();
      stack = stack.filter((s) => s.level < b.level);
      stack.push({ level: b.level, text: b.text });
    } else {
      const next = (buf ? buf + "\n" : "") + b.text;
      if (next.length > MAX_CHUNK_CHARS && buf) {
        flush();
        buf = b.text;
        bufEm = b.em.slice();
      } else {
        buf = next;
        bufEm.push(...b.em);
      }
    }
  }
  flush();
  return chunks;
}

// --- Issue / ground taxonomy (method scaffold; locations computed from corpus) -------------
/** @type {{id:string, label:string, kind:"jr-ground"|"jr-threshold"|"mr"|"remedy", keywords:string[]}[]} */
const TAXONOMY_DEFS = [
  { id: "jurisdiction", label: "Jurisdiction & privative clauses", kind: "jr-threshold", keywords: ["jurisdiction", "privative clause", "s 75(v)", "39B", "ADJR", "Kirk"] },
  { id: "standing", label: "Standing", kind: "jr-threshold", keywords: ["standing", "special interest", "person aggrieved"] },
  { id: "remedies", label: "Remedies", kind: "remedy", keywords: ["certiorari", "mandamus", "prohibition", "injunction", "declaration", "quash", "remit"] },
  { id: "no-authority", label: "Decision without authority (ultra vires)", kind: "jr-ground", keywords: ["without authority", "ultra vires", "no power", "ABC Learning"] },
  { id: "improper-purpose", label: "Improper purpose", kind: "jr-ground", keywords: ["improper purpose", "Toohey", "Schlieske", "Samrein"] },
  { id: "relevant-considerations", label: "Relevant considerations", kind: "jr-ground", keywords: ["relevant consideration", "Peko", "Tickner"] },
  { id: "irrelevant-considerations", label: "Irrelevant considerations", kind: "jr-ground", keywords: ["irrelevant consideration"] },
  { id: "invalid-delegation", label: "Invalid delegation", kind: "jr-ground", keywords: ["delegation", "Pattenden", "delegate"] },
  { id: "procedural-fairness-hearing", label: "Procedural fairness — hearing rule", kind: "jr-ground", keywords: ["hearing rule", "procedural fairness", "natural justice", "Kioa", "Saeed", "Nathanson"] },
  { id: "procedural-fairness-bias", label: "Procedural fairness — bias rule", kind: "jr-ground", keywords: ["bias", "apprehended bias", "Ebner", "Jia"] },
  { id: "objective-jurisdictional-fact", label: "Objective jurisdictional fact", kind: "jr-ground", keywords: ["objective jurisdictional fact", "jurisdictional fact", "M70"] },
  { id: "subjective-jurisdictional-fact", label: "Subjective jurisdictional fact", kind: "jr-ground", keywords: ["subjective jurisdictional fact", "SZMDS", "SMDZS"] },
  { id: "unreasonableness", label: "Legal unreasonableness", kind: "jr-ground", keywords: ["unreasonableness", "unreasonable", "Li", "SZVFW", "DUA16"] },
  { id: "error-of-law", label: "Error of law on the face of the record", kind: "jr-ground", keywords: ["error of law", "face of the record", "Craig", "Kirk"] },
  { id: "fettering-policy", label: "Unlawful / inflexible policy (fettering)", kind: "jr-ground", keywords: ["inflexible application of policy", "unlawful policy", "fetter", "Drake"] },
  { id: "illogicality", label: "Illogicality / irrationality", kind: "jr-ground", keywords: ["illogicality", "irrationality", "illogical", "irrational"] },
  { id: "breach-consequences", label: "Breach & consequences of breach", kind: "jr-ground", keywords: ["consequences of breach", "materiality", "LPDT", "PBS", "jurisdictional error"] },
  { id: "mr-jurisdiction", label: "Merits review — jurisdiction & avenue", kind: "mr", keywords: ["merits review", "enabling Act", "VCAT Act", "ART Act", "review jurisdiction"] },
  { id: "mr-standing", label: "Merits review — standing & time limit", kind: "mr", keywords: ["time limit", "28 days", "extension", "s 48", "may apply"] },
  { id: "mr-correct-preferable", label: "Merits review — correct or preferable decision", kind: "mr", keywords: ["correct or preferable", "stands in the shoes", "Drake", "Shi", "best and most current"] },
];

async function main() {
  const files = readdirSync(SOURCE_DIR)
    .filter((f) => f.toLowerCase().endsWith(".docx") && !f.startsWith("~$"))
    .sort();
  if (files.length === 0) {
    console.error(`No .docx files found in ${SOURCE_DIR}`);
    process.exit(1);
  }

  /** @type {{id:string, docId:string, role:string, headingPath:string[], locationLabel:string, text:string, em:string[]}[]} */
  const allChunks = [];
  const docs = [];
  const roleMap = {};
  const rawTexts = [];

  for (const file of files) {
    const path = resolve(SOURCE_DIR, file);
    const docId = basename(file, ".docx");
    const role = roleFor(file);
    const docTitle = titleFor(file);
    const { value: html } = await mammoth.convertToHtml({ path });
    const blocks = parseBlocks(html);
    const chunks = chunkDoc(docId, role, docTitle, blocks);
    allChunks.push(...chunks);
    docs.push({ id: docId, title: docTitle, role, file, chunkCount: chunks.length });
    roleMap[docId] = role;
    rawTexts.push(`${docId}\n${chunks.map((c) => c.text).join("\n")}`);
    console.error(`  parsed ${file}: ${blocks.length} blocks → ${chunks.length} chunks [${role}]`);
  }

  // Precompute normalized chunk text once for membership scans.
  const normByChunk = new Map(allChunks.map((c) => [c.id, normalizeForMatch(`${c.headingPath.join(" ")} ${c.text}`)]));

  // --- Authorities -----------------------------------------------------------------------
  /** @type {Map<string, {id:string, type:"case"|"statute", name:string}>} */
  const authMap = new Map();
  for (const c of allChunks) {
    for (const a of extractAuthorities(c.text, c.em)) {
      const key = a.type + "::" + normalizeForMatch(a.name);
      const existing = authMap.get(key);
      if (!existing) {
        authMap.set(key, { id: key, type: a.type, name: a.name });
      } else if (a.name.length > existing.name.length) {
        existing.name = a.name; // prefer the fullest display form
      }
    }
  }
  const authorities = Array.from(authMap.values())
    .map((a) => {
      const norm = normalizeForMatch(a.name);
      const locations = allChunks.filter((c) => tokenIncludes(normByChunk.get(c.id) ?? "", norm)).map((c) => c.id);
      return { id: a.id, type: a.type, name: a.name, normalized: norm, locations };
    })
    .filter((a) => a.locations.length > 0)
    .sort((x, y) => x.name.localeCompare(y.name));

  // --- Pinpoints -------------------------------------------------------------------------
  /** @type {Map<string, string>} */
  const pinpointNames = new Map();
  for (const c of allChunks) for (const p of extractPinpoints(c.text)) pinpointNames.set(normalizeForMatch(p), normalizeAuthority(p));
  const pinpoints = Array.from(pinpointNames.entries())
    .map(([norm, label]) => ({
      label,
      normalized: norm,
      locations: allChunks.filter((c) => tokenIncludes(normByChunk.get(c.id) ?? "", norm)).map((c) => c.id),
    }))
    .filter((p) => p.locations.length > 0)
    .sort((x, y) => x.label.localeCompare(y.label));

  // --- Taxonomy --------------------------------------------------------------------------
  const taxonomy = TAXONOMY_DEFS.map((t) => {
    const keyNorms = t.keywords.map(normalizeForMatch);
    const locations = allChunks
      .filter((c) => {
        const txt = normByChunk.get(c.id) ?? "";
        return keyNorms.some((k) => tokenIncludes(txt, k));
      })
      .map((c) => c.id);
    return { id: t.id, label: t.label, kind: t.kind, locations };
  }).filter((t) => t.locations.length > 0);

  // --- Content hash (diff only changes when source content changes) ----------------------
  const corpusVersion = createHash("sha256").update(rawTexts.sort().join("\n\n")).digest("hex").slice(0, 16);

  const index = {
    schemaVersion: SCHEMA_VERSION,
    corpusVersion,
    docs,
    roleMap,
    chunks: allChunks.map(({ em, ...c }) => c), // drop transient em runs from the committed index
    authorities,
    pinpoints,
    taxonomy,
    stats: {
      docCount: docs.length,
      chunkCount: allChunks.length,
      authorityCount: authorities.length,
      pinpointCount: pinpoints.length,
      taxonomyCount: taxonomy.length,
    },
  };

  writeFileSync(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.error(
    `\nWrote ${OUT}\n  ${index.stats.docCount} docs · ${index.stats.chunkCount} chunks · ${index.stats.authorityCount} authorities · ${index.stats.pinpointCount} pinpoints · ${index.stats.taxonomyCount} taxonomy items\n  corpusVersion=${corpusVersion}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
