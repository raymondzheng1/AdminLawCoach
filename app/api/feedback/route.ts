import type { NextRequest } from "next/server";
import { FeedbackRequestSchema } from "@/lib/schemas/api";
import { getRequestContext, jsonResponse, preflight, parseBody, resolveSources } from "@/lib/api/route-helpers";
import { retrieve } from "@/lib/retrieval";
import { runFeedback } from "@/lib/generation/runner";
import { systemForFeedback } from "@/lib/generation/prompts";
import { getSessionSpend } from "@/lib/cost";
import { LlmConfigError } from "@/lib/generation/llm";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const body = await parseBody(req, FeedbackRequestSchema);
  if (!body) return jsonResponse({ error: "invalid_input" }, ctx, { status: 400 });

  const blocked = await preflight(ctx);
  if (blocked.blocked) return blocked.response;

  try {
    // Retrieve against the question (the attempt text is the student's data, not a query).
    const { chunks } = retrieve(body.question, { preferRoles: ["model", "notes", "rules"], maxChunks: 16, budgetChars: 26_000 });
    const result = await runFeedback({
      system: systemForFeedback(),
      question: body.question,
      attemptText: body.attemptText,
      chunks,
      sessionId: ctx.sessionId,
      apiKey: ctx.apiKey,
    });
    const spentUsd = ctx.byoKey ? 0 : await getSessionSpend(ctx.sessionId);
    if (!result.feedback && !result.notCovered) {
      return jsonResponse({ error: "generation_failed", message: "Couldn't mark that attempt just now. Please try again." }, ctx, { status: 502 });
    }
    return jsonResponse(
      {
        notCovered: result.notCovered,
        feedback: result.feedback,
        sources: result.feedback ? resolveSources(result.feedback.citations) : [],
        usage: { spentUsd: Number(spentUsd.toFixed(4)), byoKey: ctx.byoKey },
      },
      ctx,
    );
  } catch (e) {
    if (e instanceof LlmConfigError) {
      return jsonResponse({ error: "service_unavailable", message: "The study service is not configured right now." }, ctx, { status: 503 });
    }
    console.error("[/api/feedback] failed:", e instanceof Error ? e.message : "unknown");
    return jsonResponse({ error: "generation_failed", message: "Something went wrong. Please try again." }, ctx, { status: 500 });
  }
}
