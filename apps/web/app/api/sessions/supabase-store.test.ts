import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SessionMetricsSchema, type ScoreResult } from "@adhdcheck/contracts";
import { scoreSession } from "@adhdcheck/scoring";
import { validSessionMetrics } from "../../../../../packages/contracts/src/fixtures/session-metrics.valid";
import { InvalidPlayLinkError } from "./store";
import { createSupabaseSessionStore } from "./supabase-store";

const session = SessionMetricsSchema.parse(validSessionMetrics);
const score: ScoreResult = scoreSession(session);
const codeHash = "a".repeat(64);

// Fake client: only rpc, answering like the save_session function (supabase/migrations).
function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("SupabaseSessionStore", () => {
  it("calls save_session once with the play code hash, the session and the score", async () => {
    const { client, rpc } = fakeClient({ data: "created", error: null });
    await createSupabaseSessionStore(client).save(codeHash, session, score);

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("save_session", { p_code_hash: codeHash, p_session: session, p_score: score });
  });

  it("reports a new session as created", async () => {
    const { client } = fakeClient({ data: "created", error: null });
    expect(await createSupabaseSessionStore(client).save(codeHash, session, score)).toEqual({ created: true });
  });

  it("reports a repeated session_id as not created (FR-12)", async () => {
    const { client } = fakeClient({ data: "duplicate", error: null });
    expect(await createSupabaseSessionStore(client).save(codeHash, session, score)).toEqual({ created: false });
  });

  it("throws InvalidPlayLinkError when the play link is refused (FR-01)", async () => {
    const { client } = fakeClient({ data: "invalid_play_link", error: null });
    await expect(createSupabaseSessionStore(client).save(codeHash, session, score)).rejects.toBeInstanceOf(
      InvalidPlayLinkError,
    );
  });

  it("throws on a database error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "connection refused" } });
    await expect(createSupabaseSessionStore(client).save(codeHash, session, score)).rejects.toThrow();
  });

  it("throws on an answer it does not know", async () => {
    const { client } = fakeClient({ data: "something_else", error: null });
    await expect(createSupabaseSessionStore(client).save(codeHash, session, score)).rejects.toThrow();
  });
});
