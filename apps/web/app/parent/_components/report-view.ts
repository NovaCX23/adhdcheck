import type { ReportPurchase } from "../../../lib/data/parent";

// What the report block shows (D-05b): the offer, a short wait right after checkout while the webhook
// records the payment, or the paid state. Only the server decides who gets the file (GET /api/reports/<id>).
export type ReportView = "offer" | "confirming" | "paid" | "paid_emailed";

export function reportView(purchase: Pick<ReportPurchase, "status" | "emailed_at"> | null, returningFromCheckout: boolean): ReportView {
  if (purchase?.status === "paid") return purchase.emailed_at ? "paid_emailed" : "paid";
  return returningFromCheckout ? "confirming" : "offer";
}
