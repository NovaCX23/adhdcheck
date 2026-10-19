import { describe, expect, it } from "vitest";
import { ScoreResultSchema } from "@adhdcheck/contracts";
import { validSessionMetrics } from "../../contracts/src/fixtures/session-metrics.valid";
import { SessionMetricsSchema } from "@adhdcheck/contracts";
import { scoreSession } from "./index";

describe("scoreSession (stub)", () => {
  const session = SessionMetricsSchema.parse(validSessionMetrics);

  it("returns a ScoreResult that satisfies the contract", () => {
    expect(ScoreResultSchema.safeParse(scoreSession(session)).success).toBe(true);
  });

  it("is deterministic and keeps the session id", () => {
    expect(scoreSession(session)).toEqual(scoreSession(session));
    expect(scoreSession(session).session_id).toBe(session.session_id);
  });

  it("is not validated and reports insufficient_data until rules exist", () => {
    const r = scoreSession(session);
    expect(r.validated).toBe(false);
    expect(r.band).toBe("insufficient_data");
  });
});
