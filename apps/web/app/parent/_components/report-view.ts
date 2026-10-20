import type { ReportPurchase } from "../../../lib/data/parent";

// What the report block shows (D-05b): the offer, a short wait right after checkout while the webhook
// records the payment, payment in progress (a Checkout was opened and not paid yet), the paid state, or
// nothing for a session with too little data (R3-P2: there is no result to report, so no offer).
// Only the server decides who gets the file (GET /api/reports/<id>).
export type ReportView = "offer" | "confirming" | "in_progress" | "paid" | "paid_emailed" | "none";

export function reportView(
  purchase: Pick<ReportPurchase, "status" | "emailed_at"> | null,
  returningFromCheckout: boolean,
  band: string,
): ReportView {
  if (purchase?.status === "paid") return purchase.emailed_at ? "paid_emailed" : "paid";
  if (band === "insufficient_data") return "none";
  if (returningFromCheckout) return "confirming";
  return purchase?.status === "pending" ? "in_progress" : "offer";
}
