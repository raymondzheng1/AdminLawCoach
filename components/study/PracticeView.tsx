"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { Markdown } from "@/components/ui/Markdown";
import { ErrorBanner } from "@/components/study/GroundedView";
import { AnswerDisplay } from "@/components/study/AnswerDisplay";
import { FeedbackDisplay } from "@/components/study/FeedbackDisplay";
import { AttemptEditor } from "@/components/study/AttemptEditor";
import { SourcePanel } from "@/components/study/SourcePanel";
import { useSubmit } from "@/components/study/useSubmit";
import { api } from "@/lib/client/api";
import { loadStore, saveStore, addQuestion, addAttempt, newId } from "@/lib/storage";
import { countWords } from "@/lib/exam";
import type { MetaResponse, QuestionResponse, FeedbackResponse, GroundedResponse } from "@/lib/client/types";

type Kind = "hypothetical" | "essay";

export function PracticeView({ meta, initialTopicId }: { meta: MetaResponse | null; initialTopicId?: string }) {
  const topics = meta?.taxonomy ?? [];
  const [topicId, setTopicId] = useState(initialTopicId ?? "");
  const [kind, setKind] = useState<Kind>("hypothetical");
  const [attempt, setAttempt] = useState("");
  const [modelFocus, setModelFocus] = useState<string | undefined>(undefined);

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
    if (r) saveStore(addQuestion(loadStore(), { id: newId(), createdAt: Date.now(), ...r.question }));
  };

  const getFeedback = async () => {
    if (!question || !attempt.trim()) return;
    const r = (await fb.submit(question.prompt, attempt, kind)) as FeedbackResponse | null;
    if (r) {
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
    if (r) setModelFocus(r.sources[0]?.chunkId);
  };

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_var(--source-panel-w)]">
      <div className="min-w-0 space-y-5 lg:border-r lg:border-line-faint lg:pr-7">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(["hypothetical", "essay"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-pill px-3.5 py-2 text-caption font-medium transition-colors ${
                kind === k ? "bg-navy text-surface" : "border border-line-strong bg-surface text-muted hover:border-teal"
              }`}
            >
              {k === "hypothetical" ? "Hypothetical" : "Essay"}
            </button>
          ))}
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            aria-label="Topic"
            className="rounded-pill border border-line-strong bg-surface px-3.5 py-2 text-caption text-muted outline-none focus:border-teal"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={gen.loading || !topicId}
            className="rounded-cta bg-navy px-4 py-2 text-caption font-semibold text-surface transition-colors hover:bg-navy/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {gen.loading ? "Generating…" : "Generate question"}
          </button>
          {gen.loading ? <Spinner label="" /> : null}
        </div>
        {gen.error ? <ErrorBanner message={gen.error} /> : null}

        {question ? (
          <div className="rounded-input border border-line bg-surface p-5">
            <div className="mb-2 font-serif text-meta font-semibold uppercase tracking-[0.04em] text-teal">Your question</div>
            <Markdown className="font-serif text-section leading-[1.6] text-ink">{question.prompt}</Markdown>
            {question.guidance ? <p className="mt-2 text-caption text-faint">Aim to cover: {question.guidance}</p> : null}
          </div>
        ) : null}

        {question ? (
          <>
            <AttemptEditor value={attempt} onChange={setAttempt} onSubmit={getFeedback} submitting={fb.loading} />
            <button
              onClick={showModel}
              disabled={model.loading}
              className="text-caption font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal disabled:opacity-50"
            >
              {model.loading ? "Writing the model answer…" : "Show the model answer →"}
            </button>
          </>
        ) : null}

        {model.error ? <ErrorBanner message={model.error} /> : null}
        {model.result ? (
          <div className="space-y-5 border-t border-line-faint pt-5">
            <div className="font-serif text-section font-semibold text-ink">Model answer</div>
            <AnswerDisplay resp={model.result} title={question?.title ?? "model-answer"} onFocusSource={setModelFocus} />
            <SourcePanel sources={model.result.sources} focusedChunkId={modelFocus} />
          </div>
        ) : null}
      </div>

      {/* Feedback panel */}
      <div>
        <div className="rounded-card bg-panel p-5">
          {fb.error ? <ErrorBanner message={fb.error} /> : null}
          {fb.result ? (
            <FeedbackDisplay resp={fb.result} question={question?.prompt ?? ""} attempt={attempt} />
          ) : (
            <p className="text-caption leading-[1.6] text-muted">
              {question
                ? "Write your attempt, then “Submit for marking” — your rubric score and feedback appear here."
                : "Pick a topic and type, then generate a question to attempt."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
