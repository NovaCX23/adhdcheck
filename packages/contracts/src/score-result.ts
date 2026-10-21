import { z } from "zod";

// ScoreResult v1 (scoring to dashboard).
// Source of truth: docs/02-specification-cahier-des-charges.md, section 7.2
// (copied from research/03-tech-stack.md, section 11.2). Strict: unknown fields are rejected,
// so a probability or severity field cannot be added by accident.
// Rates are fractions 0 to 1. Thresholds are not part of the contract.

const rate = z.number().min(0).max(1);

export const IndicatorsSchema = z.strictObject({
  omission_rate: rate,
  commission_rate: rate,
  rt_mean_ms: z.number().nonnegative(),
  rt_sd_ms: z.number().nonnegative(),
  rt_cv: z.number().nonnegative(),
  vigilance_change: z.number(),
  off_target_tap_rate: rate,
});

export const DataQualitySchema = z.strictObject({
  n_trials: z.number().int().nonnegative(),
  pct_anticipations: z.number().nonnegative(),
  notes: z.array(z.string()),
});

export const ScoreResultSchema = z.strictObject({
  schema_version: z.literal("1.0"),
  session_id: z.uuid(),
  // rules_v0 = the placeholder scorer (rows already stored); rules_v1 = real indicators (docs/02 FR-25: a new value per change).
  scoring_method: z.enum(["rules_v0", "rules_v1"]),
  validated: z.boolean(),
  indicators: IndicatorsSchema,
  flags: z.array(z.string()),
  band: z.enum(["no_flag", "follow_up_suggested", "insufficient_data"]),
  data_quality: DataQualitySchema,
  reasons: z.array(z.string()),
  recommendations: z.array(z.string()),
  disclaimer: z.string(),
});

export type ScoreResult = z.infer<typeof ScoreResultSchema>;
