"use client";
import { Markdown } from "@/components/ui/Markdown";
import { NotCoveredNotice } from "@/components/ui/primitives";
import { PinpointChip } from "@/components/study/PinpointChip";
import { downloadText, groundedToMarkdown } from "@/lib/client/download";
import type { GroundedResponse } from "@/lib/client/types";

export function AnswerDisplay({
  resp,
  title,
  onFocusSource,
}: {
  resp: GroundedResponse;
  title: string;
  onFocusSource: (chunkId: string) => void;
}) {
  if (resp.notCovered) return <NotCoveredNotice />;

  // Citations referenced inline via [[n]] markers render in-prose; any not referenced
  // are shown as a trailing chip row so no source is unreachable.
  const referenced = new Set<number>();
  for (const m of resp.answerMarkdown.matchAll(/\[\[(\d+)\]\]/g)) referenced.add(Number(m[1]));
  const orphans = resp.citations.filter((_, i) => !referenced.has(i + 1));

  return (
    <div>
      <div className="mb-3 font-serif text-caption font-semibold uppercase tracking-[0.04em] text-teal">Answer</div>

      <Markdown citations={resp.citations} onChip={onFocusSource}>
        {resp.answerMarkdown}
      </Markdown>

      {orphans.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {orphans.map((c, i) => (
            <PinpointChip
              key={`${c.chunkId}-${i}`}
              label={c.pinpoint ? `${c.authority} · ${c.pinpoint}` : c.authority}
              targetChunkId={c.chunkId}
              onActivate={onFocusSource}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex gap-4 text-meta print:hidden">
        <button
          onClick={() => downloadText(`${slug(title)}.md`, groundedToMarkdown(title, resp))}
          className="font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal"
        >
          Download
        </button>
        <button onClick={() => window.print()} className="font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal">
          Print
        </button>
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "answer";
}
