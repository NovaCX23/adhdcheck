import { createClient } from "@/lib/supabase/server";

// The logged-in parent for the FR-50 email routes: id and address from the verified session JWT
// (getClaims), never from the request body.
export async function getParent() {
  const supabase = await createClient();
  const claims = (await supabase.auth.getClaims()).data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : "";
  return { supabase, parent: claims?.sub && email ? { id: claims.sub, email } : null };
}
