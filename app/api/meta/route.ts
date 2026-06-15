import { NextResponse } from "next/server";
import { listTaxonomy, getCorpus, corpusVersion } from "@/lib/corpus";

export const runtime = "nodejs";

/**
 * Lightweight corpus metadata for the client (topic picker, doc list). Network-free,
 * no model call, no cost — safe to cache. Never ships the full 658KB index to the browser.
 */
export function GET() {
  const { index } = getCorpus();
  return NextResponse.json(
    {
      corpusVersion: corpusVersion(),
      docs: index.docs.map((d) => ({ id: d.id, title: d.title, role: d.role })),
      taxonomy: listTaxonomy().map((t) => ({ id: t.id, label: t.label, kind: t.kind, count: t.locations.length })),
      stats: index.stats,
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
