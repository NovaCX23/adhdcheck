import { afterEach, describe, expect, it, vi } from "vitest";
import { ScoreResultSchema, type ScoreResult, type SessionMetrics } from "@adhdcheck/contracts";
import { validSessionMetrics } from "../../../../../packages/contracts/src/fixtures/session-metrics.valid";
import { handleSessionPost } from "./handler";
import type { SessionStore } from "./store";

// In-memory store: same contract as the Supabase store, no database needed.
function memoryStore() {
  const saved = new Map<string, { session: SessionMetrics; score: ScoreResult }>();
  const store: SessionStore = {
    async save(session, score) {
      if (saved.has(session.session_id)) return { created: false };
      saved.set(session.session_id, { session, score });
      return { created: true };
    },
  };
  return { store, saved };
}

function post(body: unknown, store: SessionStore) {
  return handleSessionPost(
    new Request("http://localhost/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { store },
  );
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/sessions", () => {
  it("FR-11: saves a valid session with its trials and returns its ScoreResult", async () => {
    const { store, saved } = memoryStore();
    const res = await post(validSessionMetrics, store);

    expect(res.status).toBe(201);
    const body = ScoreResultSchema.parse(await res.json());
    expect(body.session_id).toBe(validSessionMetrics.session_id);

    const row = saved.get(validSessionMetrics.session_id);
    expect(row?.session.trials).toHaveLength(validSessionMetrics.trials.length);
    expect(row?.score).toEqual(body);
  });

  it("FR-20: a session too short to score is still saved and returns band insufficient_data", async () => {
    const { store, saved } = memoryStore();
    const res = await post({ ...validSessionMetrics, trials: [] }, store);

    expect(res.status).toBe(201);
    expect((await res.json()).band).toBe("insufficient_data");
    expect(saved.size).toBe(1);
  });

  it("FR-12: a duplicate session_id is stored once and answered with the same result", async () => {
    const { store, saved } = memoryStore();
    const first = await post(validSessionMetrics, store);
    const second = await post(validSessionMetrics, store);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());
    expect(saved.size).toBe(1);
  });

  it("rejects a body that is not JSON with 400 and saves nothing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const res = await post("{not json", store);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
    expect(saved.size).toBe(0);
  });

  it("rejects an unknown field with 400 (strict contract) and saves nothing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const res = await post({ ...validSessionMetrics, nickname: "Test Fox" }, store);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_session");
    expect(saved.size).toBe(0);
  });

  it("rejects a malformed trial with 400 and names the field, not its value", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store } = memoryStore();
    const bad = {
      ...validSessionMetrics,
      trials: [{ ...validSessionMetrics.trials[0], outcome: "unexpected-value" }],
    };
    const res = await post(bad, store);

    expect(res.status).toBe(400);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("trials.0.outcome");
    expect(text).not.toContain("unexpected-value");
  });

  it("logs the error code but never the session content or ids", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store } = memoryStore();
    await post({ ...validSessionMetrics, nickname: "Test Fox" }, store);

    expect(warn).toHaveBeenCalledTimes(1);
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).toContain("invalid_session");
    expect(logged).not.toContain("Test Fox");
    expect(logged).not.toContain(validSessionMetrics.child_id);
    expect(logged).not.toContain(validSessionMetrics.session_id);
  });

  it("answers 503 when storage fails, logs it, and does not return a result", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing: SessionStore = {
      async save() {
        throw new Error("connection refused");
      },
    };
    const res = await post(validSessionMetrics, failing);

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "storage_unavailable" });
    expect(error).toHaveBeenCalledTimes(1);
  });
});
