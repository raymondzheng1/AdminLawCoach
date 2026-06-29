"use client";
import { useState } from "react";
import { Button, TextInput, Textarea } from "@/components/ui/primitives";

type State = { kind: "idle" | "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const valid = name.trim() && /.+@.+\..+/.test(email) && message.trim().length >= 10;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, subject: subject || undefined, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setState({ kind: "sent" });
      else setState({ kind: "error", message: data.message ?? "Something went wrong. Please try again." });
    } catch {
      setState({ kind: "error", message: "Couldn’t reach the server. Please try again." });
    }
  };

  if (state.kind === "sent") {
    return (
      <div className="rounded-card border border-line bg-surface p-6 text-center shadow-card">
        <div className="font-serif text-section font-semibold text-ink">Thanks — your message is on its way.</div>
        <p className="mx-auto mt-1 max-w-sm text-caption leading-[1.6] text-muted">
          We’ve sent a confirmation to your email and will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-card">
      <Field label="Name" htmlFor="c-name">
        <TextInput id="c-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
      </Field>
      <Field label="Email" htmlFor="c-email">
        <TextInput id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" />
      </Field>
      <Field label="Subject (optional)" htmlFor="c-subject">
        <TextInput id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
      </Field>
      <Field label="Message" htmlFor="c-message">
        <Textarea id="c-message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} />
        <div className="mt-1 text-meta text-faint-2">{message.trim().length}/2000 · minimum 10 characters</div>
      </Field>

      {state.kind === "error" ? (
        <div role="alert" className="rounded-input border border-line-strong border-l-[3px] border-l-flag bg-flag-bg p-3 text-caption text-flag-fg">
          {state.message}
        </div>
      ) : null}

      <Button type="submit" disabled={!valid || state.kind === "sending"}>
        {state.kind === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-caption font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
