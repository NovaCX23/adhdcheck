// Browser only. Phaser touches `window` on load, so it is imported inside mountBridgeWait.
import { Chime } from "./audio";
import { N_TRIALS, PRACTICE_TRIALS, WAIT_MS_MAX, WAIT_MS_MIN, buildSchedule, classifyTrial, summarise } from "./logic";
import { STRINGS } from "./strings";
import type { BridgeWaitResult, ScheduledTrial, TrialRecord, TrialTiming } from "./types";

// TODO: design choices, no sourced values (research/04 section 5 gives only trial count and wait range).
export const NARRATION_MS = 2500;
export const GO_WINDOW_MS = 2000;
export const ITI_MS = 1000;
/** Stop-signal crow delay after the chime. TODO: parameters, design choice (research/04). Flag is OFF by default. */
export const CROW_DELAY_MS = 250;
export const RESULT_VERSION = "0.1.0";

export interface BridgeWaitOptions {
  seed?: number;
  /** Number of scored trials. Default 24 (research/04). Other values are for dev runs only. */
  trials?: number;
  stopSignal?: boolean;
  onComplete?: (result: BridgeWaitResult) => void;
}
export interface BridgeWaitHandle {
  destroy: () => void;
}

type State = "intro" | "narration" | "waiting" | "go" | "iti" | "between" | "done";
interface QueueItem {
  sched: ScheduledTrial;
  practice: boolean;
}

