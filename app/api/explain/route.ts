import type { NextRequest } from "next/server";
import { ExplainRequestSchema } from "@/lib/schemas/api";
import { handleGroundedRequest } from "@/lib/api/grounded";
import { systemForExplain } from "@/lib/generation/prompts";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handleGroundedRequest(req, {
    schema: ExplainRequestSchema,
    getQuery: (b) => b.target,
    mode: "explain",
    system: systemForExplain(),
    retrieveOpts: { preferRoles: ["notes", "rules"] },
    routeLabel: "/api/explain",
  });
}
