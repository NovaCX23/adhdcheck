import { ScoreResultSchema, type ScoreResult, type SessionMetrics } from "@adhdcheck/contracts";

// Browser helpers around the backend routes, so the play page (Person 1) and the QR page (Person 4)
// do not hand-write requests. All take an optional fetch for tests.
//
// Play page flow (FR-01, FR-11): code = the [code] segment of /play/<code>;
//   resolvePlayLink(code) -> null: show the neutral "ask your parent" screen and record nothing;
//   otherwise play with child_id, then uploadSession(code, metrics).
// The child never sees the returned score (FR-15): it is for the parent screen only.

type Fetch = typeof fetch;
type Options = { fetchImpl?: Fetch };

export type UploadResult =
  | { status: "saved"; score: ScoreResult }
  | { status: "refused"; error: string }
  | { status: "failed" };

async function errorCode(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : `http_${res.status}`;
  } catch {
    return `http_${res.status}`;
  }
}

export async function resolvePlayLink(code: string, { fetchImpl = fetch }: Options = {}): Promise<{ child_id: string } | null> {
  const res = await fetchImpl(`/api/play-links/${encodeURIComponent(code)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const body = (await res.json()) as { child_id?: unknown };
  return typeof body.child_id === "string" ? { child_id: body.child_id } : null;
}

// FR-12: retries the exact same body after a network error, 429 or 5xx, waiting longer each time.
// The server stores a session_id once and answers a repeat with the same result, so a retry never
// creates a second session. A refused link (401) or an invalid session (400) is not retried.
export async function uploadSession(
  code: string,
  metrics: SessionMetrics,
  { fetchImpl = fetch, attempts = 5, wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) }: Options & {
    attempts?: number;
    wait?: (ms: number) => Promise<void>;
  } = {},
): Promise<UploadResult> {
  const body = JSON.stringify(metrics);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchImpl("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${code}` },
        body,
      });
      if (res.ok) return { status: "saved", score: ScoreResultSchema.parse(await res.json()) };
      if (res.status !== 429 && res.status < 500) return { status: "refused", error: await errorCode(res) };
    } catch {
      // Network error: retry below.
    }
    if (attempt < attempts) await wait(1000 * 2 ** (attempt - 1));
  }
  return { status: "failed" };
}

// FR-32: for the parent's "start a session" page. Builds the URL the QR code encodes.
export async function createPlayLink(
  childId: string,
  { fetchImpl = fetch, origin = window.location.origin }: Options & { origin?: string } = {},
): Promise<{ code: string; expires_at: string; url: string }> {
  const res = await fetchImpl("/api/play-links", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ child_id: childId }),
  });
  if (!res.ok) throw new Error(`create play link failed: ${await errorCode(res)}`);
  const { code, expires_at } = (await res.json()) as { code: string; expires_at: string };
  return { code, expires_at, url: `${origin}/play/${code}` };
}
