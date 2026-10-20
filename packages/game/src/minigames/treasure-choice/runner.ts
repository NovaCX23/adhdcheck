// Choice runner: the render-loop wiring around logic.ts, with no rendering and no DOM, so it is unit-tested.
// The scene calls frame(ts) at the top of every requestAnimationFrame callback, BEFORE it renders, with the
// callback timestamp. The offer is switched on inside frame(ts), and onOffer() makes the options visible there,
// so the render call of that same callback is the first to draw them and ts is the offer onset (research/03
// section 2, method 4, as in Bridge Wait). pointerDown() takes the pointerdown event.timeStamp.
//
// Constant time (FR-63): the gems come preDelay after the choosing tap and the choice ends slotMs after that same
// tap, for either option. Only the child's own decision time and the frame grid can change the session length.
import { GEMS_LATER, GEMS_NOW, LATER_DELAY_MS, NOW_DELAY_MS, N_CHOICES, PRACTICE_CHOICES, SLOT_MS, buildSchedule, classifyTap, preDelayMs, summarise } from "./logic";
import type { Choice, ChoiceRecord, ChoiceTap, ScheduledChoice, TreasureChoiceResult } from "./types";

// TODO: design choices, no sourced values (NOTES.md).
export const PRACTICE_INTRO_MS = 2500;
export const CHEST_MS = 1500;
export const BETWEEN_MS = 2200;
export const RESULT_VERSION = "0.1.0";

export type RunState = "intro" | "practice-intro" | "chest" | "offer" | "wait" | "rest" | "between" | "done";

export interface QueueItem {
  sched: ScheduledChoice;
  practice: boolean;
}

export interface RunnerConfig {
  seed: number;
  /** Number of scored choices. Default 10 (research/04). Other values are for dev runs only. */
  choices?: number;
}

export interface RunnerHooks {
  onState?: (s: RunState, ts: number, item: QueueItem | undefined) => void;
  /** Called inside frame(ts) when the offer opens: make both options visible here. */
  onOffer?: (ts: number, item: QueueItem) => void;
  onChoice?: (choice: Choice, tMs: number, item: QueueItem) => void;
  /** Called inside frame(ts) when the gems are due. */
  onReward?: (ts: number, item: QueueItem, choice: Choice) => void;
  onComplete?: (result: TreasureChoiceResult) => void;
}

export type TapKind = "start" | "choice" | "recorded" | "ignored";

export class TreasureChoiceRunner {
  state: RunState = "intro";
  readonly queue: QueueItem[];
  private readonly nScored: number;
  private readonly seed: number;
  private readonly hooks: RunnerHooks;
  private readonly records: ChoiceRecord[] = [];
  private startRequested = false;
  private idx = -1;
  private t0 = 0;
  private stateSince = 0;
  private taps: number[] = [];
  private chestStartMs = 0;
  private offerOnsetMs = 0;
  private choice: Choice | null = null;
  private choiceMs = 0;
  private rewardMs = 0;

  constructor(cfg: RunnerConfig, hooks: RunnerHooks = {}) {
    this.seed = cfg.seed;
    this.nScored = cfg.choices ?? N_CHOICES;
    this.hooks = hooks;
    const forced: Choice[] = ["now", "later"];
    const practice = buildSchedule({ seed: (cfg.seed ^ 0x5bd1e995) >>> 0, count: PRACTICE_CHOICES }).map((sched, k) => ({
      sched: { ...sched, only: forced[k % 2] as Choice },
      practice: true,
    }));
    this.queue = [...practice, ...buildSchedule({ seed: cfg.seed, count: this.nScored }).map((sched) => ({ sched, practice: false }))];
  }

  current(): QueueItem | undefined {
    return this.queue[this.idx];
  }

  /** Frame timestamp at which the current state began (for animation only). */
  get stateStartMs(): number {
    return this.stateSince;
  }

  /** The option chosen in the current choice, once made. */
  get chosen(): Choice | null {
    return this.choice;
  }

