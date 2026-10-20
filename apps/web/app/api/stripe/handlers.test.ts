import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handleCheckout,
  handleWebhook,
  type CheckoutDeps,
  type MailResult,
  type ReportMail,
  type WebhookDeps,
} from "./handlers";

// D-05b (DECIDED, Hatem, 2026-10-20): the detailed report is a one-off payment per report, sent by email
// to the parent who paid. Stripe and Resend are test doubles here: no network, no real key.

const PARENT = "00000000-0000-4000-8000-00000000000a";
const SESSION = "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b";
const CHILD = "00000000-0000-4000-8000-0000000000c1";
const PRICE = "price_synthetic";
const CHECKOUT = "cs_test_synthetic";
const PARENT_EMAIL = "parent-a@example.test";
// Synthetic signing value for the test only (a real one lives in STRIPE_WEBHOOK_SECRET).
const SIGNING = "synthetic-signing-value";
const stripe = new Stripe("unused-by-signature-checks");

function post(path: string, body: unknown = { sessionId: SESSION }, headers: Record<string, string> = { "content-type": "application/json" }) {
  return new Request(`https://demo.example.test${path}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/stripe/checkout (FR-45, D-05b one-off payment per report)", () => {
  function deps(o: Partial<{ parentId: string | null; priceId: string; own: { childId: string; scored: boolean } | null; paid: boolean }> = {}) {
    const c = { parentId: PARENT as string | null, priceId: PRICE, own: { childId: CHILD, scored: true } as { childId: string; scored: boolean } | null, paid: false, ...o };
    const createCheckoutSession = vi.fn<CheckoutDeps["createCheckoutSession"]>().mockResolvedValue({ id: CHECKOUT, url: "https://checkout.example.test/s" });
    const startPurchase = vi.fn<CheckoutDeps["startPurchase"]>().mockResolvedValue("started");
    const getOwnSession = vi.fn<CheckoutDeps["getOwnSession"]>().mockResolvedValue(c.own);
    const isPaid = vi.fn<CheckoutDeps["isPaid"]>().mockResolvedValue(c.paid);
    const d: CheckoutDeps = { getParentId: async () => c.parentId, priceId: c.priceId, getOwnSession, isPaid, createCheckoutSession, startPurchase };
    return { d, createCheckoutSession, startPurchase, getOwnSession, isPaid };
  }

  it("creates a one-off payment checkout for this report, with the parent and session in metadata", async () => {
    const { d, createCheckoutSession, startPurchase } = deps();
    const res = await handleCheckout(post("/api/stripe/checkout"), d);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://checkout.example.test/s" });
    expect(createCheckoutSession).toHaveBeenCalledWith({
      priceId: PRICE,
      parentId: PARENT,
      sessionId: SESSION,
      lang: "en",
      successUrl: `https://demo.example.test/parent/${CHILD}?report=paid`,
      cancelUrl: `https://demo.example.test/parent/${CHILD}`,
    });
    expect(startPurchase).toHaveBeenCalledWith({ parentId: PARENT, sessionId: SESSION, checkoutId: CHECKOUT, lang: "en" });
  });

  it("takes the email language from the browser language (Romanian when the first preference is ro)", async () => {
    const { d, createCheckoutSession } = deps();
    await handleCheckout(post("/api/stripe/checkout", { sessionId: SESSION }, { "content-type": "application/json", "accept-language": "ro-RO,ro;q=0.9,en;q=0.8" }), d);
    expect(createCheckoutSession.mock.calls[0]![0].lang).toBe("ro");
  });

  it("answers 409 already_paid when this report is already paid, and opens no checkout", async () => {
    const { d, createCheckoutSession, startPurchase } = deps({ paid: true });
    const res = await handleCheckout(post("/api/stripe/checkout"), d);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "already_paid" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(startPurchase).not.toHaveBeenCalled();
  });

  it("answers 404 for another parent's session (RLS shows nothing) and opens no checkout", async () => {
    const { d, createCheckoutSession } = deps({ own: null });
    const res = await handleCheckout(post("/api/stripe/checkout"), d);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "unknown_session" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("answers 404 not_scored for a session with no result yet (no report to sell)", async () => {
    const { d, createCheckoutSession } = deps({ own: { childId: CHILD, scored: false } });
    const res = await handleCheckout(post("/api/stripe/checkout"), d);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_scored" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([
    ["no body field", {}],
    ["a session id that is not a uuid", { sessionId: "not-a-uuid" }],
    ["an unknown field (a client cannot choose the price or the recipient)", { sessionId: SESSION, email: "someone@example.test" }],
  ])("answers 400 for %s", async (_name, body) => {
    const { d, createCheckoutSession } = deps();
    expect((await handleCheckout(post("/api/stripe/checkout", body), d)).status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("answers 401 when no parent is logged in", async () => {
    const { d, createCheckoutSession } = deps({ parentId: null });
    expect((await handleCheckout(post("/api/stripe/checkout"), d)).status).toBe(401);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("answers 503 when no price is configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, createCheckoutSession } = deps({ priceId: "" });
    const res = await handleCheckout(post("/api/stripe/checkout"), d);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "billing_not_configured" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("refuses a request not sent as JSON (blocks cross-site form posts)", async () => {
    const { d } = deps();
    expect((await handleCheckout(post("/api/stripe/checkout", "{}", { "content-type": "text/plain" }), d)).status).toBe(415);
  });

  it("answers 502 when Stripe fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, createCheckoutSession } = deps();
    createCheckoutSession.mockRejectedValue(new Error("stripe down"));
    expect((await handleCheckout(post("/api/stripe/checkout"), d)).status).toBe(502);
  });
});

describe("POST /api/stripe/webhook (FR-47, D-05b)", () => {
  type Over = Partial<{ type: string; mode: string; payment_status: string; metadata: Record<string, string>; created: number }>;
  function event(o: Over = {}) {
    return JSON.stringify({
      id: "evt_synthetic",
      object: "event",
      type: o.type ?? "checkout.session.completed",
      created: o.created ?? 1_760_000_000,
      data: {
        object: {
          id: CHECKOUT,
          object: "checkout.session",
          mode: o.mode ?? "payment",
          payment_status: o.payment_status ?? "paid",
          client_reference_id: PARENT,
          metadata: o.metadata ?? { parent_id: PARENT, session_id: SESSION, lang: "en" },
        },
      },
    });
  }

  function signed(payload: string, secret = SIGNING) { // check-secrets: allow
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret }); // check-secrets: allow
    return post("/api/stripe/webhook", payload, { "content-type": "application/json", "stripe-signature": signature });
  }

  // A stateful fake of the report_purchases table, so a replayed event meets the row the first one wrote.
  function deps(o: Partial<{ mailer: "ok" | "permanent" | "transient" | "none"; email: string | null; emailedAlready: boolean }> = {}) {
    const c = { mailer: "ok" as const, email: PARENT_EMAIL as string | null, emailedAlready: false, ...o };
    const row = { status: "pending", emailed: c.emailedAlready };
    const markPaid = vi.fn<WebhookDeps["markPaid"]>(async () => {
      const outcome = row.status === "paid" ? "already_paid" : "paid";
      row.status = "paid";
      return { outcome, emailed: row.emailed };
    });
    const markEmailed = vi.fn<WebhookDeps["markEmailed"]>(async () => {
      row.emailed = true;
    });
    const getParentEmail = vi.fn<WebhookDeps["getParentEmail"]>().mockResolvedValue(c.email);
    const buildPdf = vi.fn<WebhookDeps["buildPdf"]>().mockResolvedValue({
      bytes: new TextEncoder().encode("%PDF-synthetic"),
      fileName: "report-2026-10-12.pdf",
      band: "no_flag",
      sessionDate: "2026-10-12T16:30:00.000Z",
    });
    const send = vi.fn<(mail: ReportMail) => Promise<MailResult>>().mockResolvedValue(
      c.mailer === "permanent" ? { ok: false, permanent: true } : c.mailer === "transient" ? { ok: false, permanent: false } : { ok: true },
    );
    const verify = (payload: string, signature: string) => stripe.webhooks.constructEvent(payload, signature, SIGNING);
    const d: WebhookDeps = { verify, markPaid, markEmailed, getParentEmail, buildPdf, mailer: c.mailer === "none" ? null : { send } };
    return { d, row, markPaid, markEmailed, getParentEmail, buildPdf, send };
  }

  it.each(["checkout.session.completed", "checkout.session.async_payment_succeeded"])(
    "on %s marks the purchase paid, emails the PDF to the paying parent's own address, and records emailed_at",
    async (type) => {
      const { d, markPaid, send, markEmailed, getParentEmail, buildPdf } = deps();
      const res = await handleWebhook(signed(event({ type })), d);

      expect(res.status).toBe(200);
      expect(markPaid).toHaveBeenCalledWith({ checkoutId: CHECKOUT, parentId: PARENT, sessionId: SESSION, lang: "en" });
      expect(getParentEmail).toHaveBeenCalledWith(PARENT);
      expect(buildPdf).toHaveBeenCalledWith(PARENT, SESSION);
      expect(send).toHaveBeenCalledTimes(1);
      const mail = send.mock.calls[0]![0];
      expect(mail.to).toBe(PARENT_EMAIL);
      expect(mail.attachment.filename).toBe("report-2026-10-12.pdf");
      expect(Buffer.from(mail.attachment.content).subarray(0, 5).toString("latin1")).toBe("%PDF-");
      expect(mail.idempotencyKey).toBe(`report-email/${CHECKOUT}`);
      expect(markEmailed).toHaveBeenCalledWith(CHECKOUT);
    },
  );

  it("a replayed event marks nothing twice and sends no second email", async () => {
    const { d, send, markEmailed } = deps();
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect((await handleWebhook(signed(event({ type: "checkout.session.async_payment_succeeded" })), d)).status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    expect(markEmailed).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for a completed checkout whose payment is still pending (delayed payment method)", async () => {
    const { d, markPaid, send } = deps();
    const res = await handleWebhook(signed(event({ payment_status: "unpaid" })), d);
    expect(res.status).toBe(200);
    expect(markPaid).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("ignores a checkout that is not a one-off payment", async () => {
    const { d, markPaid } = deps();
    expect((await handleWebhook(signed(event({ mode: "subscription" })), d)).status).toBe(200);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("ignores a checkout with missing or malformed metadata, logging a code only", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, markPaid } = deps();
    expect((await handleWebhook(signed(event({ metadata: { parent_id: PARENT } })), d)).status).toBe(200);
    expect((await handleWebhook(signed(event({ metadata: { parent_id: "x", session_id: SESSION } })), d)).status).toBe(200);
    expect(markPaid).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[stripe] webhook", { outcome: "bad_metadata" });
  });

  it("records paid and logs a code, never the address, when email is not configured; the parent can still download", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, row, markEmailed, getParentEmail } = deps({ mailer: "none" });
    const res = await handleWebhook(signed(event()), d);
    expect(res.status).toBe(200);
    expect(row.status).toBe("paid");
    expect(markEmailed).not.toHaveBeenCalled();
    expect(getParentEmail).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[stripe] webhook", { outcome: "email_not_configured" });
    expect(JSON.stringify(warn.mock.calls)).not.toContain("@");
  });

  it("does not retry forever on a permanent email refusal (for example the resend.dev test sender): 200, code logged", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, row, markEmailed } = deps({ mailer: "permanent" });
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect(row.status).toBe("paid");
    expect(markEmailed).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[stripe] webhook", { outcome: "email_rejected" });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(PARENT_EMAIL);
  });

  it("answers 500 on a temporary email failure so Stripe retries, and the retry sends once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, send, markEmailed } = deps({ mailer: "transient" });
    expect((await handleWebhook(signed(event()), d)).status).toBe(500);
    expect(markEmailed).not.toHaveBeenCalled();
    send.mockResolvedValue({ ok: true });
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect(markEmailed).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("logs a code and sends nothing when the parent has no email on record", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, send } = deps({ email: null });
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[stripe] webhook", { outcome: "no_parent_email" });
  });

  it("logs a code and sends nothing when the database does not match the purchase to the parent's session", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, send, markPaid } = deps();
    markPaid.mockResolvedValue({ outcome: "unknown_session", emailed: false });
    expect((await handleWebhook(signed(event()), d)).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[stripe] webhook", { outcome: "unknown_session" });
  });

  it("rejects a wrong signature with 400 and records nothing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, markPaid, send } = deps();
    const res = await handleWebhook(signed(event(), "another-signing-value"), d);
    expect(res.status).toBe(400);
    expect(markPaid).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects an unsigned event with 400", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { d, markPaid } = deps();
    const res = await handleWebhook(post("/api/stripe/webhook", event()), d);
    expect(res.status).toBe(400);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("acknowledges other event types without recording them", async () => {
    const { d, markPaid } = deps();
    expect((await handleWebhook(signed(event({ type: "invoice.paid" })), d)).status).toBe(200);
    expect(markPaid).not.toHaveBeenCalled();
  });

  it("answers 500 when recording fails, so Stripe retries, and sends nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, markPaid, send } = deps();
    markPaid.mockRejectedValue(new Error("db down"));
    expect((await handleWebhook(signed(event()), d)).status).toBe(500);
    expect(send).not.toHaveBeenCalled();
  });

  it("writes a short, kind email with no result data in the subject, the headline and disclaimer in the body, and the PDF attached", async () => {
    const { d, send } = deps();
    await handleWebhook(signed(event()), d);
    const mail = send.mock.calls[0]![0];
    expect(mail.subject).not.toMatch(/follow-up|assessment|recommended|no specific|not enough|ADHD/i);
    expect(mail.text).toContain("No specific follow-up indicated by this activity");
    expect(mail.text).toContain("Not a diagnosis");
  });
});
