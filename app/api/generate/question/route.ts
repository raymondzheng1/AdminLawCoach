import type { NextRequest } from "next/server";
import { GenerateQuestionRequestSchema } from "@/lib/schemas/api";
import { getRequestContext, jsonResponse, preflight, parseBody } from "@/lib/api/route-helpers";
import { retrieveForTopic } from "@/lib/retrieval";
import { runQuestion } from "@/lib/generation/runner";
import { systemForQuestion } from "@/lib/generation/prompts";
import { getTaxonomyItem } from "@/lib/corpus";
import { getSessionSpend } from "@/lib/cost";
import { LlmConfigError } from "@/lib/generation/llm";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = getRequestContext(req);
  const body = await parseBody(req, GenerateQuestionRequestSchema);
  if (!body) return jsonResponse({ error: "invalid_input" }, ctx, { status: 400 });

  const topic = getTaxonomyItem(body.topicId);
  if (!topic) return jsonResponse({ error: "unknown_topic", message: "That topic isn't part of this course's materials." }, ctx, { status: 400 });

  const blocked = await preflight(ctx);
  if (blocked.blocked) return blocked.response;

  try {
    const { chunks } = retrieveForTopic(body.topicId, { maxChunks: 10, budgetChars: 18_000, preferRoles: ["rules", "notes"] });
    const question = await runQuestion({
      system: systemForQuestion(body.type),
      topicId: body.topicId,
      topicLabel: topic.label,
      chunks,
      sessionId: ctx.sessionId,
      apiKey: ctx.apiKey,
    });
    const spentUsd = ctx.byoKey ? 0 : await getSessionSpend(ctx.sessionId);
    if (!question) {
      return jsonResponse({ error: "generation_failed", message: "Couldn't generate a question just now. Please try again." }, ctx, { status: 502 });
    }
    return jsonResponse({ question, topicLabel: topic.label, usage: { spentUsd: Number(spentUsd.toFixed(4)), byoKey: ctx.byoKey } }, ctx);
  } catch (e) {
    if (e instanceof LlmConfigError) {
      return jsonResponse({ error: "service_unavailable", message: "The study service is not configured right now." }, ctx, { status: 503 });
    }
    console.error("[/api/generate/question] failed:", e instanceof Error ? e.message : "unknown");
    return jsonResponse({ error: "generation_failed", message: "Something went wrong. Please try again." }, ctx, { status: 500 });
  }
}
