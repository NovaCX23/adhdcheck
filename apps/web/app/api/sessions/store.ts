import type { ScoreResult, SessionMetrics } from "@adhdcheck/contracts";

// Where POST /api/sessions saves a session (with its trials) and its score, using up the play link
// the child's device came with (FR-01). The Supabase implementation uses the service role (NFR-12);
// tests use an in-memory one. Saving the same session_id twice stores it once (FR-12).
export interface SessionStore {
  save(codeHash: string, session: SessionMetrics, score: ScoreResult): Promise<{ created: boolean }>;
}

// The play link is unknown, expired, already used for another session, or for another child.
export class InvalidPlayLinkError extends Error {
  constructor() {
    super("invalid play link");
    this.name = "InvalidPlayLinkError";
  }
}
