import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Database side of billing, with the service-role client (parents.stripe_customer_id, subscriptions).

export async function getCustomer(admin: SupabaseClient, parentId: string): Promise<string | null> {
  const { data, error } = await admin.from("parents").select("stripe_customer_id").eq("id", parentId).maybeSingle();
  if (error) throw new Error(`read customer failed: ${error.message}`);
  return data?.stripe_customer_id ?? null;
}

// One Stripe customer per parent: the idempotency key makes Stripe return the same customer for repeated
// calls, and set_stripe_customer keeps the first id stored. No email or name is sent; Checkout asks for it.
export async function getOrCreateCustomer(admin: SupabaseClient, stripe: Stripe, parentId: string): Promise<string> {
  const existing = await getCustomer(admin, parentId);
  if (existing) return existing;
  const customer = await stripe.customers.create({ metadata: { parent_id: parentId } }, { idempotencyKey: `customer-${parentId}` });
  const { data, error } = await admin.rpc("set_stripe_customer", { p_parent_id: parentId, p_customer_id: customer.id });
  if (error || typeof data !== "string") throw new Error(`store customer failed: ${error?.message ?? "no parent row"}`);
  return data;
}

export async function getSubscriptionStatus(admin: SupabaseClient, parentId: string): Promise<string | null> {
  const { data, error } = await admin.from("subscriptions").select("status").eq("parent_id", parentId).maybeSingle();
  if (error) throw new Error(`read subscription failed: ${error.message}`);
  return data?.status ?? null;
}

export async function recordSubscription(
  admin: SupabaseClient,
  update: { customerId: string; subscriptionId: string; status: string; eventCreated: Date },
): Promise<string> {
  const { data, error } = await admin.rpc("record_subscription", {
    p_customer_id: update.customerId,
    p_subscription_id: update.subscriptionId,
    p_status: update.status,
    p_event_created: update.eventCreated.toISOString(),
  });
  if (error) throw new Error(`record subscription failed: ${error.message}`);
  return data as string;
}
