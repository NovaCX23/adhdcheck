// Lantern Watch trial runner: the render-loop wiring around logic.ts, with no rendering and no DOM, so it is
// unit-tested. The scene calls frame(ts) at the top of every requestAnimationFrame callback, BEFORE it renders,
// with the callback timestamp. A stimulus shown in frame(ts) (onStimulus) is drawn by the render call of that
// same callback, so ts is its onset (research/03 section 2.3 item 4). pointerDown() takes the pointerdown
// event.timeStamp, never a click and never the time the handler runs.
//
// Sequence: start tap, "Wake the fireflies" calibration (FR-03), practice (not recorded, FR-02), then
// task.blocks blocks with a child-paced break between blocks, then done.
import type { Trial } from "@adhdcheck/contracts";
import {
  buildCalibrationSchedule,
  buildSchedule,
  classify,
  type CalibrationTrial,
  type ScheduledTrial,
  type TaskConfig,
  type TrialType,
} from "./logic";
import type { OffTargetTap } from "./session";

// TODO: design choices, no sourced value (research/03 and 04 give none of these).
export const CALIB_INTRO_MS = 2600;
/** A calibration firefly stays lit until tapped; after this long the practice hand shows where to tap. */
export const CALIB_HINT_MS = 3000;
export const PRACTICE_INTRO_MS = 2600;
export const BLOCK_INTRO_MS = 2400;
/** The break between blocks lasts at least this long; then a tap on the play button continues. */
export const BREAK_MIN_MS = 4000;
/** Practice: two fireflies and two moths, fixed order and lanterns, task timing, never recorded. */
export const PRACTICE: ReadonlyArray<{ type: "go" | "nogo"; lantern: number }> = [
  { type: "go", lantern: 1 },
  { type: "nogo", lantern: 0 },
  { type: "go", lantern: 2 },
  { type: "nogo", lantern: 1 },
];

export type RunState = "intro" | "calib-intro" | "calib" | "practice-intro" | "practice" | "block-intro" | "trials" | "break" | "done";
export type Phase = "calibration" | "practice" | "task";

export interface ActiveTrial {
  phase: Phase;
  type: TrialType;
  block: number;
  lantern: number;
  isiMs: number;
  /** Index within its phase (calibration 0..n-1, practice 0..3, task 0..blocks*trials-1). */
  taskIndex: number;
  onset: number | null;
  hiddenAt: number | null;
  responded: boolean;
  rtMs: number | null;
  x: number;
  y: number;
}

export interface RunData {
  trials: Trial[];
  off_target_taps: OffTargetTap[];
  /** Session-relative end time: from the first measured frame (t0) to the done frame. */
  duration_ms: number;
  /** Frame timestamp of the session start (page time origin), for started_at. */
  t0: number;
}

export interface RunnerConfig {
  task: TaskConfig;
  seed: number;
  anticipationMs: number | null;
}

export interface RunnerHooks {
  onState?: (s: RunState, ts: number) => void;
  /** Inside frame(ts): draw the stimulus now; ts is its onset. */
  onStimulus?: (ts: number, trial: ActiveTrial) => void;
  onHide?: (ts: number, trial: ActiveTrial) => void;
  /** The first on-target tap of a trial (hit, commission or calibration tap). */
  onResponse?: (tMs: number, trial: ActiveTrial) => void;
  /** A calibration firefly has waited CALIB_HINT_MS. */
  onHint?: (ts: number, trial: ActiveTrial) => void;
  onBreakReady?: (ts: number) => void;
  onComplete?: (data: RunData) => void;
}

export type TapKind = "start" | "response" | "off-target" | "continue" | "ignored";

