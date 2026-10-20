import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlayLinkStore } from "./handlers";

// PlayLinkStore backed by the issue_play_link and resolve_play_link SQL functions (supabase/migrations).
// Pass the service-role client (lib/supabase/admin.ts): play_links is closed to parents and to anon.
export function createSupabasePlayLinkStore(client: SupabaseClient): PlayLinkStore {
  return {
    async issue({ parentId, childId, codeHash, expiresAt }) {
      const { data, error } = await client.rpc("issue_play_link", {
        p_parent_id: parentId,
        p_child_id: childId,
        p_code_hash: codeHash,
        p_expires_at: expiresAt.toISOString(),
      });
      if (error) throw new Error(`issue_play_link failed: ${error.message}`);
      return data === true;
    },
    async resolve(codeHash) {
      const { data, error } = await client.rpc("resolve_play_link", { p_code_hash: codeHash });
      if (error) throw new Error(`resolve_play_link failed: ${error.message}`);
      return typeof data === "string" ? data : null;
    },
  };
}
