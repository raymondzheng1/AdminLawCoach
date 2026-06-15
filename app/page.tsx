import Link from "next/link";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-display text-lg font-semibold">{SITE.name}</span>
        <Link href="/study" className="text-[15px] font-medium text-[var(--color-primary)] hover:underline">
          Open the app →
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pt-10 pb-14 text-center">
        <p className="text-[var(--text-small)] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          Free · no sign-up · sourced to your materials
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{SITE.tagline}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
          Ask questions, generate practice, and check your work for one administrative-law course — with a hard guarantee:
          every answer is pinpointed to your course materials, or it says it isn&rsquo;t covered. Nothing outside them is
          ever introduced.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/study"
            className="inline-flex min-h-[48px] items-center rounded-lg bg-[var(--color-primary)] px-6 font-medium text-[var(--color-primary-fg)] hover:opacity-90"
          >
            Start studying — free
          </Link>
        </div>
      </section>

      {/* Live preview of the trust surface */}
      <section className="mx-auto max-w-3xl px-5 pb-14">
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-paper)] px-5 py-3 text-[var(--text-small)] font-medium text-[var(--color-muted)]">
            Ask · &ldquo;What is the test for legal unreasonableness?&rdquo;
          </div>
          <div className="p-5">
            <p className="leading-relaxed">
              A decision is legally unreasonable if it lacks an evident and intelligible justification — assessed against the
              scope and purpose of the statute. It is a conclusion reached after identifying the legal error, and is treated as
              a last resort and a stringent standard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pinpoint-chip">Li · Notes</span>
              <span className="pinpoint-chip">SZVFW · Notes</span>
            </div>
            <p className="mt-3 text-[var(--text-caption)] text-[var(--color-muted)]">
              Illustrative. In the app, each chip opens the exact passage it came from.
            </p>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section className="mx-auto max-w-5xl px-5 pb-14">
        <h2 className="text-center font-display text-2xl font-semibold">What&rsquo;s inside</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-3xl px-5 pb-14">
        <h2 className="text-center font-display text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-semibold text-[var(--color-primary-fg)]">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-[var(--color-muted)]">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-3xl px-5 pb-16 text-center">
        <Link
          href="/study"
          className="inline-flex min-h-[48px] items-center rounded-lg bg-[var(--color-primary)] px-6 font-medium text-[var(--color-primary-fg)] hover:opacity-90"
        >
          Open the app — no account needed
        </Link>
      </section>

      <footer className="border-t border-[var(--color-border)] px-5 py-8">
        <div className="mx-auto max-w-5xl text-[13px] leading-relaxed text-[var(--color-muted)]">
          <p>
            {SITE.name} is a study aid grounded only in the provided course materials — not legal advice, and intended for
            practice and revision rather than live assessment. Free to use, with a small per-session usage cap; bring your own
            key to remove it.
          </p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { title: "Ask", body: "Plain-language answers to course questions, every authority pinpointed back to your materials." },
  { title: "Practice", body: "Generate fresh hypotheticals and essays from any topic, then get marked against the model-answer issue set." },
  { title: "Model answers", body: "Worked answers in IRAC or contention → both sides → preferred, sourced throughout." },
  { title: "Exam mode", body: "Timed mocks with a word budget and pace tracking, then structured feedback and a downloadable copy." },
];

const STEPS = [
  { title: "Open the app", body: "No login. A session starts instantly — your work stays on your device." },
  { title: "Ask or practise", body: "Pick a mode and go. Answers are composed only from your course materials." },
  { title: "Check the source", body: "Every claim carries a pinpoint chip — open it to read the exact passage behind the answer." },
];
