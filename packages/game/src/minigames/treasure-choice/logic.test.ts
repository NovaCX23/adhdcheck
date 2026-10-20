import { describe, expect, it } from "vitest";
import {
  LATER_DELAY_MS,
  NOW_DELAY_MS,
  N_CHOICES,
  SLOT_MS,
  buildSchedule,
  classifyTap,
  postDelayMs,
  preDelayMs,
  summarise,
} from "./logic";
import type { ChoiceRecord } from "./types";

function rec(over: Partial<ChoiceRecord>): ChoiceRecord {
  return {
    i: 0,
    choice: "now",
    delayChosenMs: NOW_DELAY_MS,
    delayOfferedMs: LATER_DELAY_MS,
    gems: 1,
    offerOnsetMs: 0,
    choiceMs: 0,
    decisionMs: 0,
    rewardMs: 0,
    slotEndMs: 0,
    taps: [],
    waitTaps: 0,
    restTaps: 0,
    offTargetTaps: 0,
    ...over,
  };
}

describe("Treasure Choice schedule", () => {
  it("has ten choices by default (research/04 section 5)", () => {
    expect(N_CHOICES).toBe(10);
    expect(buildSchedule({ seed: 1, count: N_CHOICES })).toHaveLength(10);
  });

  it("is reproducible from the seed and differs between seeds (cosmetic gem colour only)", () => {
    const a = buildSchedule({ seed: 42, count: 10 });
    expect(buildSchedule({ seed: 42, count: 10 })).toEqual(a);
    expect(buildSchedule({ seed: 43, count: 10 }).map((c) => c.gemHue)).not.toEqual(a.map((c) => c.gemHue));
  });

  it("offers the same delays on every choice, with the slot equal to the sum of both delays (MIDA)", () => {
    for (const c of buildSchedule({ seed: 5, count: 10 })) {
      expect(c.nowDelayMs).toBe(NOW_DELAY_MS);
      expect(c.laterDelayMs).toBe(LATER_DELAY_MS);
      expect(c.slotMs).toBe(NOW_DELAY_MS + LATER_DELAY_MS);
      expect(c.slotMs).toBe(SLOT_MS);
      expect(c.laterDelayMs).toBeGreaterThan(c.nowDelayMs);
    }
  });
});

describe("constant-time rule", () => {
  it("fills the time after an immediate choice so that both options take the same slot", () => {
    const c = buildSchedule({ seed: 3, count: 1 })[0]!;
    expect(preDelayMs("now", c) + postDelayMs("now", c)).toBe(c.slotMs);
    expect(preDelayMs("later", c) + postDelayMs("later", c)).toBe(c.slotMs);
    expect(preDelayMs("now", c)).toBe(NOW_DELAY_MS);
    expect(postDelayMs("now", c)).toBe(LATER_DELAY_MS);
    expect(preDelayMs("later", c)).toBe(LATER_DELAY_MS);
    expect(postDelayMs("later", c)).toBe(NOW_DELAY_MS);
  });
});

describe("tap phase", () => {
  const t = { chestStartMs: 100, offerOnsetMs: 1000, choiceMs: 1500, rewardMs: 3500, slotEndMs: 11500 };
  it("is start-inclusive at each boundary", () => {
    expect(classifyTap(100, t)).toBe("chest");
    expect(classifyTap(999, t)).toBe("chest");
    expect(classifyTap(1000, t)).toBe("offer");
    expect(classifyTap(1501, t)).toBe("wait");
    expect(classifyTap(3500, t)).toBe("rest");
    expect(classifyTap(11499, t)).toBe("rest");
  });
});

describe("summary", () => {
  it("gives the proportion of larger-later choices, the median decision time and the taps while waiting", () => {
    const s = summarise([
      rec({ choice: "now", decisionMs: 900, waitTaps: 1, restTaps: 2 }),
      rec({ choice: "later", gems: 2, decisionMs: 1500, waitTaps: 3 }),
      rec({ choice: "later", gems: 2, decisionMs: 1200 }),
      rec({ choice: "now", decisionMs: 2000, restTaps: 1 }),
    ]);
    expect(s).toEqual({
      nChoices: 4,
      immediateChoices: 2,
      laterChoices: 2,
      proportionLater: 0.5,
      medianDecisionMs: 1350,
      waitTaps: 4,
      restTaps: 3,
    });
  });

  it("reports null proportion and median without choices", () => {
    const s = summarise([]);
    expect(s.proportionLater).toBeNull();
    expect(s.medianDecisionMs).toBeNull();
    expect(s.nChoices).toBe(0);
  });
});
