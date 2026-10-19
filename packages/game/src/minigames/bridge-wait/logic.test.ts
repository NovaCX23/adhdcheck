import { describe, expect, it } from "vitest";
import { buildSchedule, classifyTap, classifyTrial, summarise } from "./logic";
import type { TrialRecord, TrialTiming } from "./types";

const timing: TrialTiming = {
  narrationStartMs: 1000,
  narrationEndMs: 3000,
  chimeOnsetMs: 5000,
  windowEndMs: 7000,
};

describe("buildSchedule", () => {
  it("makes 24 trials with waits uniformly drawn in [1500, 4000] ms", () => {
    const s = buildSchedule({ seed: 1, count: 24 });
    expect(s).toHaveLength(24);
    for (const t of s) {
      expect(t.waitMs).toBeGreaterThanOrEqual(1500);
      expect(t.waitMs).toBeLessThanOrEqual(4000);
    }
    expect(new Set(s.map((t) => t.waitMs)).size).toBeGreaterThan(12);
  });
  it("is reproducible from a seed and differs for another seed", () => {
    expect(buildSchedule({ seed: 42, count: 24 })).toEqual(buildSchedule({ seed: 42, count: 24 }));
    expect(buildSchedule({ seed: 42, count: 24 })).not.toEqual(buildSchedule({ seed: 43, count: 24 }));
  });
  it("has no stop trials by default, and a fixed 25 percent (6 of 24) when enabled", () => {
    expect(buildSchedule({ seed: 5, count: 24 }).some((t) => t.stopTrial)).toBe(false);
    const s = buildSchedule({ seed: 5, count: 24, stopSignal: true });
    expect(s.filter((t) => t.stopTrial)).toHaveLength(6);
  });
});

describe("classifyTap phase boundaries", () => {
  it("narration start is narration, narration end is waiting", () => {
    expect(classifyTap(1000, timing)).toBe("narration");
    expect(classifyTap(2999, timing)).toBe("narration");
    expect(classifyTap(3000, timing)).toBe("waiting");
  });
  it("1 ms before the chime is premature, exactly at the chime is go-window", () => {
    expect(classifyTap(4999, timing)).toBe("waiting");
    expect(classifyTap(5000, timing)).toBe("go-window");
    expect(classifyTap(6999, timing)).toBe("go-window");
    expect(classifyTap(7000, timing)).toBe("after");
  });
  it("a tap before the trial starts is not part of the trial", () => {
    expect(classifyTap(999, timing)).toBe("before");
  });
});

describe("classifyTrial", () => {
  it("valid cross: RT from chime onset of the first go-window tap", () => {
    const r = classifyTrial(timing, [5420, 5900]);
    expect(r.outcome).toBe("valid");
    expect(r.rtMs).toBe(420);
    expect(r.prematureTaps).toBe(0);
    expect(r.intrusionTaps).toBe(0);
  });
  it("counts intrusion and premature taps separately and still scores a later valid cross", () => {
    const r = classifyTrial(timing, [1500, 2500, 3500, 4999, 5300]);
    expect(r.intrusionTaps).toBe(2);
    expect(r.prematureTaps).toBe(2);
    expect(r.outcome).toBe("valid");
    expect(r.rtMs).toBe(300);
  });
  it("no tap in the window is a timeout with no RT", () => {
    const r = classifyTrial(timing, [3200]);
    expect(r.outcome).toBe("no_response");
    expect(r.rtMs).toBeNull();
    expect(r.prematureTaps).toBe(1);
  });
  it("on a stop trial a tap at or after the crow is a stop failure, before it is valid", () => {
    const t = { ...timing, crowOnsetMs: 5500 };
    expect(classifyTrial(t, [5300]).outcome).toBe("valid");
    expect(classifyTrial(t, [5500]).outcome).toBe("stop_failure");
    expect(classifyTrial(t, []).outcome).toBe("stop_success");
  });
});

function rec(over: Partial<TrialRecord>): TrialRecord {
  return {
    i: 0,
    waitMs: 2000,
    narrationOnsetMs: 0,
    chimeOnsetMs: 1,
    taps: [],
    outcome: "valid",
    rtMs: 400,
    prematureTaps: 0,
    intrusionTaps: 0,
    stopTrial: false,
    ...over,
  };
}

describe("summarise", () => {
  it("computes premature rate, intrusion count, median and SD of valid RT", () => {
    const trials = [
      rec({ rtMs: 400 }),
      rec({ rtMs: 500, prematureTaps: 2, intrusionTaps: 1 }),
      rec({ rtMs: 600 }),
      rec({ outcome: "no_response", rtMs: null, prematureTaps: 1 }),
    ];
    const s = summarise(trials);
    expect(s.nTrials).toBe(4);
    expect(s.nValid).toBe(3);
    expect(s.prematureTapRate).toBeCloseTo(0.5);
    expect(s.prematureTaps).toBe(3);
    expect(s.intrusionTaps).toBe(1);
    expect(s.medianValidRtMs).toBe(500);
    expect(s.sdValidRtMs).toBeCloseTo(100);
  });
  it("gives null RT statistics when there is no valid trial, and SD null with one", () => {
    expect(summarise([rec({ outcome: "no_response", rtMs: null })]).medianValidRtMs).toBeNull();
    expect(summarise([rec({ rtMs: 400 })]).sdValidRtMs).toBeNull();
  });
});
