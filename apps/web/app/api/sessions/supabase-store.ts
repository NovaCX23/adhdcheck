import type { SupabaseClient } from "@supabase/supabase-js";
import { InvalidPlayLinkError, type SessionStore } from "./store";

// SessionStore backed by the save_session SQL function (supabase/migrations), which checks and uses up
// the play link, then writes session, trials and score in one transaction with the link's parent_id.
// Pass the service-role client (lib/supabase/admin.ts): the function is not callable by parents.
export function createSupabaseSessionStore(client: SupabaseClient): SessionStore {
  return {
    async save(codeHash, session, score) {
      const { data, error } = await client.rpc("save_session", {
        p_code_hash: codeHash,
        p_session: session,
        p_score: score,
      });
      if (error) throw new Error(`save_session failed: ${error.message}`);
      switch (data) {
        case "created":
          return { created: true };
        case "duplicate":
          return { created: false };
        case "invalid_play_link":
          throw new InvalidPlayLinkError();
        default:
          throw new Error("save_session returned an unknown answer");
      }
    },
  };
}
