"use client";
import { useState, useCallback } from "react";
import { ApiError } from "@/lib/client/types";

/** Structured error so views can distinguish allowance-reached / unavailable / generic. */
export interface SubmitError {
  message: string;
  code?: string;
  status?: number;
}

/** Generic request hook: loading + structured error + last result, for the study views. */
export function useSubmit<Args extends unknown[], T>(fn: (...args: Args) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);
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
        setError(
          e instanceof ApiError
            ? { message: e.message, code: e.code, status: e.status }
            : { message: "Something went wrong. Please try again." },
        );
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
