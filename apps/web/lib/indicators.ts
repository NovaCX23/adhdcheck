import type { ScoreResult } from "@adhdcheck/contracts";

// The measures (indicator bars) shown on the result card and in the PDF (FR-33, FR-21). Rules:
//  - Only a value the scorer computed from trials is shown. A null indicator (empty denominator) is left out, never
//    shown as 0.
//  - A row from the placeholder scorer (rules_v0) whose indicators are all zero is the stub's output, not a
//    measurement: nothing is shown for it. (Seeded demo rows are rules_v0 with real-looking values and are shown.)
//  - off_target_tap_rate is computed and stored but NOT shown until its denominator is decided (TODO, Hatem;
//    packages/scoring/src/index.ts). Only the three below are displayed.
//  - Whatever the band: while thresholds.v0.json holds no value every real session is insufficient_data, and hiding
//    the bars then would hide the real values. A session with no trial shows nothing.
export type ShownKey = "omission_rate" | "commission_rate" | "rt_cv";
export const SHOWN_KEYS: readonly ShownKey[] = ["omission_rate", "commission_rate", "rt_cv"];

type ScoreForDisplay = Pick<ScoreResult, "band" | "data_quality" | "indicators" | "scoring_method">;

export function shownIndicators(score: ScoreForDisplay): { key: ShownKey; value: number }[] {
  const stub = score.scoring_method === "rules_v0" && Object.values(score.indicators).every((v) => v === 0);
  if (stub) return [];
  if (score.band === "insufficient_data" && score.data_quality.n_trials === 0) return [];
  const out: { key: ShownKey; value: number }[] = [];
  for (const key of SHOWN_KEYS) {
    const value = score.indicators[key];
    if (value !== null) out.push({ key, value });
  }
  return out;
}

export function showsIndicators(score: ScoreForDisplay): boolean {
  return shownIndicators(score).length > 0;
}
