import { describe, expect, it } from "vitest";
import { showsIndicators } from "./indicators";
import { sessionResult } from "./report-test-helpers";
import { buildReport } from "./report";
import { S } from "../app/parent/strings";

const dq = (n: number) => ({ n_trials: n, pct_anticipations: 0, notes: [] });

describe("showsIndicators", () => {
  it("shows the measures of a scored band", () => {
    expect(showsIndicators({ band: "no_flag", data_quality: dq(0) })).toBe(true);
    expect(showsIndicators({ band: "follow_up_suggested", data_quality: dq(0) })).toBe(true);
  });
  it("shows the real measures of an insufficient_data session that has trials", () => {
    expect(showsIndicators({ band: "insufficient_data", data_quality: dq(18) })).toBe(true);
  });
  it("shows nothing for a session with no trials", () => {
    expect(showsIndicators({ band: "insufficient_data", data_quality: dq(0) })).toBe(false);
  });
  it("the report lists the measures for insufficient_data with trials, from the stored values", () => {
    const r = sessionResult("insufficient_data", { data_quality: dq(18) });
    const text = (buildReport(r, "Mia")?.lines ?? []).map((l) => l.text).join("\n");
    expect(text).toContain(S.result.indicators);
    expect(text).toContain(`${S.indicator.omission_rate}: 6%`);
    expect(text).toContain(`${S.indicator.rt_cv}: 0.27`);
  });
});
