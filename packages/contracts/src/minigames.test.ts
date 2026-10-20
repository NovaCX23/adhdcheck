import { describe, expect, it } from "vitest";
import { MINIGAME_IDS, MiniGameEntrySchema, SessionMetricsSchema } from "./session-metrics";
import { validSessionMetrics } from "./fixtures/session-metrics.valid";

// PC-02 (docs/02 section 10.3, accepted by Hatem 2026-10-20): an optional `minigames` array on SessionMetrics,
// one entry per mini-game with `id`, `version`, `params` and `trials` or `results`. Synthetic values only.
const starPath = {
  id: "star-path",
  version: "0.1.0",
  params: { n_stars: 9, seed: 1 },
  trials: [{ i: 0, length: 2, outcome: "correct" }],
  results: { summary: { span: 2, errors: 0 }, motion: null },
};
const skipped = { id: "route-planner", version: "none", params: {}, results: { status: "skipped", reason: "mount_failed" } };

describe("SessionMetrics.minigames (PC-02)", () => {
  it("a v1 payload without the field is still valid (additive change)", () => {
    expect(SessionMetricsSchema.safeParse(validSessionMetrics).success).toBe(true);
  });

  it("accepts a minigames array with trials, with results, or with both", () => {
    const entries = [starPath, { id: "bridge-wait", version: "0.1.0", params: {}, results: { summary: { nTrials: 24 } } }, skipped];
    const parsed = SessionMetricsSchema.safeParse({ ...validSessionMetrics, minigames: entries });
    expect(parsed.success).toBe(true);
  });

  it("lists the four built mini-games after Lantern Watch, in the order of docs/04 section 5", () => {
    expect([...MINIGAME_IDS]).toEqual(["star-path", "bridge-wait", "treasure-choice", "route-planner"]);
  });

  it.each([
    ["an unknown field on an entry", { ...starPath, extra: 1 }],
    ["an id that is not a built mini-game", { ...starPath, id: "storm-watch" }],
    ["an entry with neither trials nor results", { id: "star-path", version: "0.1.0", params: {} }],
    ["a missing version", { id: "star-path", params: {}, results: {} }],
    ["a missing params", { id: "star-path", version: "0.1.0", results: {} }],
    ["trials that are not an array", { ...starPath, trials: "x" }],
    ["a value that is not JSON (undefined inside results)", { ...starPath, results: { a: undefined } }],
    ["a non-finite number in params", { ...starPath, params: { a: Number.NaN } }],
  ])("rejects %s", (_name, entry) => {
    expect(MiniGameEntrySchema.safeParse(entry).success).toBe(false);
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, minigames: [entry] }).success).toBe(false);
  });

  it("rejects the same mini-game twice, and more entries than there are mini-games", () => {
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, minigames: [starPath, starPath] }).success).toBe(false);
    const five = [...MINIGAME_IDS, "star-path"].map((id) => ({ ...skipped, id }));
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, minigames: five }).success).toBe(false);
  });

  it("rejects a minigames field that is not an array", () => {
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, minigames: starPath }).success).toBe(false);
  });

  it("does not add the other PC-02 blocks (motion, context): they stay rejected", () => {
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, motion: {} }).success).toBe(false);
    expect(SessionMetricsSchema.safeParse({ ...validSessionMetrics, context: {} }).success).toBe(false);
  });
});
