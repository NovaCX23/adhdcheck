import { describe, expect, it } from "vitest";
import { BridgeWaitRunner, NARRATION_MS, type RunState } from "./runner";
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
    for (let k = 0; k < max && !pred(); k++) step();
    if (!pred()) throw new Error(`state never reached, now ${r.state}`);
  };
  return { r, cues, states, step, until, now: () => ts, result: () => result };
}

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

  it("ignores taps in intro after start, in the practice intro and after the end", () => {
    const { r, step, until } = setup(1);
    r.pointerDown(1001);
    expect(r.pointerDown(1002)).toBe("ignored");
    step();
    expect(r.pointerDown(1030)).toBe("ignored");
    until(() => r.state === "done", 100_000);
    expect(r.pointerDown(999_999)).toBe("ignored");
  });
});
