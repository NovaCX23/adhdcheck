// Lantern Watch (FR-04) and Wake the fireflies (FR-03): pure logic, no DOM, unit-tested.
// Parameters: research/03 section 11.1 (contract v1 task block) and research/04 section 5 (3 blocks x 48,
// go_probability 0.8 with fixed counts shuffled by a seeded PRNG, stimulus 500 ms, ISI uniform 900 to 1500 ms,
// 10 calibration trials). Those values are themselves design choices of the research docs, not norms.
import { mulberry32 } from "../bridge-wait/logic";

export type TrialType = "go" | "nogo" | "calibration";
export type Outcome = "hit" | "omission" | "correct_reject" | "commission" | "anticipation";
export type PointerKind = "touch" | "mouse" | "pen";

export interface TaskConfig {
  blocks: number;
  trialsPerBlock: number;
  goProbability: number;
  stimulusMs: number;
  isiMsMin: number;
  isiMsMax: number;
  calibrationTrials: number;
}

export const DEFAULT_TASK: TaskConfig = {
  blocks: 3,
  trialsPerBlock: 48,
  goProbability: 0.8,
  stimulusMs: 500,
  isiMsMin: 900,
  isiMsMax: 1500,
  calibrationTrials: 10,
};

/** Number of lanterns in the row on the bridge. TODO: design choice, not in research/03 or 04. */
export const LANTERNS = 3;

/**
 * Anticipation threshold in ms. FR-09: the rule must use the device baseline and its parameter lives in
 * thresholds.v0.json, which does not exist yet. TODO: until it does, null, so no trial is classed anticipation.
 */
export const ANTICIPATION_MS: number | null = null;

export interface ScheduledTrial {
  type: "go" | "nogo";
  block: number;
  /** Interval after the stimulus, before the next trial's onset. */
  isiMs: number;
  lantern: number;
}

export interface CalibrationTrial {
  type: "calibration";
  /** Dark interval before this firefly lights. */
  isiMs: number;
  lantern: number;
}

const isi = (cfg: TaskConfig, rnd: () => number) => cfg.isiMsMin + rnd() * (cfg.isiMsMax - cfg.isiMsMin);
const lantern = (rnd: () => number) => Math.min(LANTERNS - 1, Math.floor(rnd() * LANTERNS));

/** Fixed go/no-go counts per block (not Bernoulli), Fisher-Yates shuffled, as research/04 section 7.1. */
export function buildSchedule(cfg: TaskConfig, seed: number): ScheduledTrial[] {
  const rnd = mulberry32(seed);
  const out: ScheduledTrial[] = [];
  const nGo = Math.round(cfg.trialsPerBlock * cfg.goProbability);
  for (let b = 0; b < cfg.blocks; b++) {
    const types: Array<"go" | "nogo"> = Array.from({ length: cfg.trialsPerBlock }, (_, k) => (k < nGo ? "go" : "nogo"));
    for (let k = types.length - 1; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      const tmp = types[k] as "go" | "nogo";
      types[k] = types[j] as "go" | "nogo";
      types[j] = tmp;
    }
    for (const type of types) out.push({ type, block: b, isiMs: isi(cfg, rnd), lantern: lantern(rnd) });
  }
  return out;
}

/** Calibration: one firefly per trial, no no-go. The ISI range is borrowed from the task (TODO: design choice). */
export function buildCalibrationSchedule(cfg: TaskConfig, seed: number): CalibrationTrial[] {
  const rnd = mulberry32((seed ^ 0x2c1b3c6d) >>> 0);
  return Array.from({ length: cfg.calibrationTrials }, () => ({ type: "calibration", isiMs: isi(cfg, rnd), lantern: lantern(rnd) }));
}

export function classify(type: TrialType, responded: boolean, rtMs: number | null, anticipationMs: number | null): Outcome {
  if (responded && rtMs !== null && anticipationMs !== null && rtMs < anticipationMs) return "anticipation";
  if (type === "nogo") return responded ? "commission" : "correct_reject";
  return responded ? "hit" : "omission";
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/** Display refresh estimate from requestAnimationFrame intervals: 1000 / median interval. */
export function estimateRefreshHz(frameIntervalsMs: readonly number[]): number | null {
  const m = median(frameIntervalsMs.filter((d) => d > 0));
  return m === null ? null : 1000 / m;
}

export function normalizePointerType(raw: string | undefined, fallback: PointerKind): PointerKind {
  return raw === "touch" || raw === "mouse" || raw === "pen" ? raw : fallback;
}
