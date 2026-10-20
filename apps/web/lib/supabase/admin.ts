import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server code only (NFR-12); the `server-only` import makes the
// build fail if a Client Component imports this file. Use it for writes no parent may do directly,
// such as save_session from POST /api/sessions.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // check-secrets: allow
  if (!url || !key) throw new Error("Supabase admin client: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set"); // check-secrets: allow

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, // check-secrets: allow
  });
}
