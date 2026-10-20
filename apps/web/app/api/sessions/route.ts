// Game sessions from the child's device. Logic and tests live in handler.ts.
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRateLimiter, SESSIONS_RATE_LIMIT } from "@/lib/rate-limit";
import { handleSessionPost } from "./handler";
import { createSupabaseSessionStore } from "./supabase-store";

export async function POST(request: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // No Supabase settings (a teammate running the app with no .env.local): store nothing.
    console.error("[sessions] failed", { error: "storage_unavailable" });
    return Response.json({ error: "storage_unavailable" }, { status: 503 });
  }
  return handleSessionPost(request, {
    store: createSupabaseSessionStore(admin),
    rateLimiter: createSupabaseRateLimiter(admin, SESSIONS_RATE_LIMIT),
  });
}