export class LanternWatchRunner {
  state: RunState = "intro";
  private readonly task: TaskConfig;
  private readonly anticipationMs: number | null;
  private readonly hooks: RunnerHooks;
  private readonly calib: CalibrationTrial[];
  private readonly schedule: ScheduledTrial[];
  private readonly records: Trial[] = [];
  private readonly offTarget: OffTargetTap[] = [];
  private startRequested = false;
  private continueRequested = false;
  private breakReady = false;
  private hinted = false;
  private t0 = 0;
  private since = 0;
  private idx = -1;
  private block = 0;
  private cur: ActiveTrial | null = null;

  constructor(cfg: RunnerConfig, hooks: RunnerHooks = {}) {
    this.task = cfg.task;
    this.anticipationMs = cfg.anticipationMs;
    this.hooks = hooks;
    this.calib = buildCalibrationSchedule(cfg.task, cfg.seed);
    this.schedule = buildSchedule(cfg.task, cfg.seed);
  }

  /** Frame timestamp at which the current state began (animation only). */
  get stateStartMs(): number {
    return this.since;
  }

  /** Index of the block now running or about to start (0-based). */
  get blockIndex(): number {
    return this.block;
  }

  current(): ActiveTrial | null {
    return this.cur;
  }

  private measured(): boolean {
    return this.state === "calib" || this.state === "trials";
  }

  pointerDown(tMs: number, x: number, y: number, lantern: number | null): TapKind {
    switch (this.state) {
      case "intro":
        if (this.startRequested) return "ignored";
        this.startRequested = true;
        return "start";
      case "break":
        if (this.continueRequested || tMs - this.since < BREAK_MIN_MS) return "ignored";
        this.continueRequested = true;
        return "continue";
      case "calib":
      case "practice":
      case "trials": {
        const c = this.cur;
        if (c && c.onset !== null && tMs >= c.onset && !c.responded && lantern === c.lantern) {
          const inWindow = c.phase === "calibration" || tMs < c.onset + this.task.stimulusMs + c.isiMs;
          if (inWindow) {
            c.responded = true;
            c.rtMs = tMs - c.onset;
            c.x = x;
            c.y = y;
            this.hooks.onResponse?.(tMs, c);
            return "response";
          }
        }
        if (this.measured() && tMs >= this.t0) {
          const visible = !!c && c.onset !== null && tMs >= c.onset && (c.hiddenAt === null || tMs < c.hiddenAt);
          this.offTarget.push({ t_ms: tMs - this.t0, during: visible ? "stimulus" : "isi" });
          return "off-target";
        }
        return "ignored";
      }
      default:
        return "ignored";
    }
  }

  frame(ts: number): void {
    switch (this.state) {
      case "intro":
        if (this.startRequested) {
          this.t0 = ts;
          this.setState("calib-intro", ts);
        }
        return;
      case "calib-intro":
        if (ts - this.since >= CALIB_INTRO_MS) {
          this.idx = -1;
          this.setState("calib", ts);
          this.nextCalibration(ts);
        }
        return;
      case "calib":
        this.frameCalibration(ts);
        return;
      case "practice-intro":
        if (ts - this.since >= PRACTICE_INTRO_MS) {
          this.idx = -1;
          this.setState("practice", ts);
          this.nextTimed(ts);
        }
        return;
      case "block-intro":
        if (ts - this.since >= BLOCK_INTRO_MS) {
          this.setState("trials", ts);
          this.nextTimed(ts);
        }
        return;
      case "practice":
      case "trials":
        this.frameTimed(ts);
        return;
      case "break":
        if (!this.breakReady && ts - this.since >= BREAK_MIN_MS) {
          this.breakReady = true;
          this.hooks.onBreakReady?.(ts);
        }
        if (this.continueRequested) {
          this.block += 1;
          this.setState("block-intro", ts);
        }
        return;
      default:
        return;
    }
  }

  private setState(s: RunState, ts: number) {
    this.state = s;
    this.since = ts;
    this.hooks.onState?.(s, ts);
  }

