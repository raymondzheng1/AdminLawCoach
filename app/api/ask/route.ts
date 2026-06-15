import type { NextRequest } from "next/server";
import { AskRequestSchema } from "@/lib/schemas/api";
import { handleGroundedRequest } from "@/lib/api/grounded";
import { systemForAsk } from "@/lib/generation/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handleGroundedRequest(req, {
    schema: AskRequestSchema,
    getQuery: (b) => b.question,
    mode: "ask",
    system: systemForAsk(),
    retrieveOpts: { preferRoles: ["notes", "rules"] },
    routeLabel: "/api/ask",
  });
}
