"use client";
import { useEffect, useState } from "react";
import { Button, Card, Spinner } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/Markdown";
import { Header, ErrorBanner } from "@/components/study/GroundedView";
import { AnswerDisplay } from "@/components/study/AnswerDisplay";
import { FeedbackDisplay } from "@/components/study/FeedbackDisplay";
import { AttemptEditor } from "@/components/study/AttemptEditor";
import { useStudy } from "@/components/study/StudyContext";
import { useSubmit } from "@/components/study/useSubmit";
import { api } from "@/lib/client/api";
import { loadStore, saveStore, addQuestion, addAttempt, newId } from "@/lib/storage";
import { countWords } from "@/lib/exam";
import type { MetaResponse, QuestionResponse, FeedbackResponse, GroundedResponse } from "@/lib/client/types";

type Kind = "hypothetical" | "essay";

export function PracticeView({ meta, initialTopicId }: { meta: MetaResponse | null; initialTopicId?: string }) {
  const study = useStudy();
  const topics = meta?.taxonomy ?? [];
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [kind, setKind] = useState<Kind>("hypothetical");
  const [attempt, setAttempt] = useState("");

  useEffect(() => {
    if (initialTopicId) setTopicId(initialTopicId);
  }, [initialTopicId]);
  useEffect(() => {
    if (!topicId && topics.length) setTopicId(topics[0]!.id);
  }, [topics, topicId]);

  const gen = useSubmit((t: Kind, id: string) => api.generateQuestion(t, id));
  const fb = useSubmit((q: string, a: string, k: Kind) => api.feedback(q, a, k));
  const model = useSubmit((q: string, k: Kind) => api.generateAnswer(q, k));

  const question = gen.result?.question;

  const generate = async () => {
    if (!topicId) return;
    fb.reset();
    model.reset();
    setAttempt("");
    const r = (await gen.submit(kind, topicId)) as QuestionResponse | null;
    study.refreshUsage();
    if (r) saveStore(addQuestion(loadStore(), { id: newId(), createdAt: Date.now(), ...r.question }));
  };

  const getFeedback = async () => {
    if (!question || !attempt.trim()) return;
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
  };

  const showModel = async () => {
    if (!question) return;
    const r = (await model.submit(question.prompt, kind)) as GroundedResponse | null;
    study.refreshUsage();
    if (r) study.setSources(r.sources);
  };

  return (
    <div className="space-y-4">
      <Header heading="Practice" blurb="Generate a hypothetical or essay from a course topic, attempt it, then get feedback and the model answer." />

      <Card>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block text-[14px]">
            <span className="mb-1 block font-medium text-[var(--color-muted)]">Topic</span>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[14px]">
            <span className="mb-1 block font-medium text-[var(--color-muted)]">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]"
            >
              <option value="hypothetical">Hypothetical</option>
              <option value="essay">Essay</option>
            </select>
          </label>
          <Button onClick={generate} disabled={gen.loading || !topicId}>
            {gen.loading ? "Generating…" : "Generate question"}
          </Button>
        </div>
        {gen.error ? <div className="mt-3"><ErrorBanner message={gen.error} /></div> : null}
      </Card>

      {question ? (
        <Card>
          <div className="text-[var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
            {question.type} · {gen.result?.topicLabel}
          </div>
          <h2 className="mt-1 font-display text-lg font-semibold">{question.title}</h2>
          <Markdown className="mt-2">{question.prompt}</Markdown>
          {question.guidance ? (
            <p className="mt-2 text-[14px] text-[var(--color-muted)]">What a strong answer covers: {question.guidance}</p>
          ) : null}
        </Card>
      ) : null}

      {question ? (
        <Card>
          <AttemptEditor value={attempt} onChange={setAttempt} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={getFeedback} disabled={fb.loading || !attempt.trim()}>
              {fb.loading ? "Marking…" : "Get feedback"}
            </Button>
            <Button variant="secondary" onClick={showModel} disabled={model.loading}>
              {model.loading ? "Writing…" : "Show model answer"}
            </Button>
            {fb.loading || model.loading ? <Spinner /> : null}
          </div>
        </Card>
      ) : null}

      {fb.error ? <ErrorBanner message={fb.error} /> : null}
      {fb.result ? (
        <Card>
          <FeedbackDisplay resp={fb.result} question={question?.prompt ?? ""} attempt={attempt} />
        </Card>
      ) : null}

      {model.error ? <ErrorBanner message={model.error} /> : null}
      {model.result ? (
        <Card>
          <h3 className="mb-2 font-display text-lg font-semibold">Model answer</h3>
          <AnswerDisplay resp={model.result} title={question?.title ?? "model-answer"} onFocusSource={study.focusSource} />
        </Card>
      ) : null}
    </div>
  );
}
