"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui/primitives";
import { Header } from "@/components/study/GroundedView";
import { loadStore, saveStore, averageScore, weakestTopic, exportJson, importJson } from "@/lib/storage";
import { downloadText } from "@/lib/client/download";
import type { Store } from "@/lib/schemas/storage";
import type { MetaResponse } from "@/lib/client/types";

export function ProgressView({ meta, onPracticeTopic }: { meta: MetaResponse | null; onPracticeTopic: (topicId: string) => void }) {
  const [store, setStore] = useState<Store | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStore(loadStore());
  }, []);

  if (!store) return <Header heading="Progress" blurb="Loading your single-device progress…" />;

  const labelOf = (id: string) => meta?.taxonomy.find((t) => t.id === id)?.label ?? id;
  const activeTopics = Object.keys(store.progress.byTopic).filter(
    (id) => (store.progress.byTopic[id]?.attempts ?? 0) > 0 || (store.progress.byTopic[id]?.practiced ?? 0) > 0,
  );
  const candidateTopics = (meta?.taxonomy.map((t) => t.id) ?? activeTopics).filter(Boolean);
  const weakId = weakestTopic(store.progress, candidateTopics.length ? candidateTopics : activeTopics);

  const onImport = async (file: File) => {
    const text = await file.text();
    const imported = importJson(text);
    if (imported) {
      saveStore(imported);
      setStore(imported);
    }
  };

  return (
    <div className="space-y-4">
      <Header heading="Progress" blurb="Your practice on this device. Nothing is stored on our servers — export to keep a copy or move devices." />

      {weakId ? (
        <Card className="border-[var(--color-accent)] bg-[var(--color-accent-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px]">
              <strong>Practise your weak area:</strong> {labelOf(weakId)}
            </p>
            <Button onClick={() => onPracticeTopic(weakId)}>Practise this</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-[15px] text-[var(--color-muted)]">Practise a few questions and your weakest topic will show up here with a one-tap way to drill it.</p>
        </Card>
      )}

      {activeTopics.length > 0 ? (
        <Card>
          <h2 className="mb-2 text-[var(--text-small)] font-semibold uppercase tracking-wide text-[var(--color-muted)]">By topic</h2>
          <div className="divide-y divide-[var(--color-border)]">
            {activeTopics.map((id) => {
              const t = store.progress.byTopic[id]!;
              const avg = averageScore(store.progress, id);
              return (
                <div key={id} className="flex items-center justify-between py-2 text-[15px]">
                  <span>{labelOf(id)}</span>
                  <span className="tabular-nums text-[var(--color-muted)]">
                    {t.attempts} attempt{t.attempts === 1 ? "" : "s"}
                    {avg !== null ? ` · avg ${Math.round(avg)}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {store.attempts.length > 0 ? (
        <Card>
          <h2 className="mb-2 text-[var(--text-small)] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Recent attempts</h2>
          <ul className="space-y-1 text-[14px]">
            {store.attempts.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-[var(--color-muted)]">{a.question.slice(0, 70)}</span>
                {typeof a.score === "number" ? <span className="shrink-0 tabular-nums font-medium">{a.score}</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => downloadText("adminlaw-progress.json", exportJson(store))}>
          Export progress
        </Button>
        <Button variant="ghost" onClick={() => fileInput.current?.click()}>
          Import
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
          }}
        />
      </div>
    </div>
  );
}
