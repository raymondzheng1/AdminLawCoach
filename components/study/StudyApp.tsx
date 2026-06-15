"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import { api } from "@/lib/client/api";
import { ModeSwitcher, type ModeDef } from "@/components/study/ModeSwitcher";
import { StudyProvider } from "@/components/study/StudyContext";
import { SourcePanel } from "@/components/study/SourcePanel";
import { UsageMeter } from "@/components/study/UsageMeter";
import { ByoKeyPanel } from "@/components/study/ByoKeyPanel";
import { GroundedView } from "@/components/study/GroundedView";
import { PracticeView } from "@/components/study/PracticeView";
import { ModelAnswerView } from "@/components/study/ModelAnswerView";
import { ExamView } from "@/components/study/ExamView";
import { ProgressView } from "@/components/study/ProgressView";
import type { MetaResponse, UsageResponse, SourceRef } from "@/lib/client/types";

const MODES: readonly ModeDef[] = [
  { id: "ask", label: "Ask" },
  { id: "practice", label: "Practice" },
  { id: "model", label: "Model answers" },
  { id: "exam", label: "Exam" },
  { id: "explain", label: "Explain" },
  { id: "progress", label: "Progress" },
];

export function StudyApp() {
  const [mode, setMode] = useState("ask");
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [focused, setFocused] = useState<string | undefined>(undefined);
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(undefined);

  const refreshUsage = useCallback(() => {
    api.usage().then(setUsage).catch(() => {});
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
    refreshUsage();
  }, [refreshUsage]);

  const focusSource = useCallback((chunkId: string) => {
    setFocused(chunkId);
    if (typeof document !== "undefined") {
      document.getElementById(`src-${chunkId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const onSetSources = useCallback((s: SourceRef[]) => {
    setSources(s);
    setFocused(undefined);
  }, []);

  const ctx = { setSources: onSetSources, focusSource, refreshUsage };

  const practiceTopic = (topicId: string) => {
    setPracticeTopicId(topicId);
    setMode("practice");
  };

  return (
    <StudyProvider value={ctx}>
      <div className="min-h-dvh">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-paper)] pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
            <Link href="/" className="font-display text-lg font-semibold">
              {SITE.name}
            </Link>
            <div className="flex items-center gap-4">
              <UsageMeter usage={usage} />
              <ByoKeyPanel onChange={refreshUsage} />
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-2">
            <ModeSwitcher modes={MODES} active={mode} onSelect={setMode} />
          </div>
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            {mode === "ask" ? (
              <GroundedView
                heading="Ask"
                blurb="Ask anything about this course. Answers come only from your materials, with click-to-source pinpoints — or an honest “not covered”."
                placeholder="e.g. What is the test for legal unreasonableness?"
                cta="Ask"
                multiline
                examples={["What is the test for legal unreasonableness?", "How does merits review differ from judicial review?", "When is a decision affected by jurisdictional error?"]}
                run={(q) => api.ask(q)}
                titleOf={(q) => q.slice(0, 40)}
              />
            ) : null}
            {mode === "explain" ? (
              <GroundedView
                heading="Explain"
                blurb="Look up a ground, case or concept — a short, sourced explanation drawn only from your notes."
                placeholder="e.g. procedural fairness, Kirk, jurisdictional fact"
                cta="Explain"
                examples={["legal unreasonableness", "the hearing rule", "merits review"]}
                run={(t) => api.explain(t)}
                titleOf={(t) => t.slice(0, 40)}
              />
            ) : null}
            {mode === "practice" ? <PracticeView meta={meta} initialTopicId={practiceTopicId} /> : null}
            {mode === "model" ? <ModelAnswerView /> : null}
            {mode === "exam" ? <ExamView meta={meta} /> : null}
            {mode === "progress" ? <ProgressView meta={meta} onPracticeTopic={practiceTopic} /> : null}
          </section>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <SourcePanel sources={sources} focusedChunkId={focused} />
          </div>
        </main>

        <footer className="border-t border-[var(--color-border)] px-4 py-6">
          <div className="mx-auto max-w-6xl text-[13px] leading-relaxed text-[var(--color-muted)]">
            <p>
              A study aid grounded only in the provided course materials — not legal advice. For practice and revision, not for
              use in live assessment. Everything is sourced to your materials, or it says it isn&rsquo;t covered.
            </p>
          </div>
        </footer>
      </div>
    </StudyProvider>
  );
}
