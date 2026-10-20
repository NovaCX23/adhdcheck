import { createClient } from "@/lib/supabase/server";

// The logged-in parent from the verified session JWT (getClaims), or null.
export async function currentUser() {
  const supabase = await createClient();
  const claims = (await supabase.auth.getClaims()).data?.claims;
  return claims ? { id: claims.sub, email: claims.email ?? null } : null;
}