  // ---- calibration: dark ISI, then the firefly stays lit until tapped ----
  private nextCalibration(ts: number) {
    this.idx += 1;
    const c = this.calib[this.idx];
    if (!c) {
      this.cur = null;
      this.setState("practice-intro", ts);
      return;
    }
    this.hinted = false;
    this.cur = this.makeTrial("calibration", "calibration", 0, c.lantern, c.isiMs, this.idx);
    this.since = ts; // start of the dark interval
  }

  private frameCalibration(ts: number) {
    const c = this.cur;
    if (!c) return;
    if (c.onset === null) {
      if (ts - this.since >= c.isiMs) this.show(c, ts);
      return;
    }
    if (c.responded) {
      this.hide(c, ts);
      this.record(c);
      this.nextCalibration(ts);
      return;
    }
    if (!this.hinted && ts - c.onset >= CALIB_HINT_MS) {
      this.hinted = true;
      this.hooks.onHint?.(ts, c);
    }
  }

  // ---- practice and task: stimulus for stimulusMs, response window stimulus + ISI ----
  private nextTimed(ts: number) {
    this.idx += 1;
    if (this.state === "practice") {
      const p = PRACTICE[this.idx];
      if (!p) {
        this.cur = null;
        this.idx = -1;
        this.block = 0;
        this.setState("block-intro", ts);
        return;
      }
      const isiMs = (this.task.isiMsMin + this.task.isiMsMax) / 2;
      this.cur = this.makeTrial("practice", p.type, 0, p.lantern, isiMs, this.idx);
      this.show(this.cur, ts);
      return;
    }
    const s = this.schedule[this.idx];
    if (!s || s.block !== this.block) {
      this.idx -= 1; // stays on the last trial of the block; the next block starts after the break
      this.cur = null;
      if (s) {
        this.breakReady = false;
        this.continueRequested = false;
        this.setState("break", ts);
      } else {
        this.setState("done", ts);
        this.hooks.onComplete?.({
          trials: this.records,
          off_target_taps: this.offTarget,
          duration_ms: ts - this.t0,
          t0: this.t0,
        });
      }
      return;
    }
    this.cur = this.makeTrial("task", s.type, s.block, s.lantern, s.isiMs, this.idx);
    this.show(this.cur, ts);
  }

  private frameTimed(ts: number) {
    const c = this.cur;
    if (!c || c.onset === null) return;
    if (c.hiddenAt === null && ts - c.onset >= this.task.stimulusMs) this.hide(c, ts);
    if (ts - c.onset >= this.task.stimulusMs + c.isiMs) {
      if (c.phase === "task") this.record(c);
      this.nextTimed(ts);
    }
  }

  private makeTrial(phase: Phase, type: TrialType, block: number, lantern: number, isiMs: number, taskIndex: number): ActiveTrial {
    return { phase, type, block, lantern, isiMs, taskIndex, onset: null, hiddenAt: null, responded: false, rtMs: null, x: 0, y: 0 };
  }

  private show(c: ActiveTrial, ts: number) {
    c.onset = ts;
    this.hooks.onStimulus?.(ts, c);
  }

  private hide(c: ActiveTrial, ts: number) {
    if (c.hiddenAt !== null) return;
    c.hiddenAt = ts;
    this.hooks.onHide?.(ts, c);
  }

  private record(c: ActiveTrial) {
    const onset = c.onset as number;
    this.records.push({
      i: this.records.length,
      block: c.block,
      type: c.type,
      stimulus_onset_ms: onset - this.t0,
      responded: c.responded,
      rt_ms: c.responded ? c.rtMs : null,
      outcome: classify(c.type, c.responded, c.rtMs, this.anticipationMs),
      // Contract fields are required; a trial with no response uses 0, 0 (the convention of
      // packages/contracts/src/fixtures/session-metrics.valid.ts). x, y: CSS px from the game's top-left.
      x: c.responded ? c.x : 0,
      y: c.responded ? c.y : 0,
    });
  }
}
