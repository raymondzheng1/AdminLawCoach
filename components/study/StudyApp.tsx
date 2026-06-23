"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { ModeSwitcher, type ModeDef } from "@/components/study/ModeSwitcher";
import { StudyProvider } from "@/components/study/StudyContext";
import { SourcePanel } from "@/components/study/SourcePanel";
import { UsageMeter } from "@/components/study/UsageMeter";
import { ByoKeyPanel } from "@/components/study/ByoKeyPanel";
import { Emblem } from "@/components/study/Emblem";
import { GroundedView } from "@/components/study/GroundedView";
import { PracticeView } from "@/components/study/PracticeView";
import { ModelAnswerView } from "@/components/study/ModelAnswerView";
import { ExamView } from "@/components/study/ExamView";
import { ProgressView } from "@/components/study/ProgressView";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import type { MetaResponse, UsageResponse, SourceRef } from "@/lib/client/types";

const MODES: readonly ModeDef[] = [
  { id: "ask", label: "Ask" },
  { id: "practice", label: "Practice" },
  { id: "model", label: "Model answers" },
  { id: "exam", label: "Exam" },
  { id: "explain", label: "Explain" },
  { id: "progress", label: "Progress" },
];

const SOURCE_MODES = new Set(["ask", "explain", "model"]);
const COMPLIANCE = "A study aid, not legal advice. For practice and revision, not live assessment.";

export function StudyApp() {
  const [mode, setMode] = useState("ask");
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [focused, setFocused] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [byoOpen, setByoOpen] = useState(false);
  const [practiceTopicId, setPracticeTopicId] = useState<string | undefined>(undefined);

  const refreshUsage = useCallback(() => {
    api.usage().then(setUsage).catch(() => {});
  }, []);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
    refreshUsage();
  }, [refreshUsage]);

  const focusSource = useCallback((chunkId: string) => setFocused(chunkId), []);

  // On a new answer, pre-highlight the first source so the panel reads as "connected" (§).
  const onSetSources = useCallback((s: SourceRef[]) => {
    setSources(s);
    setFocused(s[0]?.chunkId);
  }, []);

  const openByoKey = useCallback(() => setByoOpen(true), []);
  const ctx = { setSources: onSetSources, focusSource, refreshUsage, setBusy, openByoKey };
  const practiceTopic = (topicId: string) => {
    setPracticeTopicId(topicId);
    setMode("practice");
  };
  const showSources = SOURCE_MODES.has(mode);

  return (
    <StudyProvider value={ctx}>
      <div className="flex min-h-dvh flex-col bg-paper">
        <header className="sticky top-0 z-20 border-b border-line-faint bg-surface pt-[max(0px,env(safe-area-inset-top))]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <Emblem size={24} />
              <span className="font-serif text-section font-semibold text-ink">AdminLaw Coach</span>
            </Link>
            <div className="flex items-center gap-4">
              <UsageMeter usage={usage} />
              <ByoKeyPanel onChange={refreshUsage} open={byoOpen} onOpenChange={setByoOpen} />
            </div>
          </div>
        </header>

        <InstallPrompt />

        <div className="border-b border-line-faint">
          <div className="mx-auto max-w-6xl">
            <ModeSwitcher modes={MODES} active={mode} onSelect={setMode} />
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1">
          <div className={showSources ? "grid lg:grid-cols-[minmax(0,1fr)_var(--source-panel-w)]" : ""}>
            <section className={`min-w-0 px-5 py-7 sm:px-7 ${showSources ? "lg:border-r lg:border-line-faint" : ""}`}>
              {mode === "ask" ? (
                <GroundedView
                  heading="Ask"
                  blurb="Ask anything about this unit. Answers are composed only from your materials, pinpointed to the passage — or an honest “not covered.”"
                  placeholder="e.g. When is an exercise of statutory discretion legally unreasonable?"
                  cta="Ask"
                  examples={["When is a discretion legally unreasonable?", "How does merits review differ from judicial review?", "When is a decision affected by jurisdictional error?"]}
                  run={(q) => api.ask(q)}
                  titleOf={(q) => q.slice(0, 40)}
                />
              ) : null}
              {mode === "explain" ? (
                <GroundedView
                  heading="Explain"
                  blurb="Look up a ground, case or concept — a short, sourced explanation drawn only from your notes."
                  placeholder="e.g. legal unreasonableness, procedural fairness, jurisdictional fact"
                  cta="Explain"
                  examples={["legal unreasonableness", "the hearing rule", "merits review"]}
                  run={(t) => api.explain(t)}
                  titleOf={(t) => t.slice(0, 40)}
                />
              ) : null}
              {mode === "model" ? <ModelAnswerView /> : null}
              {mode === "practice" ? <PracticeView meta={meta} initialTopicId={practiceTopicId} /> : null}
              {mode === "exam" ? <ExamView meta={meta} /> : null}
              {mode === "progress" ? <ProgressView meta={meta} onPracticeTopic={practiceTopic} /> : null}
            </section>

            {showSources ? (
              <div className="px-5 py-7 sm:px-6 lg:px-0 lg:py-0">
                <div className="lg:sticky lg:top-24 lg:px-5 lg:py-7">
                  <SourcePanel sources={sources} focusedChunkId={focused} loading={busy} />
                </div>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="border-t border-line-faint px-6 py-3.5">
          <div className="mx-auto max-w-6xl text-meta leading-[1.5] text-faint-2">{COMPLIANCE}</div>
        </footer>
      </div>
    </StudyProvider>
  );
}
