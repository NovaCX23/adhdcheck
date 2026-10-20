import type Stripe from "stripe";
import { z } from "zod";
import { buildReportEmail, type EmailLang, type ReportBand } from "../../../lib/report-email";
import { isUuid } from "../../../lib/uuid";

// Stripe test mode (FR-45, FR-47; D-05, D-05b DECIDED, Hatem, 2026-10-20). The detailed PDF report costs
// 9.99 EUR, paid once per report (Stripe Checkout, mode "payment"); the price comes from STRIPE_PRICE_ID.
// After payment the report is emailed to the parent who paid (Resend) and stays downloadable by that parent.
// Stripe, Resend and the database are injected, so these run in tests without network. Errors and outcomes
// are logged by code only, never with an email address.
//
// Sources: Stripe "Fulfill orders" (https://docs.stripe.com/checkout/fulfillment): handle
// checkout.session.completed and checkout.session.async_payment_succeeded, fulfil only when payment_status
// is not "unpaid", and make fulfilment safe to run several times, concurrently, for one Checkout Session.
// Stripe webhooks (https://docs.stripe.com/webhooks): verify the signature on the raw body; events can be
// delivered more than once. Resend Idempotency-Key (https://resend.com/docs/api-reference/emails/send-email):
// one key per email, kept 24 hours, so two concurrent deliveries of one event send a single email.

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

