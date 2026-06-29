import Link from "next/link";
import { Emblem } from "@/components/study/Emblem";
import { LandingPreview } from "@/components/landing/LandingPreview";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-paper">
      {/* Nav */}
      <header className="border-b border-line-faint">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5">
            <Emblem size={28} />
            <span className="font-serif text-[19px] font-semibold tracking-[-0.01em] text-ink">AdminLaw Coach</span>
          </div>
          <div className="flex items-center gap-6 text-caption text-muted">
            <a href="#how" className="hidden hover:text-ink sm:inline">How it works</a>
            <a href="#inside" className="hidden hover:text-ink sm:inline">What&rsquo;s inside</a>
            <Link href="/study" className="rounded-cta bg-navy px-[18px] py-2.5 text-caption font-medium text-surface hover:bg-navy/90">
              Start studying
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line-faint px-6 py-14 text-center md:px-10 md:pt-16">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-pill border border-[#d8e0da] bg-surface px-3.5 py-1.5">
          <span className="size-[7px] rounded-full bg-teal" />
          <span className="text-[12.5px] font-semibold tracking-[0.02em] text-teal">Only your course materials. Nothing else.</span>
        </div>
        <h1 className="mx-auto max-w-[740px] font-serif text-[34px] font-semibold leading-[1.08] tracking-[-0.015em] text-ink sm:text-hero">
          Every answer, traced back to your own course materials.
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[18px] leading-[1.6] text-muted">
          A study companion for administrative law that answers only from what your unit teaches — pinpointed to the passage,
          or it honestly tells you it isn&rsquo;t covered.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/study" className="rounded-cta bg-navy px-7 py-[15px] text-[16px] font-semibold text-surface hover:bg-navy/90">
            Start studying — free
          </Link>
          <a href="#preview" className="border-b-2 border-teal-soft px-2 py-[15px] text-[16px] font-semibold text-navy hover:border-teal">
            See how sourcing works →
          </a>
        </div>
        <p className="mt-5 text-caption text-faint-2">No login. No account. Nothing stored on a server.</p>
      </section>

      {/* Live trust preview */}
      <section id="preview" className="border-b border-line-faint bg-paper-sunk px-6 py-12 md:px-10">
        <p className="mb-5 text-center font-serif text-section italic text-faint">A real answer looks like this</p>
        <LandingPreview />
      </section>

      {/* What's inside */}
      <section id="inside" className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-card border border-line bg-surface p-5">
              <div className="mb-1.5 font-serif text-section font-semibold text-ink">{f.title}</div>
              <div className="text-caption leading-[1.55] text-muted">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line-faint px-6 py-12 md:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-7 text-center font-serif text-title font-semibold text-ink">How it works</h2>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-caption font-semibold text-surface">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-section font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-caption leading-[1.6] text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line-faint px-6 py-14 text-center md:px-10">
        <Link href="/study" className="inline-flex rounded-cta bg-navy px-7 py-[15px] text-[16px] font-semibold text-surface hover:bg-navy/90">
          Start studying — no account needed
        </Link>
      </section>

      <footer className="border-t border-line-faint px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-meta leading-[1.5] text-faint-2">
          <p>A study aid, not legal advice. For practice and revision, not live assessment.</p>
          <Link href="/contact" className="font-medium text-navy hover:underline">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  { title: "Ask", body: "Plain questions, sourced answers — every claim pinpointed to your materials." },
  { title: "Practice", body: "Generate a hypothetical or essay, attempt it, and get marked against the model-answer issue set." },
  { title: "Model answers", body: "Worked solutions in IRAC, or contention → both sides → preferred — sourced throughout." },
  { title: "Exam", body: "Timed mocks with a word budget and pace, then structured feedback." },
];

const STEPS = [
  { title: "Open the app", body: "No login. A session starts instantly, and your work stays on your device." },
  { title: "Ask or practise", body: "Pick a mode and go — answers are composed only from your course materials." },
  { title: "Check the source", body: "Every claim carries a pinpoint chip; tap it to read the exact passage behind the answer." },
];
