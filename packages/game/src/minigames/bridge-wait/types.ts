// Bridge Wait (FR-62). All times are milliseconds on the performance.now() timebase
// (session-relative once stored in BridgeWaitResult).

export type Phase = "before" | "narration" | "waiting" | "go-window" | "after";

export type Outcome = "valid" | "no_response" | "stop_success" | "stop_failure";

export interface TrialTiming {
  narrationStartMs: number;
  narrationEndMs: number;
  /** Frame time of the rAF callback that drew the visual cue. */
  chimeOnsetMs: number;
  /** End of the window in which a tap counts as a cross. Value: TODO (design choice). */
  windowEndMs: number;
  /** Stop-signal trials only: frame time at which the crow was drawn. */
  crowOnsetMs?: number;
}

export interface ScheduledTrial {
  i: number;
  waitMs: number;
  stopTrial: boolean;
}

export interface ScheduleConfig {
  seed: number;
  count: number;
  stopSignal?: boolean;
}

export interface Tap {
  tMs: number;
  phase: Phase;
}

export interface TrialRecord {
  i: number;
  waitMs: number;
  narrationOnsetMs: number;
  chimeOnsetMs: number;
  taps: Tap[];
  outcome: Outcome;
  rtMs: number | null;
  prematureTaps: number;
  intrusionTaps: number;
  stopTrial: boolean;
}

export interface BridgeWaitSummary {
  nTrials: number;
  nValid: number;
  prematureTapRate: number;
  prematureTaps: number;
  intrusionTaps: number;
  medianValidRtMs: number | null;
  sdValidRtMs: number | null;
}

/**
 * Shaped like the PC-02 proposal (research/04 section 5, docs/02 section 10.3). Local to the
 * mini-game because the `minigames` block is PROPOSED, not agreed. Maps to PC-02 once agreed.
 */
export interface BridgeWaitResult {
  id: "bridge-wait";
  version: string;
  params: {
    n_trials: number;
    wait_ms_min: number;
    wait_ms_max: number;
    seed: number;
    practice_trials: number;
    /** TODO: design choice, no sourced value. */
    narration_ms: number;
    /** TODO: design choice, no sourced value. */
    go_window_ms: number;
    stop_signal_enabled: boolean;
  };
  trials: TrialRecord[];
  summary: BridgeWaitSummary;
}