export async function mountBridgeWait(parent: HTMLElement, opts: BridgeWaitOptions = {}): Promise<BridgeWaitHandle> {
  const mod = await import("phaser");
  const Phaser = (mod as unknown as { default?: typeof mod }).default ?? mod;

  const seed = opts.seed ?? Date.now() & 0x7fffffff;
  const nScored = opts.trials ?? N_TRIALS;
  const stopSignal = opts.stopSignal ?? false;
  const queue: QueueItem[] = [
    ...buildSchedule({ seed: (seed ^ 0x5bd1e995) >>> 0, count: PRACTICE_TRIALS }).map((sched) => ({ sched, practice: true })),
    ...buildSchedule({ seed, count: nScored, stopSignal }).map((sched) => ({ sched, practice: false })),
  ];
  const chime = new Chime();
  const records: TrialRecord[] = [];

  class BridgeScene extends Phaser.Scene {
    private state: State = "intro";
    private idx = -1;
    private t0 = 0;
    private stateSince = 0;
    private taps: number[] = [];
    private timing: Partial<TrialTiming> = {};
    private crossed = false;
    private onDown!: (e: PointerEvent) => void;
    private bridge!: Phaser.GameObjects.Rectangle;
    private luma!: Phaser.GameObjects.Container;
    private bubble!: Phaser.GameObjects.Container;
    private bubbleText!: Phaser.GameObjects.Text;
    private crow!: Phaser.GameObjects.Text;

    constructor() {
      super("bridge-wait");
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor("#0b1430");
      this.add.rectangle(100, 330, 200, 60, 0x24365f).setOrigin(0.5);
      this.add.rectangle(width - 100, 330, 200, 60, 0x24365f).setOrigin(0.5);
      this.bridge = this.add.rectangle(width / 2, 330, 400, 24, 0x3a4a73).setOrigin(0.5);
      // Luma: simple shapes only, no external art.
      const body = this.add.circle(0, 0, 22, 0xffd45e);
      const wingL = this.add.ellipse(-20, -8, 22, 12, 0xcfe6ff, 0.8);
      const wingR = this.add.ellipse(20, -8, 22, 12, 0xcfe6ff, 0.8);
      this.luma = this.add.container(110, 290, [wingL, wingR, body]);
      const bg = this.add.rectangle(0, 0, 640, 110, 0xf1f4ff).setOrigin(0.5);
      this.bubbleText = this.add
        .text(0, 0, "", { fontFamily: "sans-serif", fontSize: "30px", color: "#0b1430", align: "center", wordWrap: { width: 600 } })
        .setOrigin(0.5);
      this.bubble = this.add.container(width / 2, 130, [bg, this.bubbleText]).setVisible(false);
      this.crow = this.add
        .text(width / 2, 230, "crow", { fontFamily: "sans-serif", fontSize: "34px", color: "#9aa6c8" })
        .setOrigin(0.5)
        .setVisible(false);
      // Big, calm tap area: the whole lower part of the screen counts (the canvas listener takes any tap).
      this.add.rectangle(width / 2, height - 90, width - 40, 140, 0x1a2a52).setOrigin(0.5);
      this.add
        .text(width / 2, height - 90, "tap here", { fontFamily: "sans-serif", fontSize: "34px", color: "#cfe6ff" })
        .setOrigin(0.5);
      this.setBubble(STRINGS.start);

      this.onDown = (e: PointerEvent) => {
        chime.unlock(); // inside the gesture: required by iOS Safari
        if (this.state === "intro") {
          this.t0 = performance.now();
          this.next(performance.now());
          return;
        }
        if (this.state === "narration" || this.state === "waiting" || this.state === "go" || this.state === "iti") {
          this.taps.push(e.timeStamp); // pointerdown, never click (research/03 section 2)
          if (this.state === "go" && !this.crossed) {
            this.crossed = true;
            this.luma.x = this.scale.width - 110; // same gentle feedback for every first go-window tap
            this.setBubble(STRINGS.crossed);
          }
        }
      };
      this.game.canvas.style.touchAction = "none";
      this.game.canvas.addEventListener("pointerdown", this.onDown);
      this.events.once("shutdown", () => this.game.canvas.removeEventListener("pointerdown", this.onDown));
    }

    private setBubble(text: string) {
      this.bubbleText.setText(text);
      this.bubble.setVisible(true);
    }

    private setState(s: State, now: number) {
      this.state = s;
      this.stateSince = now;
      parent.dataset.phase = s;
    }

    private next(now: number) {
      this.idx += 1;
      const item = queue[this.idx];
      if (!item) {
        this.setState("done", now);
        this.setBubble(STRINGS.done);
        this.bridge.setFillStyle(0x3a4a73);
        const result: BridgeWaitResult = {
          id: "bridge-wait",
          version: RESULT_VERSION,
          params: {
            n_trials: nScored,
            wait_ms_min: WAIT_MS_MIN,
            wait_ms_max: WAIT_MS_MAX,
            seed,
            practice_trials: PRACTICE_TRIALS,
            narration_ms: NARRATION_MS,
            go_window_ms: GO_WINDOW_MS,
            stop_signal_enabled: stopSignal,
          },
          trials: records,
          summary: summarise(records),
        };
        opts.onComplete?.(result);
        return;
      }
      this.taps = [];
      this.crossed = false;
      this.luma.x = 110;
      this.crow.setVisible(false);
      this.bridge.setFillStyle(0x3a4a73);
      this.timing = { narrationStartMs: now };
      this.setBubble(item.sched.stopTrial ? `${STRINGS.narration} ${STRINGS.crowHint}` : STRINGS.narration);
      this.setState("narration", now);
    }

    private finishTrial(now: number) {
      const item = queue[this.idx];
      if (!item) return;
      const t = this.timing as TrialTiming;
      const c = classifyTrial(t, this.taps);
      if (!item.practice) {
        records.push({
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
      const following = queue[this.idx + 1];
      if (following && item.practice && !following.practice) {
        this.setBubble(STRINGS.realIntro);
        this.setState("between", now);
      } else {
        this.next(now);
      }
    }

    // Phaser calls update from its requestAnimationFrame loop. The cue is applied here and the frame
    // is drawn right after, so performance.now() in this call is the frame that shows the cue.
    update() {
      const now = performance.now();
      const item = queue[this.idx];
      if (!item) return;
      switch (this.state) {
        case "narration":
          if (now - this.stateSince >= NARRATION_MS) {
            this.timing.narrationEndMs = now;
            this.bubble.setVisible(false);
            this.setState("waiting", now);
          }
          break;
        case "waiting":
          if (now - this.stateSince >= item.sched.waitMs) {
            this.bridge.setFillStyle(0xffd45e); // visual cue: works muted
            chime.play();
            this.timing.chimeOnsetMs = now;
            this.timing.windowEndMs = now + GO_WINDOW_MS;
            this.setState("go", now);
          }
          break;
        case "go":
          if (
            item.sched.stopTrial &&
            this.timing.crowOnsetMs === undefined &&
            now - (this.timing.chimeOnsetMs as number) >= CROW_DELAY_MS
          ) {
            this.crow.setVisible(true);
            this.timing.crowOnsetMs = now;
          }
          if (now >= (this.timing.windowEndMs as number)) this.setState("iti", now);
          break;
        case "iti":
          if (now - this.stateSince >= ITI_MS) this.finishTrial(now);
          break;
        case "between":
          if (now - this.stateSince >= 1500) this.next(now);
          break;
        default:
          break;
      }
    }
  }

  parent.dataset.phase = "intro";
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: BridgeScene,
  });

  return {
    destroy: () => {
      chime.close();
      game.destroy(true);
    },
  };
}
