import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/contact/route";
import { __setEmailSenderForTests, type EmailArgs } from "@/lib/email";
import { __setRateLimiterForTests } from "@/lib/ratelimit";

let sent: EmailArgs[] = [];

beforeEach(() => {
  sent = [];
  __setRateLimiterForTests(async () => ({ ok: true, remaining: 2, limit: 3 }));
  __setEmailSenderForTests(async (args) => {
    sent.push(args);
    return { ok: true, id: "test" };
  });
});
afterEach(() => {
  __setRateLimiterForTests(null);
  __setEmailSenderForTests(null);
});

function contact(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
}

const valid = { name: "Alex Student", email: "alex@example.com", subject: "Help", message: "Can you explain unreasonableness?" };

describe("/api/contact", () => {
  it("sends the enquiry to the operator (reply-to the sender), no acknowledgement", async () => {
    const res = await POST(contact(valid));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(sent.length).toBe(1); // operator notification only
    const op = sent[0]!;
    expect(op.to).toBe("raymond.zheng@gmail.com"); // ADMIN_NOTIFY_EMAIL default
    expect(op.replyTo).toBe("alex@example.com");
    expect(op.subject).toContain("Alex Student");
  });

  it("escapes HTML in the operator email body (no injection)", async () => {
    await POST(contact({ ...valid, name: "<script>x</script>" }));
    expect(sent[0]!.html).not.toContain("<script>");
    expect(sent[0]!.html).toContain("&lt;script&gt;");
  });

  it("rejects invalid input (message too short) with 400", async () => {
    const res = await POST(contact({ ...valid, message: "too short" }));
    expect(res.status).toBe(400);
    expect(sent.length).toBe(0);
  });

  it("fails closed with 429 when rate-limited", async () => {
    __setRateLimiterForTests(async () => ({ ok: false, remaining: 0, limit: 3 }));
    const res = await POST(contact(valid));
    expect(res.status).toBe(429);
    expect(sent.length).toBe(0);
  });

  it("returns 503 when email is not configured", async () => {
    __setEmailSenderForTests(async () => ({ ok: false, error: "resend_unconfigured" }));
    const res = await POST(contact(valid));
    expect(res.status).toBe(503);
  });
});
