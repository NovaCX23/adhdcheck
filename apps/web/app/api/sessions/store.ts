import type { ScoreResult, SessionMetrics } from "@adhdcheck/contracts";

// Where POST /api/sessions saves a session (with its trials) and its score.
// The Supabase implementation comes with the server clients (service role, NFR-12);
// tests use an in-memory one. Saving the same session_id twice stores it once (FR-12).
export interface SessionStore {
  save(session: SessionMetrics, score: ScoreResult): Promise<{ created: boolean }>;
}

// Default until the Supabase store exists: every save fails, so the route answers 503
// and never pretends a session was stored.
export const unconfiguredStore: SessionStore = {
  async save() {
    throw new Error("session store not configured");
  },
};
