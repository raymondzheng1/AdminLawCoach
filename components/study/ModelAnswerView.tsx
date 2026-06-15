"use client";
import { useState } from "react";
import { Button, Card, Spinner, Textarea } from "@/components/ui/primitives";
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
    <div className="space-y-4">
      <Header
        heading="Model answers"
        blurb="Paste a hypothetical or essay prompt — get a worked model answer in IRAC (or contention → both sides → preferred), every authority pinpointed to your materials."
      />
      <Card>
        <Textarea rows={6} placeholder="Paste the hypothetical facts or essay contention…" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[15px]">
            <option value="hypothetical">Hypothetical (IRAC)</option>
            <option value="essay">Essay</option>
          </select>
          <Button onClick={go} disabled={loading || !text.trim()}>
            {loading ? "Writing…" : "Write model answer"}
          </Button>
          {loading ? <Spinner /> : null}
        </div>
      </Card>
      {error ? <ErrorBanner message={error} /> : null}
      {result ? (
        <Card>
          <AnswerDisplay resp={result} title="model-answer" onFocusSource={study.focusSource} />
        </Card>
      ) : null}
    </div>
  );
}
