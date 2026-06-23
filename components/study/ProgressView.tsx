"use client";
import { useEffect, useRef, useState } from "react";
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
  const weakId = activeTopics.length ? weakestTopic(store.progress, candidateTopics.length ? candidateTopics : activeTopics) : null;
  const hasActivity = activeTopics.length > 0 || store.attempts.length > 0;

  const onImport = async (file: File) => {
    const imported = importJson(await file.text());
    if (imported) {
      saveStore(imported);
      setStore(imported);
    }
  };

  return (
    <div className="space-y-5">
      <Header heading="Progress" blurb="Your practice on this device. Nothing is stored on our servers — export to keep a copy or move devices." />

      {!hasActivity ? (
        <div className="rounded-card border border-line bg-surface p-6 text-center">
          <p className="font-serif text-section text-ink">Your progress will build here.</p>
          <p className="mx-auto mt-1 max-w-md text-caption leading-[1.6] text-muted">
            Generate and attempt a question in Practice, and your scores, weakest topic, and recent attempts will appear — all kept on this device.
          </p>
          <button
            onClick={() => candidateTopics[0] && onPracticeTopic(candidateTopics[0])}
            className="mt-4 rounded-cta bg-navy px-5 py-2.5 text-caption font-semibold text-surface hover:bg-navy/90"
          >
            Start practising →
          </button>
        </div>
      ) : null}

      {weakId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-teal bg-teal-tint p-5">
          <div>
            <div className="text-meta font-semibold uppercase tracking-[0.1em] text-teal">Practise your weak area</div>
            <div className="mt-0.5 font-serif text-section font-semibold text-ink">{labelOf(weakId)}</div>
          </div>
          <button onClick={() => onPracticeTopic(weakId)} className="rounded-cta bg-navy px-4 py-2.5 text-caption font-semibold text-surface hover:bg-navy/90">
            Practise this
          </button>
        </div>
      ) : null}

      {activeTopics.length > 0 ? (
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-serif text-section font-semibold text-ink">By topic</h2>
          <div className="space-y-3">
            {activeTopics.map((id) => {
              const t = store.progress.byTopic[id]!;
              const avg = averageScore(store.progress, id);
              return (
                <div key={id} className="flex items-center gap-3 text-caption">
                  <span className="w-40 shrink-0 truncate text-ink">{labelOf(id)}</span>
                  <span className="h-[7px] flex-1 overflow-hidden rounded-[4px] bg-line-faint">
                    <span className="block h-full rounded-[4px] bg-teal" style={{ width: `${avg ?? 0}%` }} />
                  </span>
                  <span className="w-28 shrink-0 text-right tabular-nums text-faint-2">
                    {avg !== null ? `avg ${Math.round(avg)}` : "—"} · {t.attempts}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {store.attempts.length > 0 ? (
        <div className="rounded-card border border-line bg-surface p-5">
          <h2 className="mb-3 font-serif text-section font-semibold text-ink">Recent attempts</h2>
          <ul className="space-y-2">
            {store.attempts.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 text-caption">
                <span className="truncate text-muted">{a.question.slice(0, 80)}</span>
                {typeof a.score === "number" ? (
                  <span className="shrink-0 rounded-pill bg-teal-tint px-2 py-0.5 font-mono text-meta font-semibold text-teal">{a.score}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadText("adminlaw-progress.json", exportJson(store))}
          className="rounded-cta border border-line-strong bg-surface px-4 py-2 text-caption font-semibold text-navy hover:bg-paper"
        >
          Export progress
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          className="rounded-cta px-4 py-2 text-caption font-semibold text-navy hover:bg-teal-tint"
        >
          Import
        </button>
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
