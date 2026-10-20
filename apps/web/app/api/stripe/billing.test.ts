import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { getParentEmail, resendMailer } from "./billing";
import type { ReportMail } from "./handlers";

const MAIL: ReportMail = {
  to: "parent@example.test",
  subject: "s",
  text: "t",
  html: "<p>t</p>",
  attachment: { filename: "r.pdf", content: new Uint8Array([1, 2, 3]) },
  idempotencyKey: "report-email/cs_test",
};

function adminWith(user: { email?: string; email_confirmed_at?: string | null } | null) {
  const getUserById = vi.fn().mockResolvedValue({ data: { user }, error: null });
  return { admin: { auth: { admin: { getUserById } } } as unknown as SupabaseClient };
}

describe("getParentEmail (R3-P5)", () => {
  it("returns the address of a confirmed user", async () => {
    const { admin } = adminWith({ email: "a@example.test", email_confirmed_at: "2026-10-01T00:00:00Z" });
    expect(await getParentEmail(admin, "p")).toBe("a@example.test");
  });
  it.each([
    ["null", null],
    ["missing", undefined],
  ])("returns null for an address that is not confirmed (%s)", async (_n, at) => {
    const { admin } = adminWith({ email: "a@example.test", email_confirmed_at: at });
    expect(await getParentEmail(admin, "p")).toBeNull();
  });
});

describe("resendMailer (R3-P3)", () => {
  function resendReturning(error: { statusCode: number | null; name: string } | null) {
    const send = vi.fn().mockResolvedValue({ data: error ? null : { id: "e" }, error });
    return { resend: { emails: { send } } as unknown as Resend, send };
  }
  it("accepts an accepted email", async () => {
    expect(await resendMailer(resendReturning(null).resend, "f@example.test").send(MAIL)).toEqual({ ok: true });
  });
  it("treats 409 invalid_idempotent_request as already sent (the first attempt went out)", async () => {
    const { resend } = resendReturning({ statusCode: 409, name: "invalid_idempotent_request" });
    expect(await resendMailer(resend, "f@example.test").send(MAIL)).toEqual({ ok: true });
  });
  it("treats 409 concurrent_idempotent_requests as transient, so Stripe retries", async () => {
    const { resend } = resendReturning({ statusCode: 409, name: "concurrent_idempotent_requests" });
    expect(await resendMailer(resend, "f@example.test").send(MAIL)).toEqual({ ok: false, permanent: false });
  });
  it("treats another 4xx as permanent and a 429 or 5xx as transient", async () => {
    const m = (e: { statusCode: number; name: string }) => resendMailer(resendReturning(e).resend, "f@example.test").send(MAIL);
    expect(await m({ statusCode: 403, name: "validation_error" })).toEqual({ ok: false, permanent: true });
    expect(await m({ statusCode: 429, name: "rate_limit_exceeded" })).toEqual({ ok: false, permanent: false });
    expect(await m({ statusCode: 500, name: "application_error" })).toEqual({ ok: false, permanent: false });
  });
});