function isJson(request: Request) {
  return (request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

// The email language: Romanian when the browser's first language preference is Romanian, else English.
export function langFromRequest(request: Request): EmailLang {
  const first = (request.headers.get("accept-language") ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  return first === "ro" || first.startsWith("ro-") ? "ro" : "en";
}

const Uuid = z.string().refine(isUuid);
const CheckoutBody = z.strictObject({ sessionId: Uuid });

export type CheckoutDeps = {
  getParentId(): Promise<string | null>;
  priceId: string | undefined;
  // The session as the logged-in parent sees it (RLS): null for another parent's session.
  getOwnSession(sessionId: string): Promise<{ childId: string; scored: boolean } | null>;
  // Whether this parent already holds a paid purchase of this report.
  isPaid(sessionId: string): Promise<boolean>;
  createCheckoutSession(input: {
    priceId: string;
    parentId: string;
    sessionId: string;
    lang: EmailLang;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ id: string; url: string | null }>;
  startPurchase(input: { parentId: string; sessionId: string; checkoutId: string; lang: EmailLang }): Promise<string>;
};

// POST /api/stripe/checkout (JSON { sessionId }, logged-in parent) -> { url } of a Checkout page for one
// report. Success returns to the child page, which shows the paid state once the webhook has run.
export async function handleCheckout(request: Request, deps: CheckoutDeps): Promise<Response> {
  if (!isJson(request)) return fail(415, "json_required");
  const parentId = await deps.getParentId();
  if (!parentId) return fail(401, "not_logged_in");
  if (!deps.priceId) {
    console.error("[stripe] checkout failed", { error: "billing_not_configured" });
    return fail(503, "billing_not_configured");
  }
  const parsed = CheckoutBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_request");
  const { sessionId } = parsed.data;

  let own: { childId: string; scored: boolean } | null;
  try {
    own = await deps.getOwnSession(sessionId);
    if (!own) return fail(404, "unknown_session");
    if (!own.scored) return fail(404, "not_scored");
    if (await deps.isPaid(sessionId)) return fail(409, "already_paid");
  } catch {
    console.error("[stripe] checkout failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }

  const origin = new URL(request.url).origin;
  const lang = langFromRequest(request);
  try {
    const session = await deps.createCheckoutSession({
      priceId: deps.priceId,
      parentId,
      sessionId,
      lang,
      successUrl: `${origin}/parent/${own.childId}?report=paid`,
      cancelUrl: `${origin}/parent/${own.childId}`,
    });
    if (!session.url) throw new Error("checkout session without url");
    // The webhook also records the purchase from the metadata, so a lost insert here loses nothing.
    await deps.startPurchase({ parentId, sessionId, checkoutId: session.id, lang }).catch(() => {
      console.warn("[stripe] checkout", { outcome: "start_not_recorded" });
    });
    return Response.json({ url: session.url });
  } catch {
    console.error("[stripe] checkout failed", { error: "billing_unavailable" });
    return fail(502, "billing_unavailable");
  }
}

export type ReportMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachment: { filename: string; content: Uint8Array };
  idempotencyKey: string;
};
// permanent: the provider refused the message for good (for example a 403 because the sender domain is not
// verified), so a retry cannot help.
export type MailResult = { ok: true } | { ok: false; permanent: boolean };
export type Mailer = { send(mail: ReportMail): Promise<MailResult> };

export type PaidOutcome = { outcome: string; emailed: boolean };

export type WebhookDeps = {
  // Stripe signature check (stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET); throws when invalid.
  verify(payload: string, signature: string): Stripe.Event;
  markPaid(input: { checkoutId: string; parentId: string; sessionId: string; lang: EmailLang }): Promise<PaidOutcome>;
  markEmailed(checkoutId: string): Promise<void>;
  // The email of the parent who paid, from Supabase auth (never from the request or Stripe).
  getParentEmail(parentId: string): Promise<string | null>;
  // The report PDF of that parent's session, or null when it cannot be built (not scored, deleted).
  buildPdf(parentId: string, sessionId: string): Promise<{ bytes: Uint8Array; fileName: string; band: ReportBand; sessionDate: string } | null>;
  // null when RESEND_API_KEY or REPORT_FROM_EMAIL is not set: the purchase is still recorded.
  mailer: Mailer | null;
};

const PAID_EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);
const Metadata = z.object({ parent_id: Uuid, session_id: Uuid, lang: z.enum(["ro", "en"]).catch("en") });

function note(outcome: string) {
  console.warn("[stripe] webhook", { outcome });
  return Response.json({ received: true });
}

// POST /api/stripe/webhook (FR-47): verifies the signature on the raw body, marks the purchase paid once,
// then emails the report once. A 500 makes Stripe retry (database or temporary email failure); a permanent
// condition answers 200 with a logged code, so Stripe does not retry it for days.
export async function handleWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("missing signature");
    event = deps.verify(payload, signature);
  } catch {
    console.warn("[stripe] webhook rejected", { error: "invalid_signature" });
    return fail(400, "invalid_signature");
  }

  if (!PAID_EVENTS.has(event.type)) return Response.json({ received: true });
  const checkout = event.data.object as Stripe.Checkout.Session;
  if (checkout.mode !== "payment") return Response.json({ received: true });
  // A delayed payment method completes the checkout before the money arrives; async_payment_succeeded follows.
  if (checkout.payment_status === "unpaid") return Response.json({ received: true });
  const meta = Metadata.safeParse(checkout.metadata ?? {});
  if (!meta.success) return note("bad_metadata");
  const { parent_id: parentId, session_id: sessionId, lang } = meta.data;

  let paid: PaidOutcome;
  try {
    paid = await deps.markPaid({ checkoutId: checkout.id, parentId, sessionId, lang });
  } catch {
    console.error("[stripe] webhook failed", { error: "storage_unavailable" });
    return fail(500, "storage_unavailable");
  }
  if (paid.outcome !== "paid" && paid.outcome !== "already_paid") return note(paid.outcome);
  if (paid.emailed) return Response.json({ received: true });
  if (!deps.mailer) return note("email_not_configured");

  try {
    const to = await deps.getParentEmail(parentId);
    if (!to) return note("no_parent_email");
    const pdf = await deps.buildPdf(parentId, sessionId);
    if (!pdf) return note("report_unavailable");
    const content = buildReportEmail({ lang, band: pdf.band, sessionDate: pdf.sessionDate });
    const sent = await deps.mailer.send({
      to,
      ...content,
      attachment: { filename: pdf.fileName, content: pdf.bytes },
      idempotencyKey: `report-email/${checkout.id}`,
    });
    if (!sent.ok) {
      if (sent.permanent) return note("email_rejected");
      throw new Error("email temporarily unavailable");
    }
    await deps.markEmailed(checkout.id);
    return Response.json({ received: true });
  } catch {
    console.error("[stripe] webhook failed", { error: "email_unavailable" });
    return fail(500, "email_unavailable");
  }
}
