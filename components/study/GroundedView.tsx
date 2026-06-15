"use client";
import { useState } from "react";
import { Button, Card, Spinner, Textarea, TextInput } from "@/components/ui/primitives";
import { AnswerDisplay } from "@/components/study/AnswerDisplay";
import { useSubmit } from "@/components/study/useSubmit";
import { useStudy } from "@/components/study/StudyContext";
import type { GroundedResponse } from "@/lib/client/types";

/** Shared single-input grounded view (Ask / Explain). */
export function GroundedView({
  heading,
  blurb,
  placeholder,
  cta,
  multiline,
  examples,
  run,
  titleOf,
}: {
  heading: string;
  blurb: string;
  placeholder: string;
  cta: string;
  multiline?: boolean;
  examples?: string[];
  run: (value: string) => Promise<GroundedResponse>;
  titleOf: (value: string) => string;
}) {
  const [value, setValue] = useState("");
  const study = useStudy();
  const { loading, error, result, submit } = useSubmit(run);

  const go = async (text: string) => {
    const v = text.trim();
    if (!v || loading) return;
    const r = await submit(v);
    if (r) {
      study.setSources(r.sources);
      study.refreshUsage();
    }
  };

  return (
    <div className="space-y-4">
      <Header heading={heading} blurb={blurb} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void go(value);
        }}
        className="space-y-3"
      >
        {multiline ? (
          <Textarea rows={3} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
        ) : (
          <TextInput placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} />
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || !value.trim()}>
            {cta}
          </Button>
          {loading ? <Spinner /> : null}
        </div>
      </form>

      {examples && examples.length > 0 && !result ? (
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setValue(ex);
                void go(ex);
              }}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-muted)] hover:border-[var(--color-accent)]"
            >
              {ex}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}
      {result ? (
        <Card>
          <AnswerDisplay resp={result} title={titleOf(value)} onFocusSource={study.focusSource} />
        </Card>
      ) : null}
    </div>
  );
}

export function Header({ heading, blurb }: { heading: string; blurb: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-1 text-[15px] text-[var(--color-muted)]">{blurb}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-[#e7c3c3] bg-[#fbeaea] p-3 text-[14px] text-[var(--color-danger)]">
      {message}
    </div>
  );
}
