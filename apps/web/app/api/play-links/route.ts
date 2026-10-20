// Parent creates a play link for one child (FR-01, FR-32). Logic and tests in handlers.ts.
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { handleCreatePlayLink } from "./handlers";
import { createSupabasePlayLinkStore } from "./supabase-store";

export async function POST(request: Request) {
  const supabase = await createClient();
  return handleCreatePlayLink(request, {
    store: createSupabasePlayLinkStore(createAdminClient()),
    // getClaims() verifies the session JWT; the parent id is never taken from the body.
    getParentId: async () => (await supabase.auth.getClaims()).data?.claims.sub ?? null,
  });
}
