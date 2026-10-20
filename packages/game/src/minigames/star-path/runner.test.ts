import { describe, expect, it, vi } from "vitest";
import { STAR_INTERVAL_MS } from "./logic";
import { FEEDBACK_MS, LEAD_MS, RECALL_TIMEOUT_MS, STAR_ON_MS, StarPathRunner, type Current } from "./runner";
import type { StarPathResult } from "./types";

// Drives frames every 16 ms from `from` until `until(ts)` is true (or a safety limit).
function run(r: StarPathRunner, from: number, until: (ts: number) => boolean, limitMs = 120_000): number {
  let ts = from;
  while (!until(ts) && ts < from + limitMs) {
    ts += 16;
    r.frame(ts);
  }
  return ts;
}

function setup(seed = 3) {
  const onStarOn = vi.fn<(ts: number, star: number, pos: number) => void>();
  const onComplete = vi.fn<(r: StarPathResult) => void>();
  const r = new StarPathRunner({ seed }, { onStarOn, onComplete });
  return { r, onStarOn, onComplete };
}

// Start, then let the practice sequence play and answer it correctly; returns the time after it.
function passPractice(r: StarPathRunner): number {
  expect(r.pointerDown(100, null)).toBe("start");
  let ts = run(r, 100, () => r.state === "recall");
  const practice = r.current() as Current;
  expect(practice.practice).toBe(true);
  for (const star of practice.sequence) {
    ts += 300;
    r.pointerDown(ts, star);
  }
  return run(r, ts, () => r.state === "present" && !(r.current() as Current).practice);
}

// Taps the stars 300 ms apart, then runs frames until recall has closed.
function answer(r: StarPathRunner, ts: number, stars: (number | null)[]): number {
  for (const star of stars) {
    ts += 300;
    r.pointerDown(ts, star);
  }
  return run(r, ts, () => r.state !== "recall");
}

// Answers two sequences with a wrong first star, waiting for each to be shown; ends the game at length L.
function failTwice(r: StarPathRunner, ts: number): number {
  for (let k = 0; k < 2; k++) {
    ts = run(r, ts, () => r.state === "recall");
    const seq = (r.current() as Current).sequence;
    r.pointerDown(ts + 100, [0, 1, 2, 3].find((s) => s !== seq[0]) as number);
    ts = run(r, ts + 100, () => r.state === "present" || r.state === "done");
  }
  return ts;
}

