"use client";
import { useState } from "react";
import { Spinner, Textarea } from "@/components/ui/primitives";
import { Header, ErrorBanner } from "@/components/study/GroundedView";
import { AnswerDisplay } from "@/components/study/AnswerDisplay";
import { useStudy } from "@/components/study/StudyContext";
import { useSubmit } from "@/components/study/useSubmit";
import { api } from "@/lib/client/api";

type Kind = "hypothetical" | "essay";

export function ModelAnswerView() {
  const study = useStudy();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Kind>("hypothetical");
  const { loading, error, result, submit } = useSubmit((q: string, k: Kind) => api.generateAnswer(q, k));

  const go = async () => {
    if (!text.trim() || loading) return;
    const r = await submit(text, kind);
    if (r) {
      study.setSources(r.sources);
      study.refreshUsage();
    }
  };

  return (
    <div>
      <Header
        heading="Model answers"
        blurb="Paste a hypothetical or essay prompt — a worked answer in IRAC (or contention → both sides → preferred), every authority pinpointed to your materials."
      />
      <Textarea rows={6} placeholder="Paste the hypothetical facts or essay contention…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind)}
          className="rounded-input border border-line-strong bg-surface px-3 py-2 text-caption text-muted outline-none focus:border-teal"
        >
          <option value="hypothetical">Hypothetical (IRAC)</option>
          <option value="essay">Essay</option>
        </select>
        <button
          onClick={go}
          disabled={loading || !text.trim()}
          className="rounded-cta bg-navy px-4 py-2 text-caption font-semibold text-surface transition-colors hover:bg-navy/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          Write model answer
        </button>
        {loading ? <Spinner label="Writing…" /> : null}
      </div>
      {error ? <div className="mt-4"><ErrorBanner message={error} /></div> : null}
      {result ? (
        <div className="mt-6">
          <AnswerDisplay resp={result} title="model-answer" onFocusSource={study.focusSource} />
        </div>
      ) : null}
    </div>
  );
}
