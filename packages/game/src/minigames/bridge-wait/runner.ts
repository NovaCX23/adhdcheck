// Trial runner: the render-loop wiring around logic.ts, with no rendering and no DOM, so it is unit-tested.
// The scene calls frame(ts) at the top of every requestAnimationFrame callback, BEFORE it renders, with the
// callback timestamp. A cue applied in frame(ts) is drawn by the render call of that same callback, so ts is
// its onset (research/03 section 2, method 4). pointerDown() takes the pointerdown event.timeStamp.
import { N_TRIALS, PRACTICE_TRIALS, WAIT_MS_MAX, WAIT_MS_MIN, buildSchedule, classifyTrial, summarise } from "./logic";
import type { BridgeWaitResult, ScheduledTrial, TrialRecord, TrialTiming } from "./types";

// TODO: design choices, no sourced values (research/04 section 5 gives only trial count and wait range).
export const NARRATION_MS = 2500;
export const GO_WINDOW_MS = 2000;
export const ITI_MS = 1000;
// The practice instruction and "Now we cross for real." wait for a tap on the Start button, with no timer (Hatem,
// 2026-10-21: the children need time to read). After that tap each keeps the intro delay it had before, so a second
// tap of a double tap never lands in a measured trial. The per-trial narration is part of the measured task.
// TODO: design choices, no sourced value.
export const PRACTICE_INTRO_MS = 2000;
export const BETWEEN_MS = 1500;
/** Stop-signal crow delay after the chime. TODO: parameters, design choice (research/04). Flag is OFF by default. */
export const CROW_DELAY_MS = 250;
export const RESULT_VERSION = "0.2.0";

export type RunState = "intro" | "practice-intro" | "narration" | "waiting" | "go" | "iti" | "between" | "done";

export interface QueueItem {
  sched: ScheduledTrial;
  practice: boolean;
}

export interface RunnerConfig {
  seed: number;
  trials?: number;
  stopSignal?: boolean;
}

export interface RunnerHooks {
  onState?: (s: RunState, ts: number, item: QueueItem | undefined) => void;
  /** Called inside frame(ts) when the cue is due: apply the visual cue and play the chime here. */
  onCue?: (ts: number, item: QueueItem) => void;
  onCrow?: (ts: number, item: QueueItem) => void;
  /** First go-window tap of a trial. */
  onCross?: (tapMs: number, item: QueueItem) => void;
  onComplete?: (result: BridgeWaitResult) => void;
}

export type TapKind = "start" | "ready" | "recorded" | "cross" | "ignored";

export class BridgeWaitRunner {
  state: RunState = "intro";
  readonly queue: QueueItem[];
  private readonly nScored: number;
  private readonly seed: number;
  private readonly stopSignal: boolean;
  private readonly hooks: RunnerHooks;
  private readonly records: TrialRecord[] = [];
  private startRequested = false;
  private readyRequested = false;
  private readyAtMs = 0;
  private idx = -1;
  private t0 = 0;
  private stateSince = 0;
  private taps: number[] = [];
  private timing: Partial<TrialTiming> = {};
  private crossed = false;

  constructor(cfg: RunnerConfig, hooks: RunnerHooks = {}) {
    this.seed = cfg.seed;
    this.nScored = cfg.trials ?? N_TRIALS;
    this.stopSignal = cfg.stopSignal ?? false;
    this.hooks = hooks;
    this.queue = [
      ...buildSchedule({ seed: (cfg.seed ^ 0x5bd1e995) >>> 0, count: PRACTICE_TRIALS }).map((sched) => ({
        sched,
        practice: true,
      })),
      ...buildSchedule({ seed: cfg.seed, count: this.nScored, stopSignal: this.stopSignal }).map((sched) => ({
        sched,
        practice: false,
      })),
    ];
  }

