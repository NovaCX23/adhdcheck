import { describe, expect, it } from "vitest";
import type { ScoreResult } from "@adhdcheck/contracts";
import { shownIndicators, showsIndicators } from "./indicators";
import { sessionResult } from "./report-test-helpers";
import { buildReport } from "./report";
import { S } from "../app/parent/strings";

const dq = (n: number) => ({ n_trials: n, pct_anticipations: 0, notes: [] });
const ind = (o: Partial<ScoreResult["indicators"]> = {}): ScoreResult["indicators"] => ({
  omission_rate: 0.1, commission_rate: 0.2, rt_mean_ms: 500, rt_sd_ms: 80, rt_cv: 0.16, vigilance_change: 0.05, off_target_tap_rate: 0.3, ...o,
});
const score = (o: Partial<ScoreResult> = {}) => ({ band: "no_flag" as const, data_quality: dq(0), indicators: ind(), scoring_method: "rules_v1" as const, ...o });
const keys = (s: ReturnType<typeof score>) => shownIndicators(s).map((x) => x.key);

describe("shownIndicators", () => {
  it("shows the three measures of a scored band, never the off-target tap rate (denominator undecided)", () => {
    expect(keys(score())).toEqual(["omission_rate", "commission_rate", "rt_cv"]);
    expect(keys(score({ band: "follow_up_suggested" }))).not.toContain("off_target_tap_rate");
  });
  it("shows the real measures of an insufficient_data session that has trials, nothing when it has none", () => {
    expect(showsIndicators(score({ band: "insufficient_data", data_quality: dq(18) }))).toBe(true);
    expect(showsIndicators(score({ band: "insufficient_data", data_quality: dq(0) }))).toBe(false);
  });
  it("I1: leaves a null indicator out instead of showing 0", () => {
    const s = score({ band: "insufficient_data", data_quality: dq(18), indicators: ind({ rt_cv: null, omission_rate: null }) });
    expect(keys(s)).toEqual(["commission_rate"]);
    expect(showsIndicators(score({ band: "insufficient_data", data_quality: dq(18), indicators: ind({ omission_rate: null, commission_rate: null, rt_cv: null }) }))).toBe(false);
  });
  it("I1: shows nothing for the all-zero output of the placeholder scorer (rules_v0), but shows a rules_v0 row with values", () => {
    const zeros = ind({ omission_rate: 0, commission_rate: 0, rt_mean_ms: 0, rt_sd_ms: 0, rt_cv: 0, vigilance_change: 0, off_target_tap_rate: 0 });
    expect(showsIndicators(score({ scoring_method: "rules_v0", band: "no_flag", indicators: zeros }))).toBe(false);
    expect(showsIndicators(score({ scoring_method: "rules_v0", band: "no_flag" }))).toBe(true);
    // the check can fail: the same zeros from the real scorer are a real measurement
    expect(showsIndicators(score({ scoring_method: "rules_v1", band: "no_flag", indicators: zeros }))).toBe(true);
  });
});

describe("the paid report", () => {
  const text = (r: ReturnType<typeof sessionResult>) => (buildReport(r, "Mia")?.lines ?? []).map((l) => l.text).join(" ");
  it("lists the measures for insufficient_data with trials, from the stored values", () => {
    const t = text(sessionResult("insufficient_data", { data_quality: dq(18) }));
    expect(t).toContain(S.result.indicators);
    expect(t).toContain(`${S.indicator.omission_rate}: 6%`);
    expect(t).toContain(`${S.indicator.rt_cv}: 0.27`);
  });
  it("leaves out the off-target tap rate and any null measure", () => {
    const r = sessionResult("no_flag", { data_quality: dq(18), indicators: ind({ commission_rate: null, off_target_tap_rate: 0.12 }) });
    const t = text(r);
    expect(t).not.toContain(S.indicator.off_target_tap_rate);
    expect(t).not.toContain(S.indicator.commission_rate);
    expect(t).toContain(S.indicator.omission_rate);
  });
  it("shows no measures section for a rules_v0 stub row", () => {
    const zeros = ind({ omission_rate: 0, commission_rate: 0, rt_mean_ms: 0, rt_sd_ms: 0, rt_cv: 0, vigilance_change: 0, off_target_tap_rate: 0 });
    expect(text(sessionResult("insufficient_data", { scoring_method: "rules_v0", data_quality: dq(18), indicators: zeros }))).not.toContain(S.result.indicators);
  });
});
