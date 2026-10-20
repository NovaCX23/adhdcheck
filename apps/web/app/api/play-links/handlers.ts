import { hashPlayCode, isPlayCode, newPlayCode, PLAY_LINK_LIFETIME_MS } from "../../../lib/play-link";
import { isUuid } from "../../../lib/uuid";

// Play links (FR-01, FR-32): the parent creates one for a child, the QR page (Person 4) turns the code
// into /play/<code>, and the play page (Person 1) looks the code up to get the child_id.
// Only the code hash reaches the store. Errors are logged by code only: no ids, no code.

// FR-70: the parent's camera and microphone choices, made before play; both off unless switched on.
export type Consent = { camera: boolean; microphone: boolean };

export interface PlayLinkStore {
  // false when the child is not this parent's (or does not exist).
  issue(input: { parentId: string; childId: string; codeHash: string; expiresAt: Date; consent: Consent }): Promise<boolean>;
  // The child and the choices of a link that exists, has not expired and has not been used; otherwise null.
  resolve(codeHash: string): Promise<{ childId: string; consent: Consent } | null>;
}

const BODY_FIELDS = new Set(["child_id", "camera", "microphone"]);

type CreateDeps = { store: PlayLinkStore; getParentId(): Promise<string | null>; now?: () => Date };

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

// POST /api/play-links, body { child_id, camera?, microphone? } (the two choices are booleans, false when
// left out), sent as application/json by the logged-in parent's page (a cross-site HTML form cannot set
// that header). Answers 201 { code, expires_at }.
export async function handleCreatePlayLink(request: Request, deps: CreateDeps): Promise<Response> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return fail(415, "json_required");

  const parentId = await deps.getParentId();
  if (!parentId) return fail(401, "not_logged_in");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_input");
  }
  const fields = body !== null && typeof body === "object" ? Object.keys(body) : [];
  const { child_id: childId, camera = false, microphone = false } = (body ?? {}) as Record<string, unknown>;
  if (fields.some((f) => !BODY_FIELDS.has(f)) || !isUuid(childId)) return fail(400, "invalid_input");
  if (typeof camera !== "boolean" || typeof microphone !== "boolean") return fail(400, "invalid_input");

  const { code, codeHash } = newPlayCode();
  const expiresAt = new Date((deps.now ?? (() => new Date()))().getTime() + PLAY_LINK_LIFETIME_MS);

  try {
    const issued = await deps.store.issue({ parentId, childId, codeHash, expiresAt, consent: { camera, microphone } });
    if (!issued) return fail(404, "unknown_child");
  } catch {
    console.error("[play-links] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
  return Response.json(
    { code, expires_at: expiresAt.toISOString() },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}

// GET /api/play-links/<code>, from the child's device: no login. Unknown, expired and used links all
// get the same 404, for the play page to show its neutral "ask your parent" screen.
export async function handleResolvePlayLink(code: string, deps: { store: PlayLinkStore }): Promise<Response> {
  if (!isPlayCode(code)) return fail(404, "invalid_play_link");
  try {
    const link = await deps.store.resolve(hashPlayCode(code));
    if (!link) return fail(404, "invalid_play_link");
    return Response.json({ child_id: link.childId, consent: link.consent }, { headers: { "cache-control": "no-store" } });
  } catch {
    console.error("[play-links] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
}
