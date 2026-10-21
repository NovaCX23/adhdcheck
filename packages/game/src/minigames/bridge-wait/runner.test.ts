import { describe, expect, it } from "vitest";
import { START_ENABLE_MS } from "../../pointer";
import { BETWEEN_MS, BridgeWaitRunner, NARRATION_MS, PRACTICE_INTRO_MS, type RunState } from "./runner";
import { PRACTICE_TRIALS } from "./logic";
import type { BridgeWaitResult } from "./types";

const FRAME = 16;

function setup(trials = 2) {
  const cues: number[] = [];
  const states: RunState[] = [];
  let result: BridgeWaitResult | null = null;
  const r = new BridgeWaitRunner(
    { seed: 7, trials, stopSignal: false },
    {
      onState: (s) => states.push(s),
      onCue: (ts) => cues.push(ts),
      onComplete: (res) => {
        result = res;
      },
    },
  );
  let ts = 1000;
  const step = () => {
    ts += FRAME;
    r.frame(ts);
    return ts;
  };
  const until = (pred: () => boolean, max = 10_000) => {
    // The instructions wait for a tap (Hatem, 2026-10-21): this child taps "ready" one frame after each appears.
    for (let k = 0; k < max && !pred(); k++) {
      if (r.waitsForReady()) r.ready(ts + 1);
      step();
    }
    if (!pred()) throw new Error(`state never reached, now ${r.state}`);
  };
  return { r, cues, states, step, until, now: () => ts, result: () => result };
}

describe("BridgeWaitRunner instructions wait for the Start button (no timer), then keep their old intro delay", () => {
  it("practice instruction: a tap anywhere does nothing for 60 s; ready leaves only after PRACTICE_INTRO_MS", () => {
    const { r, step, now } = setup();
    r.pointerDown(1001);
    step();
    for (let k = 0; k < 3750; k++) step(); // 60 s
    expect(r.state).toBe("practice-intro");
    expect(r.pointerDown(now() + 1)).toBe("ignored");
    expect(r.ready(now() + 1)).toBe("ready");
    expect(r.ready(now() + 2)).toBe("ignored");
    for (let k = 0; k < (PRACTICE_INTRO_MS - 100) / 16; k++) step();
    expect(r.state).toBe("practice-intro");
    for (let k = 0; k < 20; k++) step();
    expect(r.state).toBe("narration");
  });

  it("I-1: a double tap on 'Tap to start' (60, 120, 250 ms) does not pass the first instruction; a later single tap does", () => {
    const { r, step, now } = setup();
    r.pointerDown(1001);
    step();
    expect(r.state).toBe("practice-intro");
    for (const d of [60, 120, 250]) {
      while (now() < 1001 + d) step();
      expect(r.ready(1001 + d)).toBe("ignored");
    }
    expect(r.canReady(now())).toBe(false);
    while (now() < r.stateStartMs + START_ENABLE_MS + 20) step();
    expect(r.canReady(now())).toBe(true);
    expect(r.ready(now())).toBe("ready");
  });

  it("a ready tap stamped before the instruction appeared does not skip it", () => {
    const { r, step } = setup();
    r.pointerDown(1001);
    step();
    expect(r.ready(r.stateStartMs - 1)).toBe("ignored");
    expect(r.state).toBe("practice-intro");
  });

  it("'Now we cross for real.': waits for the button, then BETWEEN_MS; a double tap (60, 120, 250 ms) is not recorded as a tap of the first scored trial", () => {
    const { r, step, until, now, result } = setup(1);
    r.pointerDown(1001);
    step();
    until(() => r.state === "between");
    for (let k = 0; k < 3750; k++) step();
    expect(r.state).toBe("between");
    const t0 = now() + 1;
    expect(r.ready(t0)).toBe("ready");
    for (const d of [60, 120, 250]) {
      while (now() < t0 + d) step();
      expect(r.pointerDown(t0 + d)).toBe("ignored");
    }
    expect(r.state).toBe("between");
    while (now() < t0 + BETWEEN_MS + 100) step();
    expect(r.state).toBe("narration");
    expect(r.current()?.practice).toBe(false);
    until(() => r.state === "done", 100_000);
    const rec = result()!.trials[0]!;
    expect(rec.intrusionTaps).toBe(0);
    expect(rec.prematureTaps).toBe(0);
  });
});

describe("BridgeWaitRunner (render loop wiring around logic.ts)", () => {
  it("starts on the first tap and opens the practice round in the next frame", () => {
    const { r, step } = setup();
    expect(r.state).toBe("intro");
    expect(r.pointerDown(1001)).toBe("start");
    step();
    expect(r.state).toBe("practice-intro");
  });

  it("records the cue onset as the timestamp of the frame that switches to go", () => {
    const { r, cues, step, until } = setup();
    r.pointerDown(1001);
    step();
    until(() => r.state === "go");
    expect(cues).toHaveLength(1);
    const lastFrame = cues[0] as number;
    // The frame that switched state is the cue frame: one more frame does not move the onset.
    step();
    expect(cues).toEqual([lastFrame]);
  });

  it("classifies intrusion, premature and valid taps in a scored trial and skips practice trials", () => {
    const { r, step, until, now, result } = setup(2);
    r.pointerDown(1001);
    step();
    // Practice trials: let them time out with no tap.
    for (let k = 0; k < PRACTICE_TRIALS; k++) {
      until(() => r.state === "go");
      until(() => r.state !== "go");
    }
    until(() => r.state === "narration" && r.current()?.practice === false);
    const narrationStart = now();
    expect(r.pointerDown(narrationStart + NARRATION_MS / 2)).toBe("recorded"); // intrusion
    until(() => r.state === "waiting");
    expect(r.pointerDown(now() + 1)).toBe("recorded"); // premature
    until(() => r.state === "go");
    const cue = now();
    expect(r.pointerDown(cue + 300)).toBe("cross");
    expect(r.pointerDown(cue + 400)).toBe("recorded"); // second go tap: kept, no second cross
    until(() => r.state === "done");
    const res = result();
    expect(res).not.toBeNull();
    const t0 = (res as unknown as BridgeWaitResult).trials;
    expect(t0).toHaveLength(2);
    const first = t0[0];
    expect(first?.intrusionTaps).toBe(1);
    expect(first?.prematureTaps).toBe(1);
    expect(first?.outcome).toBe("valid");
    expect(first?.rtMs).toBe(300);
    expect(t0[1]?.outcome).toBe("no_response");
    expect((res as unknown as BridgeWaitResult).summary.intrusionTaps).toBe(1);
  });

  it("ignores a second tap in intro, ignores a tap in the practice instruction (only the Start button leaves it), ignores taps after the end", () => {
    const { r, step, until } = setup(1);
    r.pointerDown(1001);
    expect(r.pointerDown(1002)).toBe("ignored");
    step();
    expect(r.pointerDown(1030)).toBe("ignored");
    until(() => r.state === "done", 100_000);
    expect(r.pointerDown(999_999)).toBe("ignored");
  });
});
