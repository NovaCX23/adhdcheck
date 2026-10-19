// The child's device looks up its play link (FR-01). Logic and tests in ../handlers.ts.
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleResolvePlayLink } from "../handlers";
import { createSupabasePlayLinkStore } from "../supabase-store";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/play-links/[code]">) {
  const { code } = await ctx.params;
  return handleResolvePlayLink(code, { store: createSupabasePlayLinkStore(createAdminClient()) });
}
