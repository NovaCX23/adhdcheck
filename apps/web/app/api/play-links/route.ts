// Parent creates a play link for one child (FR-01, FR-32). Logic and tests in handlers.ts.
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { handleCreatePlayLink } from "./handlers";
import { createSupabasePlayLinkStore } from "./supabase-store";

export async function POST(request: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // No Supabase settings: store nothing, as /api/sessions does.
    console.error("[play-links] failed", { error: "storage_unavailable" });
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  const supabase = await createClient();
  return handleCreatePlayLink(request, {
    store: createSupabasePlayLinkStore(admin),
    // getClaims() verifies the session JWT; the parent id is never taken from the body.
    getParentId: async () => (await supabase.auth.getClaims()).data?.claims.sub ?? null,
  });
}
