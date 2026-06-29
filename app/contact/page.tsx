import type { Metadata } from "next";
import Link from "next/link";
import { Emblem } from "@/components/study/Emblem";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AdminLaw Coach team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-line-faint">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Emblem size={26} />
            <span className="font-serif text-section font-semibold text-ink">AdminLaw Coach</span>
          </Link>
          <Link href="/study" className="text-caption font-medium text-navy hover:underline">
            Open the app →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
        <h1 className="font-serif text-title font-semibold text-ink">Contact us</h1>
        <p className="mt-1 mb-6 text-caption leading-[1.6] text-muted">
          Questions, feedback, or something not working? Send us a note and we’ll get back to you.
        </p>
        <ContactForm />
      </main>

      <footer className="border-t border-line-faint px-6 py-5">
        <p className="mx-auto max-w-3xl text-meta leading-[1.5] text-faint-2">
          A study aid, not legal advice. For practice and revision, not live assessment.
        </p>
      </footer>
    </div>
  );
}
