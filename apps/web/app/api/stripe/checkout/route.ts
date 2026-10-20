// Start a Stripe Checkout subscription (FR-45). Logic and tests in ../handlers.ts.
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateCustomer } from "../billing";
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
    getOrCreateCustomer: (parentId) => getOrCreateCustomer(admin, stripe, parentId),
    createCheckoutSession: ({ customer, priceId, parentId, successUrl, cancelUrl }) =>
      stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: parentId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
  });
}