  current(): QueueItem | undefined {
    return this.queue[this.idx];
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

  pointerDown(tMs: number): TapKind {
    if (this.waitsForReady()) return "ignored"; // only the Start button leaves an instruction: the scene calls ready() for it
    if (this.state === "intro") {
      if (this.startRequested) return "ignored";
      this.startRequested = true;
      return "start";
    }
    if (this.state === "narration" || this.state === "waiting" || this.state === "go" || this.state === "iti") {
      this.taps.push(tMs); // pointerdown event.timeStamp, never click (research/03 section 2)
      const t = this.timing;
      if (
        this.state === "go" &&
        !this.crossed &&
        t.chimeOnsetMs !== undefined &&
        t.windowEndMs !== undefined &&
        tMs >= t.chimeOnsetMs &&
        tMs < t.windowEndMs
      ) {
        this.crossed = true;
        const item = this.current();
        if (item) this.hooks.onCross?.(tMs, item);
        return "cross";
      }
      return "recorded";
    }
    return "ignored";
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
        if (this.readyRequested && ts - this.readyAtMs >= PRACTICE_INTRO_MS) this.next(ts);
        return;
      case "narration":
        if (ts - this.stateSince >= NARRATION_MS) {
          this.timing.narrationEndMs = ts;
          this.setState("waiting", ts);
        }
        return;
      case "waiting": {
        const item = this.current();
        if (item && ts - this.stateSince >= item.sched.waitMs) {
          this.timing.chimeOnsetMs = ts;
          this.timing.windowEndMs = ts + GO_WINDOW_MS;
          this.hooks.onCue?.(ts, item);
          this.setState("go", ts);
        }
        return;
      }
      case "go": {
        const item = this.current();
        if (
          item?.sched.stopTrial &&
          this.timing.crowOnsetMs === undefined &&
          ts - (this.timing.chimeOnsetMs as number) >= CROW_DELAY_MS
        ) {
          this.timing.crowOnsetMs = ts;
          this.hooks.onCrow?.(ts, item);
        }
        if (ts >= (this.timing.windowEndMs as number)) this.setState("iti", ts);
        return;
      }
      case "iti":
        if (ts - this.stateSince >= ITI_MS) this.finishTrial(ts);
        return;
      case "between":
        if (this.readyRequested && ts - this.readyAtMs >= BETWEEN_MS) this.next(ts);
        return;
      default:
        return;
    }
  }

  private setState(s: RunState, ts: number) {
    this.readyRequested = false;
    this.state = s;
    this.stateSince = ts;
    this.hooks.onState?.(s, ts, this.current());
  }

  private next(ts: number) {
    this.idx += 1;
    const item = this.current();
    if (!item) {
      this.setState("done", ts);
      this.hooks.onComplete?.(this.buildResult());
      return;
    }
    this.taps = [];
    this.crossed = false;
    this.timing = { narrationStartMs: ts };
    this.setState("narration", ts);
  }

  private finishTrial(ts: number) {
    const item = this.current();
    if (!item) return;
    const t = this.timing as TrialTiming;
    const c = classifyTrial(t, this.taps);
    if (!item.practice) {
      this.records.push({
        i: item.sched.i,
        waitMs: item.sched.waitMs,
        narrationOnsetMs: t.narrationStartMs - this.t0,
        chimeOnsetMs: t.chimeOnsetMs - this.t0,
        taps: c.taps.map((x) => ({ tMs: x.tMs - this.t0, phase: x.phase })),
        outcome: c.outcome,
        rtMs: c.rtMs,
        prematureTaps: c.prematureTaps,
        intrusionTaps: c.intrusionTaps,
        stopTrial: item.sched.stopTrial,
      });
    }
    const following = this.queue[this.idx + 1];
    if (following && item.practice && !following.practice) this.setState("between", ts);
    else this.next(ts);
  }

  private buildResult(): BridgeWaitResult {
    return {
      id: "bridge-wait",
      version: RESULT_VERSION,
      params: {
        n_trials: this.nScored,
        wait_ms_min: WAIT_MS_MIN,
        wait_ms_max: WAIT_MS_MAX,
        seed: this.seed,
        practice_trials: PRACTICE_TRIALS,
        narration_ms: NARRATION_MS,
        go_window_ms: GO_WINDOW_MS,
        stop_signal_enabled: this.stopSignal,
      },
      trials: this.records,
      summary: summarise(this.records),
    };
  }
}
