import { afterEach, describe, expect, it, vi } from "vitest";
import { ScoreResultSchema, type ScoreResult, type SessionMetrics } from "@adhdcheck/contracts";
import { validSessionMetrics } from "../../../../../packages/contracts/src/fixtures/session-metrics.valid";
import { newPlayCode } from "../../../lib/play-link";
import type { RateLimiter } from "../../../lib/rate-limit";
import { handleSessionPost } from "./handler";
import { InvalidPlayLinkError, type SessionStore } from "./store";
import { DEFAULT_TASK } from "../../../../../packages/game/src/minigames/lantern-watch/logic";
import { LanternWatchRunner, type RunData } from "../../../../../packages/game/src/minigames/lantern-watch/runner";
import { buildSessionMetrics } from "../../../../../packages/game/src/minigames/lantern-watch/session";

// In-memory store: same contract as the Supabase store, no database needed.
function memoryStore() {
  const saved = new Map<string, { codeHash: string; session: SessionMetrics; score: ScoreResult }>();
  const store: SessionStore = {
    async save(codeHash, session, score) {
      if (saved.has(session.session_id)) return { created: false };
      saved.set(session.session_id, { codeHash, session, score });
      return { created: true };
    },
  };
  return { store, saved };
}

const allowAll: RateLimiter = { take: async () => true };
const link = newPlayCode();

function post(
  body: unknown,
  store: SessionStore,
  { code = link.code as string | null, rateLimiter = allowAll } = {},
) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (code !== null) headers.authorization = `Bearer ${code}`;
  return handleSessionPost(
    new Request("http://localhost/api/sessions", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { store, rateLimiter },
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

  it("FR-01: passes the store the hash of the play code, never the code", async () => {
    const { store, saved } = memoryStore();
    await post(validSessionMetrics, store);

    expect(saved.get(validSessionMetrics.session_id)?.codeHash).toBe(link.codeHash);
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

  it("FR-01: answers 401 without a play code and saves nothing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const res = await post(validSessionMetrics, store, { code: null });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_play_link" });
    expect(saved.size).toBe(0);
  });

  it("FR-01: answers 401 when the store refuses the play link (unknown, expired or used)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const refusing: SessionStore = {
      async save() {
        throw new InvalidPlayLinkError();
      },
    };
    const res = await post(validSessionMetrics, refusing);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_play_link" });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(link.code);
  });

  it("NFR-13: answers 429 above the rate limit, before reading the body", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const take = vi.fn().mockResolvedValue(false);
    const res = await post("{not json", store, { rateLimiter: { take } });

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "too_many_requests" });
    expect(take).toHaveBeenCalledTimes(1);
    expect(saved.size).toBe(0);
  });

  it("NFR-13: answers 503 when the rate limit cannot be checked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const broken: RateLimiter = {
      take: async () => {
        throw new Error("connection refused");
      },
    };
    const res = await post(validSessionMetrics, store, { rateLimiter: broken });

    expect(res.status).toBe(503);
    expect(saved.size).toBe(0);
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

describe("POST /api/sessions with a Lantern Watch session (the game wired into /play/[code])", () => {
  // The game's own runner and payload builder, driven by a simulated child: every firefly tapped 400 ms after
  // onset, moths never. Synthetic ids.
  function lanternSession(): SessionMetrics {
    const task = { ...DEFAULT_TASK, blocks: 1, trialsPerBlock: 10 };
    let data: RunData | null = null;
    const taps: { t: number; lantern: number | null }[] = [];
    const r = new LanternWatchRunner(
      { task, seed: 3, anticipationMs: null },
      {
        onStimulus: (ts, tr) => {
          if (tr.type !== "nogo") taps.push({ t: ts + 400, lantern: tr.lantern });
        },
        onComplete: (d) => {
          data = d;
        },
      },
    );
    let ts = 1000;
    r.pointerDown(ts, 0, 0, null);
    for (let k = 0; k < 200_000 && !data; k++) {
      ts += 1000 / 60;
      while (taps.length && (taps[0] as { t: number }).t <= ts) {
        const p = taps.shift() as { t: number; lantern: number | null };
        r.pointerDown(p.t, 100, 100, p.lantern);
      }
      r.frame(ts);
    }
    const d = data as RunData | null;
    if (!d) throw new Error("simulated run did not finish");
    return buildSessionMetrics({
      sessionId: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
      childId: "7d9e0a1b-2c3d-4e5f-8a9b-0c1d2e3f4a5b",
      startedAt: "2026-10-20T10:00:00.000Z",
      durationMs: d.duration_ms,
      task,
      device: validSessionMetrics.device as SessionMetrics["device"],
      trials: d.trials,
      offTargetTaps: d.off_target_taps,
    });
  }

  it("FR-11: saves it with all its trials and returns a valid ScoreResult", async () => {
    const { store, saved } = memoryStore();
    const session = lanternSession();
    const res = await post(session, store);
    expect(res.status).toBe(201);
    const body = ScoreResultSchema.parse(await res.json());
    expect(body.session_id).toBe(session.session_id);
    expect(saved.get(session.session_id)?.session.trials).toHaveLength(20);
  });
});
