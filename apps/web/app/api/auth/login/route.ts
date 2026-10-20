// Parent log-in (FR-30). Logic and tests in ../handlers.ts.
import { createClient } from "@/lib/supabase/server";
import { handleLogin } from "../handlers";

export async function POST(request: Request) {
  const supabase = await createClient();
  return handleLogin(request, { auth: supabase.auth });
}