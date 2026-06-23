"use client";
import { useEffect, useRef, useState } from "react";
import { downloadText, feedbackToMarkdown } from "@/lib/client/download";
import { NotCoveredNotice } from "@/components/ui/primitives";
import type { FeedbackResponse } from "@/lib/client/types";

const R = 48;
const CIRC = 2 * Math.PI * R; // 301.6

/** Feedback panel: an animated rubric ring + spotted/missed + authority check + next actions. */
export function FeedbackDisplay({ resp, question, attempt }: { resp: FeedbackResponse; question: string; attempt: string }) {
  if (resp.notCovered || !resp.feedback) return <NotCoveredNotice />;
  const fb = resp.feedback;

  return (
    <div>
      <div className="mb-4 border-b border-line-quote pb-4 text-center">
        <div className="mb-2 text-meta font-semibold uppercase tracking-[0.12em] text-faint-2">Rubric score</div>
        <ScoreRing score={fb.rubricScore} />
        <div className="mt-2.5 text-caption font-semibold text-teal">{verdict(fb.rubricScore)}</div>
      </div>

      <Block label="✓ Spotted" color="text-good" items={fb.issuesSpotted} empty="—" />
      <Block label="○ Missed" color="text-warn" items={fb.issuesMissed} empty="Good coverage — nothing major missed." />

      {fb.structureComments ? <Prose label="Structure">{fb.structureComments}</Prose> : null}
      {fb.applicationDepth ? <Prose label="Application">{fb.applicationDepth}</Prose> : null}

      {fb.authorityUse.flagged.length > 0 ? (
        <div className="mb-4 rounded-input border border-line-strong border-l-[3px] border-l-flag bg-surface p-3">
          <div className="mb-0.5 text-caption font-semibold text-flag-fg">Authority check</div>
          <div className="text-caption leading-[1.55] text-muted">
            {fb.authorityUse.notes ? `${fb.authorityUse.notes} ` : ""}
            Not in your course materials: {fb.authorityUse.flagged.join(", ")}. Stick to your unit&rsquo;s authorities.
          </div>
        </div>
      ) : null}

      {fb.actions.length > 0 ? (
        <>
          <div className="mb-2 text-meta font-semibold uppercase tracking-[0.1em] text-faint-2">Next actions</div>
          <div className="flex flex-col gap-1.5">
            {fb.actions.map((a, i) => (
              <div key={i} className="rounded-input border border-line-strong bg-surface px-3 py-2.5 text-caption text-navy">
                {a}
              </div>
            ))}
          </div>
        </>
      ) : null}

      <button
        onClick={() => downloadText("feedback.md", feedbackToMarkdown(question, attempt, resp))}
        className="mt-4 text-meta font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal print:hidden"
      >
        Download feedback
      </button>
    </div>
  );
}

function verdict(score: number): string {
  if (score >= 85) return "Strong — exam-ready.";
  if (score >= 70) return "Solid issue-spotting — tighten the rule.";
  if (score >= 50) return "On the right track — deepen the application.";
  return "A start — rebuild around the test and the facts.";
}

function ScoreRing({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      return;
    }
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * score));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [score]);

  const offset = CIRC * (1 - shown / 100);
  return (
    <div className="relative mx-auto h-[108px] w-[108px]">
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={R} fill="none" stroke="var(--color-line-faint)" strokeWidth="9" />
        <circle
          cx="54"
          cy="54"
          r={R}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 54 54)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-[34px] font-semibold leading-none text-ink">{shown}</span>
        <span className="text-meta text-faint-2">/ 100</span>
      </div>
    </div>
  );
}

function Block({ label, color, items, empty }: { label: string; color: string; items: string[]; empty: string }) {
  return (
    <div className="mb-4">
      <div className={`mb-1.5 text-caption font-semibold ${color}`}>{label}</div>
      {items.length === 0 ? (
        <p className="text-caption leading-[1.6] text-quote">{empty}</p>
      ) : (
        <ul className="space-y-1 text-caption leading-[1.6] text-quote">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Prose({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-caption font-semibold text-ink">{label}</div>
      <div className="text-caption leading-[1.6] text-quote">{children}</div>
    </div>
  );
}
