// Synthetic fixture. Shape and enums are copied from docs/02-specification-cahier-des-charges.md, section 7.2.
export const validScoreResult = {
  schema_version: "1.0",
  session_id: "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b",
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
  data_quality: { n_trials: 0, pct_anticipations: 0, notes: [] },
  reasons: [],
  recommendations: [],
  disclaimer: "Attention profile from a game. Not a diagnosis. Talk to a healthcare professional.",
};
