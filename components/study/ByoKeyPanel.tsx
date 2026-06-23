"use client";
import { useEffect, useState } from "react";
import { Button, Card, TextInput } from "@/components/ui/primitives";
import { getByoKey, setByoKey, clearByoKey, maskKey, isValidByoKeyShape } from "@/lib/client/byokey";

/** Optional bring-your-own-key — held only in this browser, sent only as a request header. */
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
    <div className="relative text-meta">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-medium text-navy underline decoration-teal-soft underline-offset-2 hover:decoration-teal"
      >
        {current ? `Key: ${maskKey(current)}` : "Use your own key"}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(92vw,340px)]">
          <Card className="p-3">
            <p className="text-caption leading-[1.55] text-muted">
              Paste your own key to study without the free-session limit. It stays in this browser and is sent only with your
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
            {error ? <p className="mt-1 text-caption text-warn">{error}</p> : null}
            <div className="mt-2 flex gap-2">
              <Button onClick={save}>Save key</Button>
              {current ? (
                <Button variant="secondary" onClick={remove}>
                  Remove
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
