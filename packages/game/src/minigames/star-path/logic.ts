import type { SequenceOutcome, SequenceRecord, StarPathSummary } from "./types";

// Research/04 section 5, mini-game 3: "Start length 2; +1 after a correct sequence; stop after 2 failures at
// one length; 1 star per 1000 ms (design choice)".
export const START_LENGTH = 2;
export const MAX_FAILURES_PER_LENGTH = 2;
export const STAR_INTERVAL_MS = 1000;
/** Nine stars, as the classic Corsi board has nine blocks. Design choice: research/04 gives no number. */
export const N_STARS = 9;
export const PRACTICE_SEQUENCES = 1;

/** Distinct stars in random order (seeded generator from bridge-wait/logic.ts). */
export function buildSequence(rnd: () => number, length: number, nStars: number): number[] {
  const stars = Array.from({ length: nStars }, (_, k) => k);
  for (let k = stars.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    const tmp = stars[k] as number;
    stars[k] = stars[j] as number;
    stars[j] = tmp;
  }
  return stars.slice(0, length);
}

export interface Step {
  length: number;
  failuresAtLength: number;
}

/** The staircase: what comes after a sequence of `step.length` ended with `outcome`. */
export function nextStep(step: Step, outcome: SequenceOutcome, maxLength: number): Step & { done: boolean } {
  if (outcome === "correct") {
    const length = step.length + 1;
    return { done: length > maxLength, length, failuresAtLength: 0 };
  }
  const failuresAtLength = step.failuresAtLength + 1;
  return { done: failuresAtLength >= MAX_FAILURES_PER_LENGTH, length: step.length, failuresAtLength };
}

/** One recall tap at position `pos` of the sequence. A tap on no star changes nothing. */
export function judgeTap(sequence: number[], pos: number, star: number | null): "next" | "complete" | "wrong" | "off" {
  if (star === null) return "off";
  if (star !== sequence[pos]) return "wrong";
  return pos === sequence.length - 1 ? "complete" : "next";
}

export function summarise(trials: SequenceRecord[]): StarPathSummary {
  return {
    span: trials.reduce((best, t) => (t.outcome === "correct" ? Math.max(best, t.length) : best), 0),
    errors: trials.filter((t) => t.outcome !== "correct").length,
    nSequences: trials.length,
    earlyTaps: trials.reduce((a, t) => a + t.earlyTaps, 0),
    offTargetTaps: trials.reduce((a, t) => a + t.offTargetTaps, 0),
  };
}
