// Stripe webhook (FR-47). Logic and tests in ../handlers.ts.
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSubscription } from "../billing";
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
  return handleWebhook(request, {
    verify: (payload, signature) => stripe.webhooks.constructEvent(payload, signature, signingValue),
    record: (update) => recordSubscription(admin, update),
  });
}
