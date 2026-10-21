import { describe, expect, it } from "vitest";
import { IndicatorsSchema, TrialSchema } from "./index";

// FR-21: "Client-side scores are never trusted". A trial whose outcome contradicts its type, responded flag or
// reaction time is rejected at the contract, so the scorer never counts it.
const base = { i: 0, block: 0, stimulus_onset_ms: 100, x: 1, y: 1 };
const ok = [
  { ...base, type: "go", responded: true, rt_ms: 400, outcome: "hit" },
  { ...base, type: "go", responded: false, rt_ms: null, outcome: "omission" },
  { ...base, type: "go", responded: true, rt_ms: 100, outcome: "anticipation" },
  { ...base, type: "nogo", responded: false, rt_ms: null, outcome: "correct_reject" },
  { ...base, type: "nogo", responded: true, rt_ms: 300, outcome: "commission" },
  { ...base, type: "calibration", responded: true, rt_ms: 350, outcome: "hit" },
  { ...base, type: "calibration", responded: false, rt_ms: null, outcome: "omission" },
];
const bad = [
  { ...base, type: "go", responded: true, rt_ms: null, outcome: "hit" },
  { ...base, type: "go", responded: false, rt_ms: 400, outcome: "omission" },
  { ...base, type: "go", responded: false, rt_ms: null, outcome: "hit" },
  { ...base, type: "go", responded: true, rt_ms: 400, outcome: "commission" },
  { ...base, type: "go", responded: false, rt_ms: null, outcome: "correct_reject" },
  { ...base, type: "nogo", responded: true, rt_ms: 300, outcome: "hit" },
  { ...base, type: "nogo", responded: false, rt_ms: null, outcome: "omission" },
  { ...base, type: "nogo", responded: false, rt_ms: null, outcome: "commission" },
  { ...base, type: "calibration", responded: true, rt_ms: null, outcome: "hit" },
  { ...base, type: "calibration", responded: true, rt_ms: 300, outcome: "commission" },
];

describe("TrialSchema consistency", () => {
  it.each(ok.map((t, k) => [k, t] as const))("accepts a consistent trial %i", (_k, t) => {
    expect(TrialSchema.safeParse(t).success).toBe(true);
  });
  it.each(bad.map((t, k) => [k, t] as const))("rejects a contradictory trial %i", (_k, t) => {
    expect(TrialSchema.safeParse(t).success).toBe(false);
  });
});

describe("IndicatorsSchema allows null for an indicator with no data (I1)", () => {
  const zero = { omission_rate: 0, commission_rate: 0, rt_mean_ms: 0, rt_sd_ms: 0, rt_cv: 0, vigilance_change: 0, off_target_tap_rate: 0 };
  it("accepts null in every field and still rejects an out-of-range rate", () => {
    expect(IndicatorsSchema.safeParse({ omission_rate: null, commission_rate: null, rt_mean_ms: null, rt_sd_ms: null, rt_cv: null, vigilance_change: null, off_target_tap_rate: null }).success).toBe(true);
    expect(IndicatorsSchema.safeParse({ ...zero, omission_rate: 1.5 }).success).toBe(false);
    expect(IndicatorsSchema.safeParse({ ...zero, rt_mean_ms: undefined }).success).toBe(false);
  });
});
