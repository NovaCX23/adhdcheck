// Star Path (FR-61). All times are milliseconds on the performance.now() timebase
// (session-relative once stored in StarPathResult).

export type SequenceOutcome = "correct" | "error" | "timeout";

/** When a tap happened: while the stars were shown (too early), or while the child repeats them. */
export type TapPhase = "presentation" | "recall";

export interface StarTap {
  /** Index of the star hit, or null for a tap on no star. */
  star: number | null;
  tMs: number;
  phase: TapPhase;
}

export interface SequenceRecord {
  i: number;
  length: number;
  /** Star indices in the order they lit up. */
  sequence: number[];
  /** Frame time of the rAF callback that drew each star lit. */
  starOnsetsMs: number[];
  /** Frame time at which recall opened. */
  recallStartMs: number;
  taps: StarTap[];
  outcome: SequenceOutcome;
  /** Position in the sequence of the first wrong star, or null. */
  firstErrorAt: number | null;
  /** First recall tap minus recall start, or null without a tap. */
  firstTapRtMs: number | null;
  /** Last correct tap minus recall start for a correct sequence, else null. */
  recallMs: number | null;
  /** Taps while the stars were being shown. */
  earlyTaps: number;
  /** Recall taps that hit no star. */
  offTargetTaps: number;
}

export interface StarPathSummary {
  /** Longest sequence length repeated correctly (0 if none). */
  span: number;
  /** Failed sequences (wrong star or timeout). */
  errors: number;
  nSequences: number;
  earlyTaps: number;
  offTargetTaps: number;
}

/**
 * Shaped like the PC-02 proposal (research/04 section 5, docs/02 section 10.3), as Bridge Wait is. Local to the
 * mini-game because the `minigames` block is PROPOSED, not agreed. Maps to PC-02 once agreed.
 */
export interface StarPathResult {
  id: "star-path";
  version: string;
  params: {
    n_stars: number;
    start_length: number;
    max_length: number;
    max_failures_per_length: number;
    star_interval_ms: number;
    /** TODO: design choice, no sourced value. */
    star_on_ms: number;
    /** TODO: design choice, no sourced value. */
    recall_timeout_ms: number;
    practice_sequences: number;
    seed: number;
  };
  trials: SequenceRecord[];
  summary: StarPathSummary;
  /** Device-motion RMS during encoding (research/04, HI1): TODO, not captured yet. */
  motion: null;
}
