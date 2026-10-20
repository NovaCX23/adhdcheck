// FR-50 "new mission" email. Logic and tests in ../handlers.ts.
import { createResendSender } from "@/lib/email/resend";
import { handleMissionEmail } from "../handlers";
import { getParent } from "../parent";

export async function POST(request: Request) {
  const { supabase, parent } = await getParent();
  return handleMissionEmail(request, {
    email: createResendSender(),
    getParent: async () => parent,
    // RLS: the parent's own client only sees their own missions.
    missionIsOwn: async (id) => {
      const { data, error } = await supabase.from("missions").select("id").eq("id", id).maybeSingle();
      return !error && !!data;
    },
  });
}
