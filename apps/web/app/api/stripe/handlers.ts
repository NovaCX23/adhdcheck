import type Stripe from "stripe";

// Stripe test mode (FR-45 to FR-47; research/03 section 6). Stripe calls and the database are injected, so
// these run in tests without network. Product and price are decision D-05: the price comes from
// STRIPE_PRICE_ID, created in the Stripe test dashboard. Nothing here gates the result card, next step or
// deletion (FR-48). Errors are logged by code only.

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

function isJson(request: Request) {
  return (request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

type CheckoutDeps = {
  getParentId(): Promise<string | null>;
  priceId: string | undefined;
  getOrCreateCustomer(parentId: string): Promise<string>;
  createCheckoutSession(input: {
    customer: string;
    priceId: string;
    parentId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string | null }>;
};

// POST /api/stripe/checkout (JSON, logged-in parent) -> { url } of a Checkout page, mode subscription.
// Success returns to /dashboard?paid=1 (docs/02 FR-45).
export async function handleCheckout(request: Request, deps: CheckoutDeps): Promise<Response> {
  if (!isJson(request)) return fail(415, "json_required");
  const parentId = await deps.getParentId();
  if (!parentId) return fail(401, "not_logged_in");
  if (!deps.priceId) {
    console.error("[stripe] checkout failed", { error: "billing_not_configured" });
    return fail(503, "billing_not_configured");
  }

  const origin = new URL(request.url).origin;
  try {
    const customer = await deps.getOrCreateCustomer(parentId);
    const session = await deps.createCheckoutSession({
      customer,
      priceId: deps.priceId,
      parentId,
      successUrl: `${origin}/dashboard?paid=1`,
      cancelUrl: `${origin}/dashboard`,
    });
    if (!session.url) throw new Error("checkout session without url");
    return Response.json({ url: session.url });
  } catch {
    console.error("[stripe] checkout failed", { error: "billing_unavailable" });
    return fail(502, "billing_unavailable");
  }
}

type PortalDeps = {
  getParentId(): Promise<string | null>;
  getCustomer(parentId: string): Promise<string | null>;
  createPortalSession(input: { customer: string; returnUrl: string }): Promise<{ url: string }>;
};

// POST /api/stripe/portal (JSON, logged-in parent) -> { url } of the Customer Portal (FR-46).
export async function handlePortal(request: Request, deps: PortalDeps): Promise<Response> {
  if (!isJson(request)) return fail(415, "json_required");
  const parentId = await deps.getParentId();
  if (!parentId) return fail(401, "not_logged_in");

  try {
    const customer = await deps.getCustomer(parentId);
    if (!customer) return fail(404, "no_subscription");
    const session = await deps.createPortalSession({ customer, returnUrl: `${new URL(request.url).origin}/dashboard` });
    return Response.json({ url: session.url });
  } catch {
    console.error("[stripe] portal failed", { error: "billing_unavailable" });
    return fail(502, "billing_unavailable");
  }
}

export type SubscriptionUpdate = { customerId: string; subscriptionId: string; status: string; eventCreated: Date };

type WebhookDeps = {
  // Stripe signature check (stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET); throws when invalid.
  verify(payload: string, signature: string): Stripe.Event;
  record(update: SubscriptionUpdate): Promise<string>;
};

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

// POST /api/stripe/webhook (FR-47): verifies the signature on the raw body, then records the status of
// subscription events. A 500 makes Stripe retry; events older than the stored one are ignored in SQL.
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

  if (!SUBSCRIPTION_EVENTS.has(event.type)) return Response.json({ received: true });

  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  try {
    const outcome = await deps.record({
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      eventCreated: new Date(event.created * 1000),
    });
    if (outcome === "unknown_customer") console.warn("[stripe] webhook", { outcome });
    return Response.json({ received: true });
  } catch {
    console.error("[stripe] webhook failed", { error: "storage_unavailable" });
    return fail(500, "storage_unavailable");
  }
}
