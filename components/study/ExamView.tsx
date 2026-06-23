"use client";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { Header } from "@/components/study/GroundedView";
import { ErrorState } from "@/components/study/ErrorState";
import { AnswerSkeleton } from "@/components/ui/Skeleton";
import { FeedbackDisplay } from "@/components/study/FeedbackDisplay";
import { AttemptEditor } from "@/components/study/AttemptEditor";
import { useStudy } from "@/components/study/StudyContext";
import { useSubmit } from "@/components/study/useSubmit";
import { api } from "@/lib/client/api";
import { loadStore, saveStore, addQuestion, addAttempt, newId } from "@/lib/storage";
import { examClock, formatRemaining, wordBudget, paceStatus, countWords } from "@/lib/exam";
import type { MetaResponse, QuestionResponse, FeedbackResponse } from "@/lib/client/types";

type Kind = "hypothetical" | "essay";
const MINUTE_OPTIONS = [15, 30, 45];

export function ExamView({ meta }: { meta: MetaResponse | null }) {
  const study = useStudy();
  const topics = meta?.taxonomy ?? [];
  const [topicId, setTopicId] = useState("");
  const [kind, setKind] = useState<Kind>("hypothetical");
  const [minutes, setMinutes] = useState(30);
  const [phase, setPhase] = useState<"setup" | "running" | "done">("setup");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [attempt, setAttempt] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!topicId && topics.length) setTopicId(topics[0]!.id);
  }, [topics, topicId]);

  const gen = useSubmit((t: Kind, id: string) => api.generateQuestion(t, id));
  const fb = useSubmit((q: string, a: string, k: Kind) => api.feedback(q, a, k));
  const question = gen.result?.question;

  useEffect(() => {
    if (phase !== "running") return;
    setNow(Date.now());
    timer.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [phase]);

  const clock = examClock(now || startedAt, startedAt, minutes);
  const budget = wordBudget(minutes);
  const words = countWords(attempt);
  const pace = paceStatus(words, budget, clock);

  const start = async () => {
    if (!topicId) return;
    fb.reset();
    setAttempt("");
    const r = (await gen.submit(kind, topicId)) as QuestionResponse | null;
    study.refreshUsage();
    if (r) {
      saveStore(addQuestion(loadStore(), { id: newId(), createdAt: Date.now(), ...r.question }));
      setStartedAt(Date.now());
      setPhase("running");
    }
  };

  const submit = async () => {
    if (!question) return;
    const r = (await fb.submit(question.prompt, attempt, kind)) as FeedbackResponse | null;
    study.refreshUsage();
    if (r) {
      if (timer.current) clearInterval(timer.current);
      saveStore(
        addAttempt(loadStore(), {
          id: newId(),
          createdAt: Date.now(),
          topicId,
          kind,
          question: question.prompt,
          attemptText: attempt,
          wordCount: words,
          score: r.feedback?.rubricScore,
        }),
      );
      setPhase("done");
    }
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    gen.reset();
    fb.reset();
    setAttempt("");
    setPhase("setup");
  };

  return (
    <div>
      <Header heading="Exam mode" blurb="A timed mock: generate a question, write against the clock with a word budget, then get marked." />

      {phase === "setup" ? (
        <div className="space-y-4 rounded-card border border-line bg-surface p-5">
          <Field label="Type">
            <div className="flex gap-2">
              {(["hypothetical", "essay"] as const).map((k) => (
                <Pill key={k} active={kind === k} onClick={() => setKind(k)}>
                  {k === "hypothetical" ? "Hypothetical" : "Essay"}
                </Pill>
              ))}
            </div>
          </Field>
          <Field label="Time">
            <div className="flex gap-2">
              {MINUTE_OPTIONS.map((m) => (
                <Pill key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                  {m} min · ~{wordBudget(m)} words
                </Pill>
              ))}
            </div>
          </Field>
          <Field label="Topic">
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full rounded-input border border-line-strong bg-surface px-3 py-2 text-caption text-muted outline-none focus:border-teal sm:w-auto"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <button
            onClick={start}
            disabled={gen.loading || !topicId}
            className="rounded-cta bg-navy px-5 py-2.5 text-caption font-semibold text-surface transition-colors hover:bg-navy/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {gen.loading ? "Preparing…" : "Start timed mock"}
          </button>
          {gen.error ? <ErrorState error={gen.error} onRetry={start} onUseKey={study.openByoKey} /> : null}
        </div>
      ) : null}

      {phase !== "setup" && question ? (
        <div className="space-y-5">
          {phase === "running" ? (
            <div className="sticky top-[68px] z-10 flex flex-wrap items-center justify-between gap-3 rounded-input border border-line-strong bg-surface px-4 py-3 shadow-card">
              <div className="flex items-center gap-4">
                <span
                  className="font-mono text-[22px] font-semibold tabular-nums"
                  style={{ color: clock.expired ? "var(--color-warn)" : "var(--color-navy)" }}
                >
                  {clock.expired ? "0:00" : formatRemaining(clock.remainingMs)}
                </span>
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-meta text-faint">Words</span>
                  <span className="h-[7px] w-[110px] overflow-hidden rounded-[4px] bg-line-faint">
                    <span className="block h-full rounded-[4px] bg-teal transition-all" style={{ width: `${Math.min(100, budget ? (words / budget) * 100 : 0)}%` }} />
                  </span>
                  <span className="text-meta tabular-nums text-faint-2">{words}/{budget}</span>
                </div>
                <PaceChip pace={pace} />
              </div>
              <button
                onClick={submit}
                disabled={fb.loading || !attempt.trim()}
                className="rounded-cta bg-teal px-4 py-2 text-caption font-semibold text-surface transition-colors hover:bg-teal/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                {fb.loading ? "Marking…" : "Submit"}
              </button>
            </div>
          ) : null}

          <div className="rounded-input border border-line bg-surface p-5">
            <div className="mb-1 font-serif text-meta font-semibold uppercase tracking-[0.04em] text-teal">
              {question.type} · {gen.result?.topicLabel}
            </div>
            <h2 className="mb-2 font-serif text-section font-semibold text-ink">{question.title}</h2>
            <Markdown className="text-body-soft">{question.prompt}</Markdown>
          </div>

          {phase === "running" ? <AttemptEditor value={attempt} onChange={setAttempt} budget={budget} pace={pace} /> : null}
          {fb.error ? <ErrorState error={fb.error} onRetry={submit} onUseKey={study.openByoKey} /> : null}

          {phase === "done" ? (
            <div className="rounded-card bg-panel p-5">
              {fb.result ? <FeedbackDisplay resp={fb.result} question={question.prompt} attempt={attempt} /> : <AnswerSkeleton />}
            </div>
          ) : null}

          <button onClick={reset} className="text-caption font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal">
            ← New mock
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-meta font-semibold uppercase tracking-[0.08em] text-faint-2">{label}</div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-pill px-3.5 py-2 text-caption font-medium transition-colors ${
        active ? "bg-navy text-surface" : "border border-line-strong bg-surface text-muted hover:border-teal"
      }`}
    >
      {children}
    </button>
  );
}

function PaceChip({ pace }: { pace: "ahead" | "on-track" | "behind" }) {
  const map = {
    ahead: { label: "Ahead", cls: "bg-teal-tint text-teal border-teal-border" },
    "on-track": { label: "On track", cls: "bg-[#eef2f7] text-navy border-[#cdd9e6]" },
    behind: { label: "Behind", cls: "bg-flag-bg text-flag-fg border-[#e0dccf]" },
  }[pace];
  return <span className={`rounded-pill border px-2.5 py-1 text-meta font-semibold ${map.cls}`}>{map.label}</span>;
}
