// Demo account (FR-55, FR-56). The demo account is the one whose email is DEMO_PARENT_EMAIL (server env).
// GET /api/demo tells the page whether to show the Reset demo button; POST /api/demo/reset replaces the
// account's data with the synthetic seed (seed_demo, supabase/migrations). Any other account gets 403.

type User = { id: string; email?: string | null };
type Deps = { getUser(): Promise<User | null>; demoEmail?: string; seed(parentId: string): Promise<number> };

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

function isDemo(user: User | null, demoEmail: string | undefined): user is User {
  return !!user?.email && !!demoEmail && user.email.toLowerCase() === demoEmail.trim().toLowerCase();
}

export async function handleDemoStatus(deps: Pick<Deps, "getUser" | "demoEmail">): Promise<Response> {
  const user = await deps.getUser();
  return Response.json({ is_demo: isDemo(user, deps.demoEmail) }, { headers: { "cache-control": "no-store" } });
}

// Sent as application/json by the page: a cross-site HTML form cannot set that header.
export async function handleDemoReset(request: Request, deps: Deps): Promise<Response> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return fail(415, "json_required");

  const user = await deps.getUser();
  if (!user) return fail(401, "not_logged_in");
  if (!isDemo(user, deps.demoEmail)) return fail(403, "not_demo_account");

  try {
    const sessions = await deps.seed(user.id);
    return Response.json({ sessions }, { headers: { "cache-control": "no-store" } });
  } catch {
    console.error("[demo] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
}
