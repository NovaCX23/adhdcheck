import type { SupabaseClient } from "@supabase/supabase-js";
import { UnknownChildError, type SessionStore } from "./store";

// SessionStore backed by the save_session SQL function (supabase/migrations), which writes session,
// trials and score in one transaction and copies parent_id from the child row.
// Pass the service-role client (lib/supabase/admin.ts): the function is not callable by parents.
export function createSupabaseSessionStore(client: SupabaseClient): SessionStore {
  return {
    async save(session, score) {
      const { data, error } = await client.rpc("save_session", { p_session: session, p_score: score });
      if (error) throw new Error(`save_session failed: ${error.message}`);
      switch (data) {
        case "created":
          return { created: true };
        case "duplicate":
          return { created: false };
        case "unknown_child":
          throw new UnknownChildError();
        default:
          throw new Error("save_session returned an unknown answer");
      }
    },
  };
}
