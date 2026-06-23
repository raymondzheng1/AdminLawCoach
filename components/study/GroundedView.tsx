"use client";
import { useState } from "react";
import { Spinner } from "@/components/ui/primitives";
import { AnswerDisplay } from "@/components/study/AnswerDisplay";
import { useSubmit } from "@/components/study/useSubmit";
import { useStudy } from "@/components/study/StudyContext";
import type { GroundedResponse } from "@/lib/client/types";

/** Shared single-input grounded view (Ask / Explain): a question pill, then a sourced answer. */
export function GroundedView({
  blurb,
  placeholder,
  cta,
  examples,
  run,
  titleOf,
}: {
  heading?: string;
  blurb: string;
  placeholder: string;
  cta: string;
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
    setValue(v);
    const r = await submit(v);
    if (r) {
      study.setSources(r.sources);
      study.refreshUsage();
    }
  };

  return (
    <div>
      {/* Question pill (input + inline CTA) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void go(value);
        }}
        className="mb-6 flex items-center gap-2 rounded-input border border-line-strong bg-surface py-2 pl-4 pr-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={cta}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-body-soft outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="shrink-0 rounded-input bg-navy px-4 py-2 text-caption font-semibold text-surface transition-colors hover:bg-navy/90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {cta}
        </button>
      </form>

      {loading ? <Spinner label="Composing your answer…" /> : null}
      {error ? <ErrorBanner message={error} /> : null}

      {!result && !loading ? (
        <div>
          <p className="mb-4 max-w-prose text-caption leading-[1.6] text-muted">{blurb}</p>
          {examples && examples.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => void go(ex)}
                  className="rounded-pill border border-line-strong bg-surface px-3.5 py-2 text-caption text-muted transition-colors hover:border-teal hover:text-teal"
                >
                  {ex}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {result ? <AnswerDisplay resp={result} title={titleOf(value)} onFocusSource={study.focusSource} /> : null}
    </div>
  );
}

export function Header({ heading, blurb }: { heading: string; blurb: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-serif text-title font-semibold text-ink">{heading}</h1>
      <p className="mt-1 max-w-prose text-caption leading-[1.6] text-muted">{blurb}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-input border border-line-strong border-l-[3px] border-l-flag bg-flag-bg p-3 text-caption text-flag-fg">
      {message}
    </div>
  );
}
