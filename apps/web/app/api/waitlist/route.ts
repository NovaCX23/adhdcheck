// Early-access sign-ups from the landing page. Logic and tests live in handler.ts.
import { createResendSender } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRateLimiter, SESSIONS_RATE_LIMIT } from "@/lib/rate-limit";
import { handleWaitlistPost } from "./handler";

export async function POST(request: Request) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    // No Supabase settings (a teammate running the app with no .env.local): store nothing.
    console.error("[waitlist] failed", { error: "storage_unavailable" });
    return Response.json({ ok: false }, { status: 503 });
  }
  return handleWaitlistPost(request, {
    store: {
      async add(email, lang) {
        const { error } = await admin.rpc("join_waitlist", { p_email: email, p_lang: lang });
        if (error) throw new Error(`join_waitlist failed: ${error.message}`);
      },
    },
    // Same placeholder limit as session posts (TODO in docs/02 NFR-13).
    rateLimiter: createSupabaseRateLimiter(admin, SESSIONS_RATE_LIMIT),
    email: createResendSender(),
  });
}
