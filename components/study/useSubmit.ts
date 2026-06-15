"use client";
import { useState, useCallback } from "react";
import { ApiError } from "@/lib/client/types";

/** Generic request hook: loading + friendly error + last result, for the study views. */
export function useSubmit<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const submit = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const r = await fn(...args);
        setResult(r);
        return r;
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Something went wrong. Please try again.";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, submit, reset, setResult };
}
