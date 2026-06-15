"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Spinner } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/Markdown";
import { Header, ErrorBanner } from "@/components/study/GroundedView";
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
  const pace = paceStatus(countWords(attempt), budget, clock);

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
    if (timer.current) clearInterval(timer.current);
    const r = (await fb.submit(question.prompt, attempt, kind)) as FeedbackResponse | null;
    study.refreshUsage();
    if (r) {
      study.setSources(r.sources);
      saveStore(
        addAttempt(loadStore(), {
          id: newId(),
          createdAt: Date.now(),
          topicId,
          kind,
          question: question.prompt,
          attemptText: attempt,
          wordCount: countWords(attempt),
          score: r.feedback?.rubricScore,
        }),
      );
    }
    setPhase("done");
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    gen.reset();
    fb.reset();
    setAttempt("");
    setPhase("setup");
  };

  return (
    <div className="space-y-4">
      <Header heading="Exam mode" blurb="A timed mock: generate a question, write against the clock with a word budget, then get marked." />

      {phase === "setup" ? (
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[14px]">
              <span className="mb-1 block font-medium text-[var(--color-muted)]">Topic</span>
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]">
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[14px]">
              <span className="mb-1 block font-medium text-[var(--color-muted)]">Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]">
                <option value="hypothetical">Hypothetical</option>
                <option value="essay">Essay</option>
              </select>
            </label>
            <label className="block text-[14px]">
              <span className="mb-1 block font-medium text-[var(--color-muted)]">Time</span>
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]">
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} minutes (~{wordBudget(m)} words)
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={start} disabled={gen.loading || !topicId}>
              {gen.loading ? "Preparing…" : "Start timed mock"}
            </Button>
            {gen.loading ? <Spinner /> : null}
          </div>
          {gen.error ? <div className="mt-3"><ErrorBanner message={gen.error} /></div> : null}
        </Card>
      ) : null}

      {phase !== "setup" && question ? (
        <>
          {phase === "running" ? (
            <div
              className={`sticky top-2 z-10 flex items-center justify-between rounded-lg border px-4 py-2 ${clock.expired ? "border-[#e7c3c3] bg-[#fbeaea]" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}
            >
              <span className="font-display text-lg font-semibold tabular-nums">
                {clock.expired ? "Time up" : formatRemaining(clock.remainingMs)}
              </span>
              <Button onClick={submit} disabled={fb.loading || !attempt.trim()}>
                {fb.loading ? "Marking…" : "Submit"}
              </Button>
            </div>
          ) : null}

          <Card>
            <div className="text-[var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              {question.type} · {gen.result?.topicLabel}
            </div>
            <h2 className="mt-1 font-display text-lg font-semibold">{question.title}</h2>
            <Markdown className="mt-2">{question.prompt}</Markdown>
          </Card>

          {phase === "running" ? (
            <Card>
              <AttemptEditor value={attempt} onChange={setAttempt} budget={budget} pace={pace} />
            </Card>
          ) : null}

          {phase === "done" && fb.result ? (
            <Card>
              <FeedbackDisplay resp={fb.result} question={question.prompt} attempt={attempt} />
            </Card>
          ) : null}
          {fb.error ? <ErrorBanner message={fb.error} /> : null}

          <Button variant="ghost" onClick={reset}>
            ← New mock
          </Button>
        </>
      ) : null}
    </div>
  );
}
