import { describe, expect, it } from "vitest";
import { ScoreResultSchema, SessionMetricsSchema } from "./index";
import { validScoreResult } from "./fixtures/score-result.valid";
import { validSessionMetrics } from "./fixtures/session-metrics.valid";

const clone = <T>(v: T): T => structuredClone(v);

describe("SessionMetrics v1", () => {
  it("accepts the valid fixture", () => {
    expect(SessionMetricsSchema.safeParse(validSessionMetrics).success).toBe(true);
  });

  it("rejects an unknown top-level field", () => {
    const bad = { ...clone(validSessionMetrics), child_name: "x" };
    expect(SessionMetricsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an unknown field inside a trial", () => {
    const bad = clone(validSessionMetrics);
    (bad.trials[0] as Record<string, unknown>).landmarks = [1, 2, 3];
    expect(SessionMetricsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an outcome outside the enum", () => {
    const bad = clone(validSessionMetrics);
    bad.trials[0]!.outcome = "perfect";
    expect(SessionMetricsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const bad = clone(validSessionMetrics) as Record<string, unknown>;
    delete bad.calibration;
    expect(SessionMetricsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a wrong schema_version", () => {
    const bad = { ...clone(validSessionMetrics), schema_version: "2.0" };
    expect(SessionMetricsSchema.safeParse(bad).success).toBe(false);
  });
});

describe("ScoreResult v1", () => {
  it("accepts the valid fixture", () => {
    expect(ScoreResultSchema.safeParse(validScoreResult).success).toBe(true);
  });

  it("rejects an unknown field (no probability allowed)", () => {
    const bad = { ...clone(validScoreResult), adhd_probability: 0.7 };
    expect(ScoreResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a band outside the enum", () => {
    const bad = { ...clone(validScoreResult), band: "adhd_likely" };
    expect(ScoreResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a rate above 1", () => {
    const bad = clone(validScoreResult);
    bad.indicators.omission_rate = 1.5;
    expect(ScoreResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe("SCORE_DISCLAIMER", () => {
  it("is the fixed text of docs/02 section 7.2 and the one the fixture carries", async () => {
    const { SCORE_DISCLAIMER } = await import("./index");
    expect(SCORE_DISCLAIMER).toBe("Attention profile from a game. Not a diagnosis. Talk to a healthcare professional.");
    expect(validScoreResult.disclaimer).toBe(SCORE_DISCLAIMER);
  });
});
