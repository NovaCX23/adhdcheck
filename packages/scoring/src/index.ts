import { SCORE_DISCLAIMER, type ScoreResult, type SessionMetrics } from "@adhdcheck/contracts";
import thresholdsJson from "../thresholds.v0.json";

// Scoring rules, version rules_v1 (docs/02 section 4.2, FR-20 to FR-26).
//
// Indicator definitions follow research/04-game-design-symptom-mapping.md section 7.2 ("Metrics (scoring side,
// recomputed server-side from raw trials)"), which is the only place the documents define them. Where that
// section is silent, the choice is listed under "Open definitions" below and is Hatem's to confirm.
//
// No numeric threshold lives in this file (FR-22). Every cut-off is read from thresholds.v0.json, where each
// value is null until it has a source. The only digits here are 0, 1, 2 and 3 (a rate is a count over a count;
// "third" is the FR-21 wording).
//
// Open definitions (nothing in docs/ or research/ states them):
//  - off_target_tap_rate has no denominator in the documents. Here: off-target taps / (off-target taps + Lantern
//    trials with a response), the share of all taps that missed. Bounded 0 to 1 as the contract requires.
//  - vigilance_change is one number in contract v1. Here: omission rate of the last third of go trials minus the
//    omission rate of the first third (research/04 7.2, "proposal vigilance.omission_change", the scoring
//    owner decides). Thirds are floor(go trials / 3) trials each, in presentation order (field i).
//  - n_trials and pct_anticipations count Lantern trials (go and no-go); calibration trials are left out.
//  - pct_anticipations is a fraction 0 to 1 (the result card multiplies by 100).
//  - The anticipation rule itself (FR-09) is applied by the game when it sets `outcome`; its parameter is TODO,
//    so the scorer trusts `outcome` and does not re-derive it from a reaction time.
//  - Age bands (research/04 7.3) are not applied: the session does not carry the child's age.

export type Thresholds = {
  validated: boolean;
  min_trials: number | null;
  min_hits: number | null;
  max_anticipation_share: number | null;
  max: { rt_cv: number | null; commission_rate: number | null; omission_rate: number | null };
};

export const THRESHOLDS: Thresholds = thresholdsJson;

type Trial = SessionMetrics["trials"][number];
type Indicators = ScoreResult["indicators"];

const mean = (a: number[]) => (a.length === 0 ? 0 : a.reduce((s, x) => s + x, 0) / a.length);
// Sample standard deviation (n - 1), as research/04 7.2. Fewer than two values: 0.
const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};
const ratio = (num: number, den: number) => (den === 0 ? 0 : num / den);
const count = (a: Trial[], outcome: Trial["outcome"]) => a.filter((t) => t.outcome === outcome).length;

export function computeIndicators(session: SessionMetrics): { indicators: Indicators; nTrials: number; nHits: number; nAnticipations: number } {
  const lantern = session.trials.filter((t) => t.type !== "calibration").sort((a, b) => a.i - b.i);
  const go = lantern.filter((t) => t.type === "go");
  const nogo = lantern.filter((t) => t.type === "nogo");
  const rts = go.filter((t) => t.outcome === "hit" && t.rt_ms !== null).map((t) => t.rt_ms as number);

  const third = Math.floor(go.length / 3);
  const early = go.slice(0, third);
  const late = go.slice(go.length - third);
  const vigilance = third === 0 ? 0 : ratio(count(late, "omission"), late.length) - ratio(count(early, "omission"), early.length);

  const offTarget = session.off_target_taps.length;
  const responded = lantern.filter((t) => t.responded).length;

  const rtMean = mean(rts);
  return {
    indicators: {
      omission_rate: ratio(count(go, "omission"), go.length),
      commission_rate: ratio(count(nogo, "commission"), nogo.length),
      rt_mean_ms: rtMean,
      rt_sd_ms: sd(rts),
      rt_cv: ratio(sd(rts), rtMean),
      vigilance_change: vigilance,
      off_target_tap_rate: ratio(offTarget, offTarget + responded),
    },
    nTrials: lantern.length,
    nHits: rts.length,
    nAnticipations: count(lantern, "anticipation"),
  };
}

// One line per flag, texts from research/04 section 7.3 (placeholders until the texts owner confirms them).
const REASON: Record<string, string> = {
  rt_cv: "Response speed varied more than expected during the watch.",
  commission_rate: "Tapped often when the game asked to wait.",
  omission_rate: "Missed many fireflies.",
};

export function scoreSession(session: SessionMetrics, thresholds: Thresholds = THRESHOLDS): ScoreResult {
  const { indicators, nTrials, nHits, nAnticipations } = computeIndicators(session);
  const share = ratio(nAnticipations, nTrials);
  const notes: string[] = [];
  const flags: string[] = [];
  const reasons: string[] = [];

  const gates = [
    ["min_trials", thresholds.min_trials],
    ["min_hits", thresholds.min_hits],
    ["max_anticipation_share", thresholds.max_anticipation_share],
    ["max.rt_cv", thresholds.max.rt_cv],
    ["max.commission_rate", thresholds.max.commission_rate],
    ["max.omission_rate", thresholds.max.omission_rate],
  ] as const;
  const unset = gates.filter(([, v]) => v === null).map(([k]) => k);

  let band: ScoreResult["band"] = "insufficient_data";
  if (unset.length > 0) {
    // "dev:" notes are not shown to parents (ResultCard isParentNote).
    notes.push(`dev: thresholds.v0.json has no value for ${unset.join(", ")}, so no band is assigned (insufficient_data).`);
  } else if (
    nTrials < (thresholds.min_trials as number) ||
    nHits < (thresholds.min_hits as number) ||
    share > (thresholds.max_anticipation_share as number)
  ) {
    band = "insufficient_data";
  } else {
    for (const key of ["rt_cv", "commission_rate", "omission_rate"] as const) {
      if (indicators[key] > (thresholds.max[key] as number)) {
        flags.push(key);
        reasons.push(REASON[key] as string);
      }
    }
    band = flags.length > 0 ? "follow_up_suggested" : "no_flag";
  }

  return {
    schema_version: "1.0",
    session_id: session.session_id,
    scoring_method: "rules_v1",
    validated: false,
    indicators,
    flags,
    band,
    data_quality: { n_trials: nTrials, pct_anticipations: share, notes },
    reasons,
    recommendations: [],
    disclaimer: SCORE_DISCLAIMER,
  };
}
