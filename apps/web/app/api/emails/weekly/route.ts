// FR-50 weekly summary email, on request. Logic and tests in ../handlers.ts.
import { createResendSender } from "@/lib/email/resend";
import { handleWeeklySummaryEmail } from "../handlers";
import { getParent } from "../parent";

export async function POST(request: Request) {
  const { parent } = await getParent();
  return handleWeeklySummaryEmail(request, { email: createResendSender(), getParent: async () => parent });
}
