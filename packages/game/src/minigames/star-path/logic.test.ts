import { describe, expect, it } from "vitest";
import { mulberry32 } from "../bridge-wait/logic";
import { START_LENGTH, buildSequence, judgeTap, nextStep, summarise } from "./logic";
import type { SequenceRecord } from "./types";

describe("buildSequence", () => {
  it("picks distinct stars, as many as the length", () => {
    const rnd = mulberry32(7);
    for (let length = 2; length <= 9; length++) {
      const seq = buildSequence(rnd, length, 9);
      expect(seq).toHaveLength(length);
      expect(new Set(seq).size).toBe(length);
      for (const s of seq) expect(s >= 0 && s < 9).toBe(true);
    }
  });

  it("is reproducible from the seed", () => {
    expect(buildSequence(mulberry32(42), 5, 9)).toEqual(buildSequence(mulberry32(42), 5, 9));
    expect(buildSequence(mulberry32(42), 5, 9)).not.toEqual(buildSequence(mulberry32(43), 5, 9));
  });
});

describe("nextStep (research/04 section 5: start 2, +1 after a correct sequence, stop after 2 failures at one length)", () => {
  it("starts at length 2", () => {
    expect(START_LENGTH).toBe(2);
  });

  it("goes one longer after a correct sequence and resets the failure count", () => {
    expect(nextStep({ length: 3, failuresAtLength: 1 }, "correct", 9)).toEqual({ done: false, length: 4, failuresAtLength: 0 });
  });

  it("repeats the same length after a first failure", () => {
    expect(nextStep({ length: 3, failuresAtLength: 0 }, "error", 9)).toEqual({ done: false, length: 3, failuresAtLength: 1 });
    expect(nextStep({ length: 3, failuresAtLength: 0 }, "timeout", 9)).toEqual({ done: false, length: 3, failuresAtLength: 1 });
  });

  it("stops after the second failure at one length", () => {
    expect(nextStep({ length: 3, failuresAtLength: 1 }, "error", 9).done).toBe(true);
  });

  it("stops after a correct sequence at the longest length (all stars)", () => {
    expect(nextStep({ length: 9, failuresAtLength: 0 }, "correct", 9).done).toBe(true);
  });
});

describe("judgeTap", () => {
  it("accepts the next star of the sequence and finishes on the last one", () => {
    expect(judgeTap([4, 1, 7], 0, 4)).toBe("next");
    expect(judgeTap([4, 1, 7], 1, 1)).toBe("next");
    expect(judgeTap([4, 1, 7], 2, 7)).toBe("complete");
  });

  it("ends the sequence on a wrong star", () => {
    expect(judgeTap([4, 1, 7], 1, 4)).toBe("wrong");
  });

  it("ignores a tap that hits no star", () => {
    expect(judgeTap([4, 1, 7], 0, null)).toBe("off");
  });
});

function record(length: number, outcome: SequenceRecord["outcome"], extra: Partial<SequenceRecord> = {}): SequenceRecord {
  return {
    i: 0,
    length,
    sequence: Array.from({ length }, (_, k) => k),
    starOnsetsMs: [],
    recallStartMs: 0,
    taps: [],
    outcome,
    firstErrorAt: outcome === "error" ? 0 : null,
    firstTapRtMs: null,
    recallMs: null,
    earlyTaps: 0,
    offTargetTaps: 0,
    ...extra,
  };
}

describe("summarise", () => {
  it("span is the longest correctly repeated length; errors count failed sequences", () => {
    const s = summarise([
      record(2, "correct"),
      record(3, "correct"),
      record(4, "error", { earlyTaps: 1 }),
      record(4, "correct", { offTargetTaps: 2 }),
      record(5, "error"),
      record(5, "timeout"),
    ]);
    expect(s).toEqual({ span: 4, errors: 3, nSequences: 6, earlyTaps: 1, offTargetTaps: 2 });
  });

  it("span is 0 when no sequence was repeated", () => {
    expect(summarise([record(2, "error"), record(2, "error")]).span).toBe(0);
    expect(summarise([]).span).toBe(0);
  });
});
