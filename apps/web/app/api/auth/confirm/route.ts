// Email confirmation link (FR-30). Logic and tests in ../handlers.ts.
import { createClient } from "@/lib/supabase/server";
import { handleConfirm } from "../handlers";

export async function GET(request: Request) {
  const supabase = await createClient();
  return handleConfirm(request, { auth: supabase.auth });
}