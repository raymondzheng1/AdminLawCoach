import type { GroundedResponse, FeedbackResponse } from "@/lib/client/types";

/** Trigger a client-side file download (PRD §6.8 — keep results, nothing stored server-side). */
export function downloadText(filename: string, text: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function groundedToMarkdown(title: string, resp: GroundedResponse): string {
  const lines = [`# ${title}`, ""];
  if (resp.notCovered) {
    lines.push("_Not covered by the provided materials._");
  } else {
    // Strip the inline [[n]] chip markers; the authorities are listed below.
    lines.push(resp.answerMarkdown.replace(/\s*\[\[\d+\]\]/g, ""), "", "## Authorities (pinpointed to your materials)");
    for (const c of resp.citations) lines.push(`- ${c.authority} — ${c.pinpoint} (${c.chunkId})`);
  }
  lines.push("", "---", "_A study aid grounded only in the provided course materials. Not legal advice._");
  return lines.join("\n");
}

export function feedbackToMarkdown(question: string, attempt: string, resp: FeedbackResponse): string {
  const fb = resp.feedback;
  const lines = [`# Feedback`, "", "## Question", question, "", "## Your attempt", attempt, ""];
  if (resp.notCovered || !fb) {
    lines.push("_Not covered by the provided materials._");
  } else {
    lines.push(
      `## Score: ${fb.rubricScore}/100`,
      "",
      "### Issues spotted",
      ...fb.issuesSpotted.map((s) => `- ${s}`),
      "",
      "### Issues missed",
      ...fb.issuesMissed.map((s) => `- ${s}`),
      "",
      "### Structure",
      fb.structureComments,
      "",
      "### Authority use",
      fb.authorityUse.notes,
      ...(fb.authorityUse.flagged.length ? ["", "Flagged (not in your materials):", ...fb.authorityUse.flagged.map((s) => `- ${s}`)] : []),
      "",
      "### Application depth",
      fb.applicationDepth,
      "",
      "### Next actions",
      ...fb.actions.map((s) => `- ${s}`),
    );
  }
  lines.push("", "---", "_A study aid grounded only in the provided course materials. Not legal advice._");
  return lines.join("\n");
}
