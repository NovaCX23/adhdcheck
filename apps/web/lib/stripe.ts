import "server-only";
import Stripe from "stripe";

// Stripe client for server code only (test mode for the demo). The key lives in STRIPE_SECRET_KEY
// (.env.local and Vercel), never in the browser. Throws when it is not set; routes answer 503.
export function createStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY; // check-secrets: allow
  if (!key) throw new Error("Stripe: STRIPE_SECRET_KEY is not set"); // check-secrets: allow
  return new Stripe(key);
}
