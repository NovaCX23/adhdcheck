// Stripe webhook (FR-47, D-05b). Logic and tests in ../handlers.ts. The raw body is read with
// request.text() inside handleWebhook, before any parsing, as Stripe signature verification requires.
import { Resend } from "resend";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPdfFor, getParentEmail, markEmailed, markPaid, resendMailer } from "../billing";
import { handleWebhook } from "../handlers";

export async function POST(request: Request) {
  const signingValue = process.env.STRIPE_WEBHOOK_SECRET; // check-secrets: allow
  let stripe, admin;
  try {
    if (!signingValue) throw new Error("STRIPE_WEBHOOK_SECRET is not set"); // check-secrets: allow
    stripe = createStripeClient();
    admin = createAdminClient();
  } catch {
    console.error("[stripe] webhook failed", { error: "billing_not_configured" });
    return Response.json({ error: "billing_not_configured" }, { status: 503 });
  }
  // Email is optional: without RESEND_API_KEY or REPORT_FROM_EMAIL the purchase is still recorded and the
  // parent downloads the report from the parent page.
  const mailKey = process.env.RESEND_API_KEY; // check-secrets: allow
  const from = process.env.REPORT_FROM_EMAIL;
  const mailer = mailKey && from ? resendMailer(new Resend(mailKey), from) : null;
  return handleWebhook(request, {
    verify: (payload, signature) => stripe.webhooks.constructEvent(payload, signature, signingValue),
    markPaid: (input) => markPaid(admin, input),
    markEmailed: (checkoutId) => markEmailed(admin, checkoutId),
    getParentEmail: (parentId) => getParentEmail(admin, parentId),
    buildPdf: (parentId, sessionId) => buildPdfFor(admin, parentId, sessionId),
    mailer,
  });
}
