import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { getRequestContext, jsonResponse, preflight, parseBody, resolveSources } from "@/lib/api/route-helpers";
import { retrieve, type RetrievalOptions } from "@/lib/retrieval";
import { runGrounded } from "@/lib/generation/runner";
import { getSessionSpend } from "@/lib/cost";
import { LlmConfigError } from "@/lib/generation/llm";
import type { Mode } from "@/lib/verification";

/**
 * Shared core for the grounded-answer routes (Ask / Model-answer / Explain) — one
 * pipeline (§3.1): preflight (cost+rate, fail-closed) → retrieve → runGrounded
 * (generate→verify→regenerate→"not covered") → respond with sourced citations.
 */
export async function handleGroundedRequest<T>(
  req: NextRequest,
  cfg: {
    schema: z.ZodType<T>;
    getQuery: (body: T) => string;
    mode: Mode;
    system: string;
    retrieveOpts?: RetrievalOptions;
    routeLabel: string;
  },
): Promise<NextResponse> {
  const ctx = getRequestContext(req);
  const body = await parseBody(req, cfg.schema);
  if (!body) return jsonResponse({ error: "invalid_input" }, ctx, { status: 400 });

  const blocked = await preflight(ctx);
  if (blocked.blocked) return blocked.response;

  try {
    const query = cfg.getQuery(body);
    const { chunks } = retrieve(query, cfg.retrieveOpts);
    const result = await runGrounded({
      mode: cfg.mode,
      system: cfg.system,
      query,
      chunks,
      sessionId: ctx.sessionId,
      apiKey: ctx.apiKey,
    });
    const spentUsd = ctx.byoKey ? 0 : await getSessionSpend(ctx.sessionId);
    return jsonResponse(
      {
        notCovered: result.notCovered,
        answerMarkdown: result.answer.answerMarkdown,
        citations: result.answer.citations,
        sources: resolveSources(result.answer.citations),
        usage: { spentUsd: Number(spentUsd.toFixed(4)), byoKey: ctx.byoKey },
      },
      ctx,
    );
  } catch (e) {
    if (e instanceof LlmConfigError) {
      return jsonResponse({ error: "service_unavailable", message: "The study service is not configured right now." }, ctx, { status: 503 });
    }
    console.error(`[${cfg.routeLabel}] generation_failed:`, e instanceof Error ? e.message : "unknown");
    return jsonResponse({ error: "generation_failed", message: "Something went wrong producing your answer. Please try again." }, ctx, { status: 500 });
  }
}
