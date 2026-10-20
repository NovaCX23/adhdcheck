// Start a Stripe Checkout one-off payment for one report (FR-45, D-05b). Logic and tests in ../handlers.ts.
import { getReportPurchase, getSessionResult } from "@/lib/data/parent";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { startPurchase } from "../billing";
import { handleCheckout } from "../handlers";

export async function POST(request: Request) {
  let stripe, admin;
  try {
    stripe = createStripeClient();
    admin = createAdminClient();
  } catch {
    console.error("[stripe] checkout failed", { error: "billing_not_configured" });
    return Response.json({ error: "billing_not_configured" }, { status: 503 });
  }
  const supabase = await createClient();
  return handleCheckout(request, {
    getParentId: async () => (await supabase.auth.getClaims()).data?.claims.sub ?? null,
    priceId: process.env.STRIPE_PRICE_ID,
    // The parent's own client: RLS returns nothing for another parent's session or purchase.
    getOwnSession: async (sessionId) => {
      const result = await getSessionResult(supabase, sessionId);
      return result ? { childId: result.child_id, scored: result.score !== null } : null;
    },
    isPaid: async (sessionId) => (await getReportPurchase(supabase, sessionId))?.status === "paid",
    createCheckoutSession: ({ priceId, parentId, sessionId, lang, successUrl, cancelUrl }) =>
      stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: parentId,
        metadata: { parent_id: parentId, session_id: sessionId, lang },
        payment_intent_data: { metadata: { parent_id: parentId, session_id: sessionId } },
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    startPurchase: (input) => startPurchase(admin, input),
  });
}
