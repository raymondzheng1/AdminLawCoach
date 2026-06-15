"use client";
import { useEffect, useState } from "react";
import { Button, TextInput } from "@/components/ui/primitives";
import { getByoKey, setByoKey, clearByoKey, maskKey, isValidByoKeyShape } from "@/lib/client/byokey";

/** Optional bring-your-own-key — held only in this browser, never sent except as a request header. */
export function ByoKeyPanel({ onChange }: { onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(getByoKey());
  }, []);

  const save = () => {
    if (!isValidByoKeyShape(draft)) {
      setError("That doesn't look like a valid key — it should start with sk-ant-…");
      return;
    }
    setByoKey(draft);
    setCurrent(getByoKey());
    setDraft("");
    setError(null);
    setOpen(false);
    onChange();
  };
  const remove = () => {
    clearByoKey();
    setCurrent(null);
    onChange();
  };

  return (
    <div className="text-[var(--text-caption)]">
      <button onClick={() => setOpen((o) => !o)} className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline">
        {current ? `Key: ${maskKey(current)}` : "Use your own key"}
      </button>
      {open ? (
        <div className="card mt-2 w-[min(92vw,340px)] p-3">
          <p className="text-[var(--color-muted)]">
            Paste your own key to study without the free-session limit. It stays in this browser and is only sent with your
            requests — never stored on our servers.
          </p>
          <TextInput
            type="password"
            placeholder="sk-ant-…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-2"
            aria-label="Your API key"
          />
          {error ? <p className="mt-1 text-[var(--color-danger)]">{error}</p> : null}
          <div className="mt-2 flex gap-2">
            <Button onClick={save}>Save key</Button>
            {current ? (
              <Button variant="danger" onClick={remove}>
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
