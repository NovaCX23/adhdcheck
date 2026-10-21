// Sequence runner: the render-loop wiring around logic.ts, with no rendering and no DOM, so it is unit-tested.
// The scene calls frame(ts) at the top of every requestAnimationFrame callback, BEFORE it renders, with the
// callback timestamp. A star lit in frame(ts) is drawn by the render call of that same callback, so ts is its
// onset (research/03 section 2, method 4), as in Bridge Wait. pointerDown() takes the pointerdown
// event.timeStamp and the star the scene found under the finger (null for none).
import { mulberry32 } from "../bridge-wait/logic";
import {
  MAX_FAILURES_PER_LENGTH,
  N_STARS,
  PRACTICE_SEQUENCES,
  START_LENGTH,
  STAR_INTERVAL_MS,
  buildSequence,
  judgeTap,
  nextStep,
  summarise,
  type Step,
} from "./logic";
import type { SequenceOutcome, SequenceRecord, StarPathResult, StarTap } from "./types";

// TODO: design choices, no sourced values (research/04 section 5 gives the staircase and 1 star per 1000 ms).
export const STAR_ON_MS = 700;
export const LEAD_MS = 600;
export const RECALL_GAP_MS = 300;
/** A sequence ends as "timeout" after this long without a tap during recall. */
export const RECALL_TIMEOUT_MS = 12_000;
export const FEEDBACK_MS = 1200;
// The practice instruction and "Now let's light up the sky together." wait for a tap on the Start button, with no
// timer (Hatem, 2026-10-21: the children need time to read). After that tap each keeps the intro delay it had before.
// TODO: design choices, no sourced value.
export const PRACTICE_INTRO_MS = 2000;
export const BETWEEN_MS = 1800;
export const RESULT_VERSION = "0.1.0";

export type RunState = "intro" | "practice-intro" | "present" | "recall" | "feedback" | "between" | "done";

export interface Current {
  practice: boolean;
  length: number;
  sequence: number[];
}

export interface RunnerConfig {
  seed: number;
  /** Longest sequence. Default: every star once. Other values are for dev runs only. */
  maxLength?: number;
}

export interface RunnerHooks {
  onState?: (s: RunState, ts: number, cur: Current | undefined) => void;
  /** Called inside frame(ts): light the star here, it is drawn by this callback's render. */
  onStarOn?: (ts: number, star: number, pos: number) => void;
  onStarOff?: (ts: number, star: number) => void;
  /** A recall tap on the right star (pos = its place in the sequence). */
  onRecallStar?: (tapMs: number, star: number, pos: number) => void;
  onComplete?: (result: StarPathResult) => void;
}

export type TapKind = "start" | "ready" | "next" | "complete" | "wrong" | "off" | "early" | "ignored";

export class StarPathRunner {
  state: RunState = "intro";
  private readonly seed: number;
  private readonly maxLength: number;
  private readonly hooks: RunnerHooks;
  private readonly rnd: () => number;
  private readonly records: SequenceRecord[] = [];
  private startRequested = false;
  private readyRequested = false;
  private readyAtMs = 0;
  private t0 = 0;
  private stateSince = 0;
  private cur: Current | undefined;
  private practiceLeft = PRACTICE_SEQUENCES;
  private step: Step = { length: START_LENGTH, failuresAtLength: 0 };
  // Per sequence
  private lit = -1;
  private litSince = 0;
  private onsets: number[] = [];
  private recallStart = 0;
  private lastTap = 0;
  private pos = 0;
  private taps: StarTap[] = [];
  private ended: SequenceOutcome | null = null;
  private firstErrorAt: number | null = null;
  private lastCorrectMs: number | null = null;

  constructor(cfg: RunnerConfig, hooks: RunnerHooks = {}) {
    this.seed = cfg.seed;
    this.maxLength = Math.min(cfg.maxLength ?? N_STARS, N_STARS);
    this.hooks = hooks;
    this.rnd = mulberry32(cfg.seed);
  }

  current(): Current | undefined {
    return this.cur;
  }

  /** Frame timestamp at which the current state began (for animation only). */
  get stateStartMs(): number {
    return this.stateSince;
  }

  /** The child tapped the Start button of an instruction. A tap stamped before the instruction appeared is ignored. */
  ready(tMs: number): TapKind {
    if (!this.waitsForReady() || this.readyRequested || tMs < this.stateSince) return "ignored";
    this.readyRequested = true;
    this.readyAtMs = tMs;
    return "ready";
  }

  /** True while the state shows an instruction that waits for the child's tap on the Start button. */
  waitsForReady(): boolean {
    return this.state === "practice-intro" || this.state === "between";
  }

  pointerDown(tMs: number, star: number | null): TapKind {
    if (this.waitsForReady()) return "ignored"; // only the Start button leaves an instruction: the scene calls ready() for it
    if (this.state === "intro") {
      if (this.startRequested) return "ignored";
      this.startRequested = true;
      return "start";
    }
    if (this.state === "present") {
      this.taps.push({ star, tMs, phase: "presentation" }); // pointerdown event.timeStamp, never click
      return "early";
    }
    if (this.state !== "recall" || this.ended || !this.cur) return "ignored";

    this.taps.push({ star, tMs, phase: "recall" });
    this.lastTap = tMs;
    const kind = judgeTap(this.cur.sequence, this.pos, star);
    if (kind === "off") return "off";
    if (kind === "wrong") {
      this.firstErrorAt = this.pos;
      this.ended = "error";
      return "wrong";
    }
    this.hooks.onRecallStar?.(tMs, star as number, this.pos);
    this.lastCorrectMs = tMs;
    this.pos += 1;
    if (kind === "complete") this.ended = "correct";
    return kind;
  }

