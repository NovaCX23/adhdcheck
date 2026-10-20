import { ScoreResultSchema, type ScoreResult } from "@adhdcheck/contracts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissionKey } from "../missions";

// Data for the parent pages (Person 4). Pass the logged-in parent's client (lib/supabase/server.ts in
// Server Components, lib/supabase/client.ts in Client Components): RLS returns only their own rows.
// Every score is checked against ScoreResult v1 before a page sees it. Errors throw; pages show their
// error state. Writes the parent may not do (sessions, scores) go through the API routes instead.

export type Child = { id: string; nickname: string; birth_year: number; created_at: string };

export type SessionResult = {
  session_id: string;
  child_id: string;
  started_at: string;
  duration_ms: number;
  // NFR-24: the chart shows the device per session; sessions on different devices are not comparable.
  device: { pointer_type: string; user_agent: string };
  // null until the session is scored.
  score: ScoreResult | null;
};

export type MissionRow = {
  id: string;
  child_id: string;
  mission_key: string;
  status: "todo" | "done";
  created_at: string;
  done_at: string | null;
};

const SESSION_COLUMNS =
  "id, child_id, started_at, duration_ms, device, scores (scoring_method, validated, indicators, flags, band, data_quality, reasons, recommendations, disclaimer)";
const MISSION_COLUMNS = "id, child_id, mission_key, status, created_at, done_at";

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what} failed: ${result.error.message}`);
  return result.data as T;
}

type SessionRow = {
  id: string;
  child_id: string;
  started_at: string;
  duration_ms: number;
  device: Record<string, unknown>;
  scores: unknown;
};

export function toSessionResult(row: SessionRow): SessionResult {
  const embedded = Array.isArray(row.scores) ? row.scores[0] : row.scores;
  const score = embedded
    ? ScoreResultSchema.parse({ schema_version: "1.0", session_id: row.id, ...(embedded as object) })
    : null;
  return {
    session_id: row.id,
    child_id: row.child_id,
    started_at: row.started_at,
    duration_ms: row.duration_ms,
    device: { pointer_type: String(row.device.pointer_type ?? ""), user_agent: String(row.device.user_agent ?? "") },
    score,
  };
}

// Intended purpose: children aged 6 to 12 (docs/02 section 2). The add-child form uses the same bounds.
export const MIN_AGE = 6;
export const MAX_AGE = 12;

// FR-31: nickname and birth year only (NFR-01). Returns null when the input is not acceptable,
// including a birth year outside the 6 to 12 age range (checked on the server, not only in the form).
export function validateNewChild(input: unknown, now: Date = new Date()): { nickname: string; birth_year: number } | null {
  const { nickname, birth_year } = (input ?? {}) as { nickname?: unknown; birth_year?: unknown };
  if (typeof nickname !== "string" || nickname.trim().length === 0) return null;
  if (typeof birth_year !== "number" || !Number.isInteger(birth_year)) return null;
  const year = now.getUTCFullYear();
  if (birth_year < year - MAX_AGE || birth_year > year - MIN_AGE) return null;
  return { nickname: nickname.trim(), birth_year };
}

export async function listChildren(client: SupabaseClient): Promise<Child[]> {
  const result = await client.from("children").select("id, nickname, birth_year, created_at").order("created_at");
  return check(result, "list children");
}

export async function createChild(client: SupabaseClient, input: unknown): Promise<Child> {
  const child = validateNewChild(input);
  if (!child) throw new Error("create child: nickname and a whole birth year are required");
  const result = await client.from("children").insert(child).select("id, nickname, birth_year, created_at").single();
  return check(result, "create child");
}

// Oldest first, for the progress chart (FR-38) and the history list.
export async function listSessionResults(client: SupabaseClient, childId: string): Promise<SessionResult[]> {
  const result = await client.from("sessions").select(SESSION_COLUMNS).eq("child_id", childId).order("started_at");
  return check<SessionRow[]>(result, "list sessions").map(toSessionResult);
}

// The result card (FR-33) for one session, or null when it does not exist or is not the parent's.
export async function getSessionResult(client: SupabaseClient, sessionId: string): Promise<SessionResult | null> {
  const result = await client.from("sessions").select(SESSION_COLUMNS).eq("id", sessionId).maybeSingle();
  const row = check<SessionRow | null>(result, "get session");
  return row ? toSessionResult(row) : null;
}

// FR-39: calls onScore when a new score of this parent is saved (Realtime, RLS applies).
// Subscribe as soon as the QR is shown: changes in the first seconds after subscribing can be missed,
// so also poll getSessionResult every 2 s while waiting. Returns the function that unsubscribes.
export function onNewScore(client: SupabaseClient, onScore: (sessionId: string) => void): () => void {
  const channel = client
    .channel(`scores-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "scores" }, (change) => {
      const sessionId = (change.new as { session_id?: unknown }).session_id;
      if (typeof sessionId === "string") onScore(sessionId);
    })
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

// FR-45, FR-48: the parent's Stripe subscription status ("active", "trialing", "past_due", "canceled", ...),
// or null before any checkout. Never gate the result card, next step or deletion on it.
export async function getSubscriptionStatus(client: SupabaseClient): Promise<string | null> {
  const result = await client.from("subscriptions").select("status").maybeSingle();
  return check<{ status: string } | null>(result, "read subscription")?.status ?? null;
}

// FR-37: missions are always chosen by the parent; nothing here reads a score (NFR-52).
export async function listMissions(client: SupabaseClient, childId: string): Promise<MissionRow[]> {
  const result = await client.from("missions").select(MISSION_COLUMNS).eq("child_id", childId).order("created_at");
  return check(result, "list missions");
}

export async function addMission(client: SupabaseClient, childId: string, missionKey: string): Promise<MissionRow> {
  if (!isMissionKey(missionKey)) throw new Error("add mission: unknown mission key");
  const result = await client
    .from("missions")
    .insert({ child_id: childId, mission_key: missionKey })
    .select(MISSION_COLUMNS)
    .single();
  return check(result, "add mission");
}

export async function setMissionDone(client: SupabaseClient, missionId: string, done: boolean): Promise<MissionRow> {
  const result = await client
    .from("missions")
    .update({ status: done ? "done" : "todo" })
    .eq("id", missionId)
    .select(MISSION_COLUMNS)
    .single();
  return check(result, "update mission");
}

export async function deleteMission(client: SupabaseClient, missionId: string): Promise<void> {
  check(await client.from("missions").delete().eq("id", missionId), "delete mission");
}
