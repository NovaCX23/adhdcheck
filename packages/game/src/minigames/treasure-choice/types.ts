// Treasure Choice (FR-63). All times are milliseconds on the performance.now() timebase
// (session-relative once stored in TreasureChoiceResult).

/** "now": the smaller-sooner option (1 gem). "later": the larger-later option (2 gems after the boat arrives). */
export type Choice = "now" | "later";

/**
 * When a tap happened inside one choice:
 * - "chest": while the new chest appears, before the options are drawn;
 * - "offer": while the two options are shown (a tap on neither option, or before the offer frame);
 * - "wait": after the choice, before the gems are given (pre-reward delay);
 * - "rest": after the gems are given, until the slot ends (post-reward delay).
 */
export type TapPhase = "chest" | "offer" | "wait" | "rest";

export interface ScheduledChoice {
  i: number;
  /** Pre-reward delay of the 1-gem option. */
  nowDelayMs: number;
  /** Pre-reward delay of the 2-gem option (the delay offered). */
  laterDelayMs: number;
  /** Time from the choice to the end of the choice, identical whichever option is taken. */
  slotMs: number;
  /** Cosmetic only (gem colour of this chest). The reward value never changes. */
  gemHue: number;
  /** Practice only: the one option shown, so the child experiences both outcomes once. */
  only?: Choice;
}

export interface ScheduleConfig {
  seed: number;
  count: number;
}

export interface ChoiceTap {
  tMs: number;
  phase: TapPhase;
}

export interface ChoiceRecord {
  i: number;
  choice: Choice;
  /** Delay attached to the chosen option. */
  delayChosenMs: number;
  /** Delay offered for the 2-gem option. */
  delayOfferedMs: number;
  gems: number;
  /** Frame time of the rAF callback that first drew the two options. */
  offerOnsetMs: number;
  /** pointerdown event.timeStamp of the choosing tap. */
  choiceMs: number;
  /** choiceMs minus offerOnsetMs. */
  decisionMs: number;
  /** Frame time at which the gems were given. */
  rewardMs: number;
  /** Frame time at which the choice slot ended. */
  slotEndMs: number;
  taps: ChoiceTap[];
  /** Taps between the choice and the gems (pre-reward). */
  waitTaps: number;
  /** Taps between the gems and the end of the slot (post-reward). */
  restTaps: number;
  /** Taps in the offer that chose nothing (between the options, or before the offer frame). */
  offTargetTaps: number;
}

export interface TreasureChoiceSummary {
  nChoices: number;
  /** research/04 section 5 metric: number of 1-gem (immediate) choices. */
  immediateChoices: number;
  laterChoices: number;
  /** Proportion of 2-gem (larger-later) choices, 0 to 1; null without choices. */
  proportionLater: number | null;
  medianDecisionMs: number | null;
  /** Taps after a choice and before the gems, summed over choices. */
  waitTaps: number;
  /** Taps after the gems and before the next chest, summed over choices. */
  restTaps: number;
}

/**
 * Shaped like the PC-02 proposal (research/04 section 5, docs/02 section 10.3), as Bridge Wait and Star Path
 * are. Local to the mini-game because the `minigames` block is PROPOSED, not agreed. Maps to PC-02 once agreed.
 */
export interface TreasureChoiceResult {
  id: "treasure-choice";
  version: string;
  params: {
    n_choices: number;
    gems_now: number;
    gems_later: number;
    /** Maudsley Index of Delay Aversion value (NOTES.md). */
    now_delay_ms: number;
    /** TODO: design choice, no sourced value (MIDA uses 30 s, too long for the time budget). */
    later_delay_ms: number;
    /** now_delay_ms + later_delay_ms, as in the MIDA post-reward-delay condition. */
    slot_ms: number;
    /** TODO: design choice, no sourced value. */
    chest_ms: number;
    practice_choices: number;
    seed: number;
  };
  trials: ChoiceRecord[];
  summary: TreasureChoiceSummary;
}
