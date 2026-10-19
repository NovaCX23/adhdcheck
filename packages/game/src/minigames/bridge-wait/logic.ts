import type {
  BridgeWaitSummary,
  Outcome,
  Phase,
  ScheduleConfig,
  ScheduledTrial,
  Tap,
  TrialRecord,
  TrialTiming,
} from "./types";

export const WAIT_MS_MIN = 1500; // research/04 section 5: wait 1.5 to 4 s jittered
export const WAIT_MS_MAX = 4000;
export const N_TRIALS = 24; // research/04 section 5
export const PRACTICE_TRIALS = 3; // brief: practice round of 3, not scored
export const STOP_FRACTION = 0.25; // research/04 section 5 (optional, flag off by default)

// Seeded PRNG, same as research/04 section 7.1, so a seed reproduces the schedule.
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSchedule(cfg: ScheduleConfig): ScheduledTrial[] {
  const rnd = mulberry32(cfg.seed);
  const nStop = cfg.stopSignal ? Math.round(cfg.count * STOP_FRACTION) : 0;
  const flags = Array.from({ length: cfg.count }, (_, k) => k < nStop);
  for (let k = flags.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    const tmp = flags[k] as boolean;
    flags[k] = flags[j] as boolean;
    flags[j] = tmp;
  }
  return flags.map((stopTrial, i) => ({
    i,
    waitMs: WAIT_MS_MIN + rnd() * (WAIT_MS_MAX - WAIT_MS_MIN),
    stopTrial,
  }));
}

/** Phase of a tap. Boundaries are start-inclusive: a tap at the chime onset is a cross. */
export function classifyTap(tMs: number, t: TrialTiming): Phase {
  if (tMs < t.narrationStartMs) return "before";
  if (tMs < t.narrationEndMs) return "narration";
  if (tMs < t.chimeOnsetMs) return "waiting";
  if (tMs < t.windowEndMs) return "go-window";
  return "after";
}

export interface TrialClassification {
  taps: Tap[];
  outcome: Outcome;
  rtMs: number | null;
  prematureTaps: number;
  intrusionTaps: number;
}

export function classifyTrial(t: TrialTiming, tapTimesMs: number[]): TrialClassification {
  const taps = [...tapTimesMs]
    .sort((a, b) => a - b)
    .map((tMs) => ({ tMs, phase: classifyTap(tMs, t) }))
    .filter((x) => x.phase !== "before");
  const prematureTaps = taps.filter((x) => x.phase === "waiting").length;
  const intrusionTaps = taps.filter((x) => x.phase === "narration").length;
  const inWindow = taps.filter((x) => x.phase === "go-window");
  const stop = t.crowOnsetMs !== undefined;
  const crow = t.crowOnsetMs ?? Infinity;

  if (stop) {
    if (inWindow.some((x) => x.tMs >= crow)) {
      return { taps, outcome: "stop_failure", rtMs: null, prematureTaps, intrusionTaps };
    }
    const first = inWindow[0];
    if (first) return { taps, outcome: "valid", rtMs: first.tMs - t.chimeOnsetMs, prematureTaps, intrusionTaps };
    return { taps, outcome: "stop_success", rtMs: null, prematureTaps, intrusionTaps };
  }
  const first = inWindow[0];
  if (first) return { taps, outcome: "valid", rtMs: first.tMs - t.chimeOnsetMs, prematureTaps, intrusionTaps };
  return { taps, outcome: "no_response", rtMs: null, prematureTaps, intrusionTaps };
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

function sampleSd(xs: number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1));
}

export function summarise(trials: TrialRecord[]): BridgeWaitSummary {
  const rts = trials.filter((t) => t.outcome === "valid" && t.rtMs !== null).map((t) => t.rtMs as number);
  return {
    nTrials: trials.length,
    nValid: rts.length,
    prematureTapRate: trials.length ? trials.filter((t) => t.prematureTaps > 0).length / trials.length : 0,
    prematureTaps: trials.reduce((a, t) => a + t.prematureTaps, 0),
    intrusionTaps: trials.reduce((a, t) => a + t.intrusionTaps, 0),
    medianValidRtMs: rts.length ? median(rts) : null,
    sdValidRtMs: rts.length > 1 ? sampleSd(rts) : null,
  };
}
