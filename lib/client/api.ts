import { getByoKey } from "@/lib/client/byokey";
import {
  ApiError,
  type GroundedResponse,
  type QuestionResponse,
  type FeedbackResponse,
  type UsageResponse,
  type MetaResponse,
} from "@/lib/client/types";

function headers(): HeadersInit {
  const h: Record<string, string> = { "content-type": "application/json" };
  const key = getByoKey();
  if (key) h["x-byo-key"] = key; // header only; never in the body, never logged server-side
  return h;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string }).error ?? "error", (data as { message?: string }).message ?? "Request failed.");
  }
  return data as T;
}

export const api = {
  ask: (question: string) => post<GroundedResponse>("/api/ask", { question }),
  explain: (target: string) => post<GroundedResponse>("/api/explain", { target }),
  generateQuestion: (type: "hypothetical" | "essay", topicId: string) =>
    post<QuestionResponse>("/api/generate/question", { type, topicId }),
  generateAnswer: (question: string, kind: "hypothetical" | "essay") =>
    post<GroundedResponse>("/api/generate/answer", { question, kind }),
  feedback: (question: string, attemptText: string, kind: "hypothetical" | "essay") =>
    post<FeedbackResponse>("/api/feedback", { question, attemptText, kind }),
  usage: async (): Promise<UsageResponse> => {
    const res = await fetch("/api/usage", { credentials: "include", cache: "no-store" });
    return (await res.json()) as UsageResponse;
  },
  meta: async (): Promise<MetaResponse> => {
    const res = await fetch("/api/meta", { cache: "force-cache" });
    return (await res.json()) as MetaResponse;
  },
};
