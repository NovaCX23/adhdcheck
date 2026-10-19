// Parent log-out (FR-30). Logic and tests in ../handlers.ts.
import { createClient } from "@/lib/supabase/server";
import { handleLogout } from "../handlers";

export async function POST(request: Request) {
  const supabase = await createClient();
  return handleLogout(request, { auth: supabase.auth });
}