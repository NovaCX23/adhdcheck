// Treasure Choice (FR-63), pure logic: no DOM, no rendering, unit-tested.
//
// Task structure: the post-reward-delay condition of the Maudsley Index of Delay Aversion (MIDA), as described
// by Paloyelis et al. 2009 (PMID 19564796) and Marco et al. 2009 (PMID 19413450): the small reward comes after
// a short pre-reward delay and is followed by a post-reward delay equal to the long delay, the large reward comes
// after the long delay and is followed by the short delay, "therefore the overall delay was constant and
// independent of choice made" (Paloyelis 2009). See NOTES.md for the sources and which values are design choices.
import { mulberry32 } from "../bridge-wait/logic";
import type { Choice, ChoiceRecord, ScheduleConfig, ScheduledChoice, TapPhase, TreasureChoiceSummary } from "./types";

/** research/04 section 5: 10 choices. */
export const N_CHOICES = 10;
/** Design choice (TODO validate): one forced 1-gem and one forced 2-gem practice choice, not recorded. */
export const PRACTICE_CHOICES = 2;
export const GEMS_NOW = 1; // research/04 section 5: 1 gem now
export const GEMS_LATER = 2; // research/04 section 5: 2 gems after a wait
/** MIDA small-reward pre-reward delay, 2 s (PMID 19413450, PMID 19564796). */
export const NOW_DELAY_MS = 2000;
/** Design choice, TODO validate: MIDA uses 30 s, which would make 10 choices last over 5 minutes against the
 * about 2 minute budget of research/04 section 5. */
export const LATER_DELAY_MS = 8000;
/** Slot from the choice to the end of the choice: the sum of both delays, as in the MIDA post-reward-delay
 * condition (2 + 30 = 30 + 2 there). */
export const SLOT_MS = NOW_DELAY_MS + LATER_DELAY_MS;

export { mulberry32 };

export function buildSchedule(cfg: ScheduleConfig): ScheduledChoice[] {
  const rnd = mulberry32(cfg.seed);
  return Array.from({ length: cfg.count }, (_, i) => ({
    i,
    nowDelayMs: NOW_DELAY_MS,
    laterDelayMs: LATER_DELAY_MS,
    slotMs: SLOT_MS,
    gemHue: Math.floor(rnd() * 360),
  }));
}

/** Delay before the gems for a choice. */
export function preDelayMs(choice: Choice, s: ScheduledChoice): number {
  return choice === "now" ? s.nowDelayMs : s.laterDelayMs;
}

/** Delay after the gems: what is left of the slot, so that choosing "now" never shortens the game. */
export function postDelayMs(choice: Choice, s: ScheduledChoice): number {
  return s.slotMs - preDelayMs(choice, s);
}

export interface ChoiceBounds {
  chestStartMs: number;
  offerOnsetMs: number;
  choiceMs: number;
  rewardMs: number;
  slotEndMs: number;
}

/** Phase of a tap. Boundaries are start-inclusive; the choosing tap itself is not passed here. */
export function classifyTap(tMs: number, b: ChoiceBounds): TapPhase {
  if (tMs < b.offerOnsetMs) return "chest";
  if (tMs <= b.choiceMs) return "offer";
  if (tMs < b.rewardMs) return "wait";
  return "rest";
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

export function summarise(records: ChoiceRecord[]): TreasureChoiceSummary {
  const later = records.filter((r) => r.choice === "later").length;
  const n = records.length;
  return {
    nChoices: n,
    immediateChoices: n - later,
    laterChoices: later,
    proportionLater: n ? later / n : null,
    medianDecisionMs: n ? median(records.map((r) => r.decisionMs)) : null,
    waitTaps: records.reduce((a, r) => a + r.waitTaps, 0),
    restTaps: records.reduce((a, r) => a + r.restTaps, 0),
  };
}
