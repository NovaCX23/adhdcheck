// Parent sign-up (FR-30). Logic and tests in ../handlers.ts.
import { createClient } from "@/lib/supabase/server";
import { handleSignUp } from "../handlers";

export async function POST(request: Request) {
  const supabase = await createClient();
  return handleSignUp(request, { auth: supabase.auth });
}