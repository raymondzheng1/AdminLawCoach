"use client";
import { Button, NotCoveredNotice } from "@/components/ui/primitives";
import { downloadText, feedbackToMarkdown } from "@/lib/client/download";
import type { FeedbackResponse } from "@/lib/client/types";

export function FeedbackDisplay({ resp, question, attempt }: { resp: FeedbackResponse; question: string; attempt: string }) {
  if (resp.notCovered || !resp.feedback) return <NotCoveredNotice />;
  const fb = resp.feedback;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] font-display text-xl font-semibold text-[var(--color-accent)]">
          {fb.rubricScore}
        </div>
        <div>
          <div className="font-medium">Rubric score</div>
          <div className="text-[var(--text-caption)] text-[var(--color-muted)]">out of 100, against the model-answer issue set</div>
        </div>
      </div>

      <Section title="Issues spotted" items={fb.issuesSpotted} empty="—" />
      <Section title="Issues missed" items={fb.issuesMissed} empty="None flagged — good coverage." />

      <Block title="Structure">{fb.structureComments}</Block>
      <Block title="Authority use">
        {fb.authorityUse.notes}
        {fb.authorityUse.flagged.length > 0 ? (
          <p className="mt-2 rounded border border-[#efd9b8] bg-[#fdf3e7] p-2 text-[14px] text-[var(--color-warn)]">
            Used but not in your course materials: {fb.authorityUse.flagged.join(", ")}
          </p>
        ) : null}
      </Block>
      <Block title="Application depth">{fb.applicationDepth}</Block>
      <Section title="Three next actions" items={fb.actions} empty="—" ordered />

      <div className="flex gap-2 print:hidden">
        <Button variant="secondary" onClick={() => downloadText("feedback.md", feedbackToMarkdown(question, attempt, resp))}>
          Download
        </Button>
        <Button variant="ghost" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}

function Section({ title, items, empty, ordered }: { title: string; items: string[]; empty: string; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-[var(--text-small)] font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[var(--text-small)] text-[var(--color-muted)]">{empty}</p>
      ) : (
        <Tag className={`mt-1 ${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-[15px]`}>
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </Tag>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[var(--text-small)] font-semibold">{title}</h3>
      <div className="mt-1 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}
