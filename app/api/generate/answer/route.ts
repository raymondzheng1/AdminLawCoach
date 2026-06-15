import type { NextRequest } from "next/server";
import { GenerateAnswerRequestSchema } from "@/lib/schemas/api";
import { handleGroundedRequest } from "@/lib/api/grounded";
import { systemForHypoAnswer, systemForEssayAnswer } from "@/lib/generation/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Peek the kind to choose IRAC vs essay structure; handler re-parses with the schema.
  const cloned = req.clone();
  const peek = await cloned.json().catch(() => null);
  const kind = peek && peek.kind === "essay" ? "essay" : "hypothetical";
  return handleGroundedRequest(req, {
    schema: GenerateAnswerRequestSchema,
    getQuery: (b) => b.question,
    mode: kind === "essay" ? "essay" : "hypo",
    system: kind === "essay" ? systemForEssayAnswer() : systemForHypoAnswer(),
    retrieveOpts: { preferRoles: ["model", "notes", "rules"], maxChunks: 16, budgetChars: 26_000 },
    routeLabel: "/api/generate/answer",
  });
}