describe("StarPathRunner", () => {
  it("lights one star per 1000 ms, each onset being the frame time that draws it", () => {
    const { r, onStarOn } = setup();
    r.pointerDown(100, null);
    run(r, 100, () => r.state === "recall");
    const onsets = onStarOn.mock.calls.map(([ts]) => ts);
    expect(onsets).toHaveLength(2); // practice sequence, length 2
    const gap = (onsets[1] as number) - (onsets[0] as number);
    expect(gap).toBeGreaterThanOrEqual(STAR_INTERVAL_MS);
    expect(gap).toBeLessThan(STAR_INTERVAL_MS + 16);
    expect((onsets[0] as number) % 16).toBe(100 % 16); // a frame timestamp, not a computed one
  });

  it("does not record the practice sequence, then starts the real ones at length 2", () => {
    const { r } = setup();
    passPractice(r);
    expect((r.current() as Current).length).toBe(2);
  });

  it("goes one longer after a correct sequence", () => {
    const { r } = setup();
    let ts = passPractice(r);
    ts = run(r, ts, () => r.state === "recall");
    ts = answer(r, ts, (r.current() as Current).sequence);
    run(r, ts, () => r.state === "present");
    expect((r.current() as Current).length).toBe(3);
  });

  it("stops after two failures at one length and reports span and errors", () => {
    const { r, onComplete } = setup();
    let ts = passPractice(r);
    for (let k = 0; k < 2; k++) {
      ts = run(r, ts, () => r.state === "recall");
      const seq = (r.current() as Current).sequence;
      const wrong = [0, 1, 2, 3].find((s) => s !== seq[0]) as number;
      expect(r.pointerDown(ts + 200, wrong)).toBe("wrong");
      ts = run(r, ts + 200, () => r.state === "present" || r.state === "done");
    }
    expect(r.state).toBe("done");
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]?.[0] as StarPathResult;
    expect(result.summary).toEqual({ span: 0, errors: 2, nSequences: 2, earlyTaps: 0, offTargetTaps: 0 });
    expect(result.trials.map((t) => t.outcome)).toEqual(["error", "error"]);
    expect(result.trials[0]?.firstErrorAt).toBe(0);
    expect(result.motion).toBeNull();
  });

  it("counts taps while the stars are shown as early taps, without judging them", () => {
    const { r, onComplete } = setup();
    let ts = passPractice(r);
    expect(r.pointerDown(ts + 5, 0)).toBe("early");
    ts = run(r, ts + 5, () => r.state === "recall");
    ts = answer(r, ts, (r.current() as Current).sequence);
    failTwice(r, ts);
    const result = onComplete.mock.calls[0]?.[0] as StarPathResult;
    expect(result.trials[0]?.earlyTaps).toBe(1);
    expect(result.trials[0]?.outcome).toBe("correct");
    expect(result.summary.span).toBe(2);
  });

  it("ignores a tap on no star in recall but records it", () => {
    const { r, onComplete } = setup();
    let ts = passPractice(r);
    ts = run(r, ts, () => r.state === "recall");
    expect(r.pointerDown(ts + 50, null)).toBe("off");
    ts = answer(r, ts + 50, (r.current() as Current).sequence);
    failTwice(r, ts);
    const result = onComplete.mock.calls[0]?.[0] as StarPathResult;
    expect(result.trials[0]?.offTargetTaps).toBe(1);
    expect(result.trials[0]?.outcome).toBe("correct");
  });

  it("ends a sequence as timeout after a long pause without a tap", () => {
    const { r } = setup();
    let ts = passPractice(r);
    ts = run(r, ts, () => r.state === "recall");
    const opened = ts;
    ts = run(r, ts, () => r.state === "feedback");
    expect(ts - opened).toBeGreaterThanOrEqual(RECALL_TIMEOUT_MS);
    expect(ts - opened).toBeLessThan(RECALL_TIMEOUT_MS + 32);
  });

  it("stores times relative to the start tap, and recall times from the recall start", () => {
    const { r, onComplete } = setup();
    let ts = passPractice(r);
    ts = run(r, ts, () => r.state === "recall");
    const seq = (r.current() as Current).sequence;
    ts = answer(r, ts, seq);
    failTwice(r, ts);
    const first = (onComplete.mock.calls[0]?.[0] as StarPathResult).trials[0];
    expect(first?.firstTapRtMs).toBe(300);
    expect(first?.recallMs).toBe(300 * seq.length);
    expect(first?.starOnsetsMs).toHaveLength(2);
    expect((first?.starOnsetsMs[0] as number) > 0).toBe(true);
    expect(first?.taps.every((t) => t.phase === "recall")).toBe(true);
  });

  it("keeps each star lit for STAR_ON_MS and waits LEAD_MS before the first", () => {
    const onStarOff = vi.fn<(ts: number, star: number) => void>();
    const onStarOn = vi.fn<(ts: number, star: number, pos: number) => void>();
    const r = new StarPathRunner({ seed: 1 }, { onStarOn, onStarOff });
    r.pointerDown(100, null);
    let presentAt = -1;
    run(r, 100, (ts) => {
      if (r.state === "present" && presentAt < 0) presentAt = ts;
      return r.state === "recall";
    });
    const on = onStarOn.mock.calls.map(([ts]) => ts);
    const off = onStarOff.mock.calls.map(([ts]) => ts);
    expect((on[0] as number) - presentAt).toBeGreaterThanOrEqual(LEAD_MS);
    expect((off[0] as number) - (on[0] as number)).toBeGreaterThanOrEqual(STAR_ON_MS);
    expect((off[0] as number) - (on[0] as number)).toBeLessThan(STAR_ON_MS + 16);
    expect(FEEDBACK_MS).toBeGreaterThan(0);
  });
});
