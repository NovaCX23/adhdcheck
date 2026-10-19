import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// Rate limit (NFR-13), counted in Postgres (take_rate_limit, supabase/migrations) because Vercel
// functions share no memory. Fixed window per key; old windows are deleted by the same function.

// TODO: limit not decided (docs/02 NFR-13, "Limit value: TODO"). Placeholder: 10 posts per minute per
// address, far above one child finishing a session and well below a burst.
export const SESSIONS_RATE_LIMIT = { limit: 10, windowSeconds: 60 };

export interface RateLimiter {
  // true when the request may go on, false when the limit is reached.
  take(key: string): Promise<boolean>;
}

// Key for one client: scope plus a hash of its address. The address itself is never stored.
// On Vercel the first x-forwarded-for entry is the client address set by the platform.
export function clientKey(request: Request, scope: string): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${createHash("sha256").update(address).digest("hex")}`;
}

// Pass the service-role client (lib/supabase/admin.ts): take_rate_limit is not callable by parents.
export function createSupabaseRateLimiter(
  client: SupabaseClient,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): RateLimiter {
  return {
    async take(key) {
      const { data, error } = await client.rpc("take_rate_limit", {
        p_bucket: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });
      if (error) throw new Error(`take_rate_limit failed: ${error.message}`);
      return data === true;
    },
  };
}