  frame(ts: number): void {
    switch (this.state) {
      case "intro":
        if (this.startRequested) {
          this.t0 = ts;
          this.setState("practice-intro", ts);
        }
        return;
      case "practice-intro":
        if (this.readyRequested && ts - this.readyAtMs >= PRACTICE_INTRO_MS) this.startSequence(ts);
        return;
      case "present":
        this.present(ts);
        return;
      case "recall":
        if (!this.ended && ts - Math.max(this.recallStart, this.lastTap) >= RECALL_TIMEOUT_MS) this.ended = "timeout";
        if (this.ended) this.finishSequence(ts);
        return;
      case "feedback":
        if (ts - this.stateSince >= FEEDBACK_MS) this.afterFeedback(ts);
        return;
      case "between":
        if (this.readyRequested && ts - this.readyAtMs >= BETWEEN_MS) this.startSequence(ts);
        return;
      default:
        return;
    }
  }

  private present(ts: number) {
    const cur = this.cur as Current;
    if (this.lit >= 0 && ts - this.litSince >= STAR_ON_MS) {
      this.hooks.onStarOff?.(ts, cur.sequence[this.lit] as number);
      this.lit = -1;
    }
    const next = this.onsets.length;
    // Each onset counts from the previous drawn onset, so two stars are never less than STAR_INTERVAL_MS apart.
    const due = next === 0 ? ts - this.stateSince >= LEAD_MS : ts - (this.onsets[next - 1] as number) >= STAR_INTERVAL_MS;
    if (next < cur.length && this.lit < 0 && due) {
      const star = cur.sequence[next] as number;
      this.lit = next;
      this.litSince = ts;
      this.onsets.push(ts);
      this.hooks.onStarOn?.(ts, star, next);
      return;
    }
    if (next === cur.length && this.lit < 0 && ts - (this.onsets[next - 1] as number) >= STAR_ON_MS + RECALL_GAP_MS) {
      this.recallStart = ts;
      this.setState("recall", ts);
    }
  }

  private setState(s: RunState, ts: number) {
    this.readyRequested = false;
    this.state = s;
    this.stateSince = ts;
    this.hooks.onState?.(s, ts, this.cur);
  }

  private startSequence(ts: number) {
    const practice = this.practiceLeft > 0;
    const length = practice ? START_LENGTH : this.step.length;
    this.cur = { practice, length, sequence: buildSequence(this.rnd, length, N_STARS) };
    this.lit = -1;
    this.onsets = [];
    this.pos = 0;
    this.taps = [];
    this.ended = null;
    this.firstErrorAt = null;
    this.lastCorrectMs = null;
    this.recallStart = 0;
    this.lastTap = 0;
    this.setState("present", ts);
  }

  private finishSequence(ts: number) {
    const cur = this.cur as Current;
    const outcome = this.ended as SequenceOutcome;
    if (!cur.practice) {
      const firstRecall = this.taps.find((t) => t.phase === "recall");
      this.records.push({
        i: this.records.length,
        length: cur.length,
        sequence: cur.sequence,
        starOnsetsMs: this.onsets.map((x) => x - this.t0),
        recallStartMs: this.recallStart - this.t0,
        taps: this.taps.map((t) => ({ ...t, tMs: t.tMs - this.t0 })),
        outcome,
        firstErrorAt: this.firstErrorAt,
        firstTapRtMs: firstRecall ? firstRecall.tMs - this.recallStart : null,
        recallMs: outcome === "correct" && this.lastCorrectMs !== null ? this.lastCorrectMs - this.recallStart : null,
        earlyTaps: this.taps.filter((t) => t.phase === "presentation").length,
        offTargetTaps: this.taps.filter((t) => t.phase === "recall" && t.star === null).length,
      });
    }
    this.setState("feedback", ts);
  }

  private afterFeedback(ts: number) {
    const cur = this.cur as Current;
    if (cur.practice) {
      this.practiceLeft -= 1;
      if (this.practiceLeft > 0) this.startSequence(ts);
      else this.setState("between", ts);
      return;
    }
    const n = nextStep(this.step, this.ended as SequenceOutcome, this.maxLength);
    this.step = { length: n.length, failuresAtLength: n.failuresAtLength };
    if (n.done) {
      this.setState("done", ts);
      this.hooks.onComplete?.(this.buildResult());
      return;
    }
    this.startSequence(ts);
  }

  private buildResult(): StarPathResult {
    return {
      id: "star-path",
      version: RESULT_VERSION,
      params: {
        n_stars: N_STARS,
        start_length: START_LENGTH,
        max_length: this.maxLength,
        max_failures_per_length: MAX_FAILURES_PER_LENGTH,
        star_interval_ms: STAR_INTERVAL_MS,
        star_on_ms: STAR_ON_MS,
        recall_timeout_ms: RECALL_TIMEOUT_MS,
        practice_sequences: PRACTICE_SEQUENCES,
        seed: this.seed,
      },
      trials: this.records,
      summary: summarise(this.records),
      motion: null,
    };
  }
}
