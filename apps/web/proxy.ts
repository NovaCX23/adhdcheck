import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 proxy (formerly middleware): keeps the parent's Supabase session fresh.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, and /api/sessions, which the child's device calls without a parent session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/sessions|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
