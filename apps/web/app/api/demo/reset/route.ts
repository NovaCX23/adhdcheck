// Reset demo (FR-55, FR-56). Logic and tests in ../handlers.ts.
import { createAdminClient } from "@/lib/supabase/admin";
import { handleDemoReset } from "../handlers";
import { currentUser } from "../user";

export async function POST(request: Request) {
  return handleDemoReset(request, {
    getUser: currentUser,
    demoEmail: process.env.DEMO_PARENT_EMAIL,
    seed: async (parentId) => {
      const { data, error } = await createAdminClient().rpc("seed_demo", { p_parent_id: parentId });
      if (error) throw new Error(`seed_demo failed: ${error.message}`);
      return data as number;
    },
  });
}
