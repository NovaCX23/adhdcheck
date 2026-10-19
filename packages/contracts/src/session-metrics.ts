import { z } from "zod";

// SessionMetrics v1 (game to backend).
// Source of truth: docs/02-specification-cahier-des-charges.md, section 7.1
// (copied from research/03-tech-stack.md, section 11.1). Strict: unknown fields are rejected.
// Units: all times in milliseconds (DOMHighResTimeStamp, session-relative); rt_ms is null when responded is false.

const ms = z.number().nonnegative();

export const TaskSchema = z.strictObject({
  type: z.literal("go_nogo"),
  version: z.string(),
  blocks: z.number().int().nonnegative(),
  go_probability: z.number().min(0).max(1),
  stimulus_ms: ms,
  isi_ms_min: ms,
  isi_ms_max: ms,
  calibration_trials: z.number().int().nonnegative(),
});

export const DeviceSchema = z.strictObject({
  user_agent: z.string(),
  pointer_type: z.enum(["touch", "mouse", "pen"]),
  screen_w: z.number().nonnegative(),
  screen_h: z.number().nonnegative(),
  device_pixel_ratio: z.number().positive(),
  est_refresh_hz: z.number().positive(),
  cross_origin_isolated: z.boolean(),
  timer_clock: z.string(),
});

export const TrialSchema = z.strictObject({
  i: z.number().int().nonnegative(),
  block: z.number().int().nonnegative(),
  type: z.enum(["go", "nogo", "calibration"]),
  stimulus_onset_ms: ms,
  responded: z.boolean(),
  rt_ms: ms.nullable(),
  outcome: z.enum(["hit", "omission", "correct_reject", "commission", "anticipation"]),
  x: z.number(),
  y: z.number(),
});

export const OffTargetTapSchema = z.strictObject({
  t_ms: ms,
  during: z.enum(["isi", "stimulus"]),
});

export const CalibrationSchema = z.strictObject({
  median_rt_ms: ms,
  n: z.number().int().nonnegative(),
});

export const SessionMetricsSchema = z.strictObject({
  schema_version: z.literal("1.0"),
  session_id: z.uuid(),
  child_id: z.uuid(),
  started_at: z.iso.datetime(),
  duration_ms: ms,
  task: TaskSchema,
  device: DeviceSchema,
  trials: z.array(TrialSchema),
  off_target_taps: z.array(OffTargetTapSchema),
  calibration: CalibrationSchema,
});

export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type Trial = z.infer<typeof TrialSchema>;
