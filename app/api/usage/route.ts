import type { NextRequest } from "next/server";
import { getRequestContext, jsonResponse } from "@/lib/api/route-helpers";
import { getSessionSpend, SESSION_CAP_USD } from "@/lib/cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current session spend for the usage meter (§9 trust surface). No model call. */
export async function GET(req: NextRequest) {
  const ctx = getRequestContext(req);
  const spentUsd = ctx.byoKey ? 0 : await getSessionSpend(ctx.sessionId);
  return jsonResponse(
    { spentUsd: Number(spentUsd.toFixed(4)), capUsd: SESSION_CAP_USD, byoKey: ctx.byoKey },
    ctx,
  );
}
