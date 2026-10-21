import type { ScoreResult } from "@adhdcheck/contracts";

// The measures (indicator bars) are shown whenever the scorer computed them from real trials (FR-33, FR-21),
// whatever the band. A session with n_trials 0 has nothing to show. While thresholds.v0.json holds no value
// (packages/scoring), every real session has band insufficient_data; hiding the bars then would hide the
// real values. The band headline is unchanged by this.
export function showsIndicators(score: Pick<ScoreResult, "band" | "data_quality">): boolean {
  return score.band !== "insufficient_data" || score.data_quality.n_trials > 0;
}
