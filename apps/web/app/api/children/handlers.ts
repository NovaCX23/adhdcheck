import { isUuid } from "../../../lib/uuid";

// DELETE /api/children/<id> (FR-41): the parent deletes one child profile. The database deletes its
// sessions, trials, scores and play links with it (on delete cascade, tested in supabase/tests).
// deleteChild runs as the logged-in parent, so RLS lets a parent delete only their own child.
// No JSON check needed: a cross-site page can send DELETE only through fetch, which CORS stops.
// Errors are logged by code only: no ids.

type Deps = { getParentId(): Promise<string | null>; deleteChild(childId: string): Promise<boolean> };

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function handleDeleteChild(childId: string, deps: Deps): Promise<Response> {
  if (!(await deps.getParentId())) return fail(401, "not_logged_in");
  if (!isUuid(childId)) return fail(404, "unknown_child");

  try {
    if (!(await deps.deleteChild(childId))) return fail(404, "unknown_child");
  } catch {
    console.error("[children] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
  return new Response(null, { status: 204 });
}
