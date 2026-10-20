// A Stripe subscription status that unlocks the report download (D-05, DECIDED, Hatem, 2026-10-20).
// Everything else, or no subscription at all, does not. Nothing else in the app is gated (FR-48).
export function isPaidStatus(status: string | null): boolean {
  return status === "active" || status === "trialing";
}
