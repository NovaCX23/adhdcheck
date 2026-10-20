import { SCORE_DISCLAIMER, type ScoreResult, type SessionMetrics } from "@adhdcheck/contracts";

// STUB (Person 2 owns the real rules). It computes nothing yet: no thresholds, no flags,
// no probability. The disclaimer text is copied from docs/02, section 7.2.

export function scoreSession(session: SessionMetrics): ScoreResult {
  return {
    schema_version: "1.0",
    session_id: session.session_id,
    scoring_method: "rules_v0",
    validated: false,
    indicators: {
      omission_rate: 0,
      commission_rate: 0,
      rt_mean_ms: 0,
      rt_sd_ms: 0,
      rt_cv: 0,
      vigilance_change: 0,
      off_target_tap_rate: 0,
    },
    flags: [],
    band: "insufficient_data",
    data_quality: {
      n_trials: session.trials.length,
      pct_anticipations: 0,
      notes: ["stub: scoring rules not implemented yet"],
    },
    reasons: [],
    recommendations: [],
    disclaimer: SCORE_DISCLAIMER,
  };
}
