import { describe, expect, it, vi } from "vitest";
import { validScoreResult } from "../../../packages/contracts/src/fixtures/score-result.valid";
import { validSessionMetrics } from "../../../packages/contracts/src/fixtures/session-metrics.valid";
import { SessionMetricsSchema } from "@adhdcheck/contracts";
import { createPlayLink, resolvePlayLink, uploadSession } from "./play-client";

const CODE = "a".repeat(43);
const metrics = SessionMetricsSchema.parse(validSessionMetrics);
const noWait = async () => {};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("resolvePlayLink (FR-01)", () => {
  it("answers the child_id of a valid link", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(200, { child_id: "c1" }));
    expect(await resolvePlayLink(CODE, { fetchImpl })).toEqual({ child_id: "c1" });
    expect(fetchImpl).toHaveBeenCalledWith(`/api/play-links/${CODE}`, expect.objectContaining({ cache: "no-store" }));
  });

  it("answers null for an unknown, expired or used link (the page shows 'ask your parent')", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(404, { error: "invalid_play_link" }));
    expect(await resolvePlayLink(CODE, { fetchImpl })).toBeNull();
  });
});

describe("uploadSession (FR-11, FR-12)", () => {
  it("posts the session with the code as a Bearer header and returns the score", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(201, validScoreResult));
    const result = await uploadSession(CODE, metrics, { fetchImpl, wait: noWait });

    expect(result).toEqual({ status: "saved", score: validScoreResult });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/sessions");
    expect(init.method).toBe("POST");
    expect(init.headers.authorization).toBe(`Bearer ${CODE}`);
    expect(JSON.parse(init.body)).toEqual(metrics);
  });

  it("retries the same body after a network error or a 503, then succeeds (no replay: same session_id)", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(reply(503, { error: "storage_unavailable" }))
      .mockResolvedValueOnce(reply(200, validScoreResult));
    const result = await uploadSession(CODE, metrics, { fetchImpl, wait: noWait });

    expect(result.status).toBe("saved");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const bodies = fetchImpl.mock.calls.map(([, init]) => init.body);
    expect(new Set(bodies).size).toBe(1);
  });

  it("retries after a 429 too", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply(429, { error: "too_many_requests" }))
      .mockResolvedValueOnce(reply(201, validScoreResult));
    expect((await uploadSession(CODE, metrics, { fetchImpl, wait: noWait })).status).toBe("saved");
  });

  it("does not retry a refused play link", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(401, { error: "invalid_play_link" }));
    const result = await uploadSession(CODE, metrics, { fetchImpl, wait: noWait });

    expect(result).toEqual({ status: "refused", error: "invalid_play_link" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry an invalid session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(400, { error: "invalid_session", issues: [] }));
    const result = await uploadSession(CODE, metrics, { fetchImpl, wait: noWait });
    expect(result).toEqual({ status: "refused", error: "invalid_session" });
  });

  it("gives up after the last attempt and says so, waiting longer each time", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const wait = vi.fn<(ms: number) => Promise<void>>(async () => {});
    const result = await uploadSession(CODE, metrics, { fetchImpl, wait, attempts: 4 });

    expect(result).toEqual({ status: "failed" });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    const delays = wait.mock.calls.map(([ms]) => ms as number);
    expect(delays).toHaveLength(3);
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });
});

describe("createPlayLink (FR-32)", () => {
  it("creates a link for the child and builds the play URL for the QR", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(201, { code: CODE, expires_at: "2026-10-20T11:00:00.000Z" }));
    const link = await createPlayLink("c1", { fetchImpl, origin: "https://example.test" });

    expect(link).toEqual({ code: CODE, expires_at: "2026-10-20T11:00:00.000Z", url: `https://example.test/play/${CODE}` });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/play-links");
    expect(init.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ child_id: "c1" });
  });

  it("throws with the error code when the link cannot be created", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(401, { error: "not_logged_in" }));
    await expect(createPlayLink("c1", { fetchImpl, origin: "https://example.test" })).rejects.toThrow("not_logged_in");
  });
});
