// Parent deletes a child profile and all its data (FR-41). Logic and tests in ../handlers.ts.
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleDeleteChild } from "../handlers";

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/children/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  return handleDeleteChild(id, {
    getParentId: async () => (await supabase.auth.getClaims()).data?.claims.sub ?? null,
    deleteChild: async (childId) => {
      // RLS (children_delete_own) limits this to the parent's own child; select returns what was deleted.
      const { data, error } = await supabase.from("children").delete().eq("id", childId).select("id");
      if (error) throw new Error(`delete child failed: ${error.message}`);
      return data.length > 0;
    },
  });
}
