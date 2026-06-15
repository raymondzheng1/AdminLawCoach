"use client";
import { Markdown } from "@/components/ui/Markdown";
import { Button, NotCoveredNotice } from "@/components/ui/primitives";
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
  return (
    <div>
      <Markdown className="prose-answer">{resp.answerMarkdown}</Markdown>

      {resp.citations.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-[var(--text-small)] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Authorities — click to see the source
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {resp.citations.map((c, i) => (
              <button
                key={`${c.chunkId}-${i}`}
                onClick={() => onFocusSource(c.chunkId)}
                className="pinpoint-chip hover:opacity-80"
                title={`${c.authority} — ${c.pinpoint}`}
              >
                {c.authority} · {c.pinpoint}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex gap-2 print:hidden">
        <Button variant="secondary" onClick={() => downloadText(`${slug(title)}.md`, groundedToMarkdown(title, resp))}>
          Download
        </Button>
        <Button variant="ghost" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "answer";
}
