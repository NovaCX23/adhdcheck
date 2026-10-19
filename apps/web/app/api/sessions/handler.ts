import { ScoreResultSchema, SessionMetricsSchema } from "@adhdcheck/contracts";
import { scoreSession } from "@adhdcheck/scoring";
import { UnknownChildError, type SessionStore } from "./store";

// POST /api/sessions (FR-11): validate SessionMetrics v1, score it, save session, trials and score,
// return the ScoreResult. A short session is saved and scored like any other; the scorer gives it
// band insufficient_data (FR-20, decided: no 4xx). Scoring is deterministic, so a repeated
// session_id is stored once and answered with the same result (FR-12).
// Errors are logged by code only: no session content, no ids (NFR-02).

type ErrorCode = "invalid_json" | "invalid_session" | "unknown_child" | "scoring_failed" | "storage_unavailable";

function fail(status: number, error: ErrorCode, extra?: object) {
  return Response.json({ error, ...extra }, { status });
}

export async function handleSessionPost(request: Request, deps: { store: SessionStore }): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn("[sessions] rejected", { error: "invalid_json" });
    return fail(400, "invalid_json");
  }

  const parsed = SessionMetricsSchema.safeParse(body);
  if (!parsed.success) {
    // Field paths and issue codes only: the values could hold anything the client sent.
    const issues = parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code }));
    console.warn("[sessions] rejected", { error: "invalid_session", issues: issues.length });
    return fail(400, "invalid_session", { issues });
  }
  const session = parsed.data;

  let score;
  try {
    // Re-check the scorer output so no field outside the contract is ever saved.
    score = ScoreResultSchema.parse(scoreSession(session));
  } catch {
    console.error("[sessions] failed", { error: "scoring_failed" });
    return fail(500, "scoring_failed");
  }

  try {
    const { created } = await deps.store.save(session, score);
    return Response.json(score, { status: created ? 201 : 200 });
  } catch (err) {
    if (err instanceof UnknownChildError) {
      console.warn("[sessions] rejected", { error: "unknown_child" });
      return fail(422, "unknown_child");
    }
    console.error("[sessions] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
}