  /** side: the option under the pointer, or null for a tap on neither. tMs: pointerdown event.timeStamp. */
  pointerDown(tMs: number, side: Choice | null): TapKind {
    if (this.state === "intro") {
      if (this.startRequested) return "ignored";
      this.startRequested = true;
      return "start";
    }
    if (this.state !== "chest" && this.state !== "offer" && this.state !== "wait" && this.state !== "rest") return "ignored";
    const item = this.current();
    if (
      this.state === "offer" &&
      this.choice === null &&
      item &&
      side !== null &&
      tMs >= this.offerOnsetMs && // a tap stamped before the frame that drew the options is not a choice
      (item.sched.only === undefined || item.sched.only === side)
    ) {
      this.choice = side;
      this.choiceMs = tMs;
      this.hooks.onChoice?.(side, tMs, item);
      return "choice";
    }
    this.taps.push(tMs);
    return "recorded";
  }

  frame(ts: number): void {
    const item = this.current();
    switch (this.state) {
      case "intro":
        if (this.startRequested) {
          this.t0 = ts;
          this.setState("practice-intro", ts);
        }
        return;
      case "practice-intro":
        if (ts - this.stateSince >= PRACTICE_INTRO_MS) this.next(ts);
        return;
      case "chest":
        if (item && ts - this.stateSince >= CHEST_MS) {
          this.offerOnsetMs = ts;
          this.hooks.onOffer?.(ts, item);
          this.setState("offer", ts);
        }
        return;
      case "offer":
        if (this.choice !== null) this.setState("wait", ts);
        return;
      case "wait":
        if (item && this.choice && ts - this.choiceMs >= preDelayMs(this.choice, item.sched)) {
          this.rewardMs = ts;
          this.hooks.onReward?.(ts, item, this.choice);
          this.setState("rest", ts);
        }
        return;
      case "rest":
        if (item && ts - this.choiceMs >= item.sched.slotMs) this.finish(ts);
        return;
      case "between":
        if (ts - this.stateSince >= BETWEEN_MS) this.next(ts);
        return;
      default:
        return;
    }
  }

  private setState(s: RunState, ts: number) {
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
    this.choice = null;
    this.chestStartMs = ts;
    this.setState("chest", ts);
  }

  private finish(ts: number) {
    const item = this.current();
    const choice = this.choice;
    if (!item || !choice) return;
    if (!item.practice) {
      const bounds = {
        chestStartMs: this.chestStartMs,
        offerOnsetMs: this.offerOnsetMs,
        choiceMs: this.choiceMs,
        rewardMs: this.rewardMs,
        slotEndMs: ts,
      };
      const taps: ChoiceTap[] = [...this.taps]
        .sort((a, b) => a - b)
        .map((t) => ({ tMs: t - this.t0, phase: classifyTap(t, bounds) }));
      const rel = (x: number) => x - this.t0;
      this.records.push({
        i: item.sched.i,
        choice,
        delayChosenMs: preDelayMs(choice, item.sched),
        delayOfferedMs: item.sched.laterDelayMs,
        gems: choice === "now" ? GEMS_NOW : GEMS_LATER,
        offerOnsetMs: rel(this.offerOnsetMs),
        choiceMs: rel(this.choiceMs),
        decisionMs: this.choiceMs - this.offerOnsetMs,
        rewardMs: rel(this.rewardMs),
        slotEndMs: rel(ts),
        taps,
        waitTaps: taps.filter((t) => t.phase === "wait").length,
        restTaps: taps.filter((t) => t.phase === "rest").length,
        offTargetTaps: taps.filter((t) => t.phase === "offer").length,
      });
    }
    const following = this.queue[this.idx + 1];
    if (following && item.practice && !following.practice) this.setState("between", ts);
    else this.next(ts);
  }

  private buildResult(): TreasureChoiceResult {
    return {
      id: "treasure-choice",
      version: RESULT_VERSION,
      params: {
        n_choices: this.nScored,
        gems_now: GEMS_NOW,
        gems_later: GEMS_LATER,
        now_delay_ms: NOW_DELAY_MS,
        later_delay_ms: LATER_DELAY_MS,
        slot_ms: SLOT_MS,
        chest_ms: CHEST_MS,
        practice_choices: PRACTICE_CHOICES,
        seed: this.seed,
      },
      trials: this.records,
      summary: summarise(this.records),
    };
  }
}
