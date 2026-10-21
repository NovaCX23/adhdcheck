import { describe, expect, it } from "vitest";
import { LATER_DELAY_MS, NOW_DELAY_MS, PRACTICE_CHOICES, SLOT_MS } from "./logic";
import { TreasureChoiceRunner, type RunState } from "./runner";
import type { Choice, TreasureChoiceResult } from "./types";

function setup(choices = 10, frame = 16, seed = 11) {
  const offers: number[] = [];
  const rewards: { ts: number; choice: Choice }[] = [];
  const states: RunState[] = [];
  let result: TreasureChoiceResult | null = null;
  let doneAt = -1;
  const r = new TreasureChoiceRunner(
    { seed, choices },
    {
      onState: (s, ts) => {
        states.push(s);
        if (s === "done") doneAt = ts;
      },
      onOffer: (ts) => offers.push(ts),
      onReward: (ts, _item, choice) => rewards.push({ ts, choice }),
      onComplete: (res) => {
        result = res;
      },
    },
  );
  let ts = 1000;
  const step = () => {
    ts += frame;
    r.frame(ts);
    return ts;
  };
  const until = (pred: () => boolean, max = 100_000) => {
    // The instructions wait for a tap (Hatem, 2026-10-21): this child taps "ready" one frame after each appears.
    for (let k = 0; k < max && !pred(); k++) {
      if (r.waitsForReady()) r.pointerDown(ts + 1, null);
      step();
    }
    if (!pred()) throw new Error(`state never reached, now ${r.state}`);
  };
  return {
    r,
    offers,
    rewards,
    states,
    step,
    until,
    now: () => ts,
    result: () => result as TreasureChoiceResult | null,
    doneAt: () => doneAt,
  };
}

/** Plays a whole session: practice taps the side shown, scored choices follow `pick`, each after `decide(i)` ms. */
function play(
  pick: (i: number) => Choice,
  decide: (i: number) => number,
  opts: { choices?: number; frame?: number; seed?: number } = {},
) {
  const s = setup(opts.choices ?? 10, opts.frame ?? 16, opts.seed ?? 11);
  s.r.pointerDown(s.now() + 1, null);
  s.step();
  let scored = 0;
  const st = (): RunState => s.r.state;
  while (st() !== "done") {
    s.until(() => st() === "offer" || st() === "done");
    if (st() === "done") break;
    const item = s.r.current()!;
    const onset = s.offers[s.offers.length - 1] as number;
    if (item.practice) {
      expect(s.r.pointerDown(onset + 700, item.sched.only ?? "now")).toBe("choice");
    } else {
      expect(s.r.pointerDown(onset + decide(scored), pick(scored))).toBe("choice");
      scored += 1;
    }
    s.step();
  }
  return s;
}

describe("TreasureChoiceRunner instructions wait for a tap (no timer)", () => {
  it("stays on the practice instruction for 60 s, then leaves on one ready tap", () => {
    const s = setup(1);
    s.r.pointerDown(1001, null);
    s.step();
    expect(s.r.state).toBe("practice-intro");
    for (let k = 0; k < 3750; k++) s.step();
    expect(s.r.state).toBe("practice-intro");
    expect(s.r.pointerDown(s.now() + 1, null)).toBe("ready");
    expect(s.r.pointerDown(s.now() + 2, null)).toBe("ignored");
    s.step();
    expect(s.r.state).toBe("chest");
  });

  it("a tap stamped before the instruction appeared does not skip it", () => {
    const s = setup(1);
    s.r.pointerDown(1001, null);
    s.step();
    expect(s.r.pointerDown(s.r.stateStartMs - 1, null)).toBe("ignored");
    expect(s.r.state).toBe("practice-intro");
  });

  it("stays on 'Now you choose, every time.' until a tap", () => {
    const s = setup(1);
    s.r.pointerDown(1001, null);
    s.step();
    for (let k = 0; k < PRACTICE_CHOICES; k++) {
      s.until(() => s.r.state === "offer");
      s.r.pointerDown(s.now() + 6, s.r.current()!.sched.only!);
      s.step();
      s.until(() => s.r.state !== "wait" && s.r.state !== "rest");
    }
    expect(s.r.state).toBe("between");
    for (let k = 0; k < 3750; k++) s.step();
    expect(s.r.state).toBe("between");
    expect(s.r.pointerDown(s.now() + 1, null)).toBe("ready");
    s.step();
    expect(s.r.current()?.practice).toBe(false);
  });
});

describe("TreasureChoiceRunner (render loop wiring around logic.ts)", () => {
  it("starts on the first tap and opens the practice round in the next frame", () => {
    const { r, step } = setup();
    expect(r.state).toBe("intro");
    expect(r.pointerDown(1001, null)).toBe("start");
    step();
    expect(r.state).toBe("practice-intro");
  });

  it("takes the offer onset from the frame that switches to the offer, once per choice", () => {
    const { r, offers, step, until } = setup();
    r.pointerDown(1001, null);
    step();
    until(() => r.state === "offer");
    expect(offers).toHaveLength(1);
    const onsetFrame = offers[0] as number;
    step();
    expect(offers).toEqual([onsetFrame]);
  });

  it("measures decision time from the offer frame to the pointerdown timeStamp, and ignores taps stamped before it", () => {
    const s = play(
      (i) => (i % 2 ? "later" : "now"),
      (i) => 400 + i * 100,
    );
    const res = s.result()!;
    expect(res.trials).toHaveLength(10);
    res.trials.forEach((t, i) => {
      expect(t.decisionMs).toBe(400 + i * 100);
      expect(t.choiceMs - t.offerOnsetMs).toBe(t.decisionMs);
    });

    const e = setup();
    e.r.pointerDown(1001, null);
    e.step();
    e.until(() => e.r.state === "offer");
    const onset = e.offers[0] as number;
    const side = e.r.current()!.sched.only ?? "now";
    expect(e.r.pointerDown(onset - 1, side)).toBe("recorded");
    expect(e.r.state).toBe("offer");
    expect(e.r.pointerDown(onset, side)).toBe("choice");
  });

  it("runs two practice choices, one per option, accepts only the option shown, and never records them", () => {
    const s = setup(1);
    s.r.pointerDown(1001, null);
    s.step();
    const shown: (Choice | undefined)[] = [];
    for (let k = 0; k < PRACTICE_CHOICES; k++) {
      s.until(() => s.r.state === "offer");
      const item = s.r.current()!;
      expect(item.practice).toBe(true);
      shown.push(item.sched.only);
      const other: Choice = item.sched.only === "now" ? "later" : "now";
      expect(s.r.pointerDown(s.now() + 5, other)).toBe("recorded");
      expect(s.r.pointerDown(s.now() + 6, item.sched.only!)).toBe("choice");
      s.step();
      s.until(() => s.r.state !== "wait" && s.r.state !== "rest");
    }
    expect(shown.sort()).toEqual(["later", "now"]);
    expect(s.states).toContain("between");
  });

  it("records ten choices, now and later, with 1 and 2 gems and the right delays", () => {
    const s = play(
      (i) => (i < 3 ? "now" : "later"),
      () => 800,
    );
    const res = s.result()!;
    expect(res.id).toBe("treasure-choice");
    expect(res.trials.map((t) => t.choice)).toEqual(["now", "now", "now", ...Array(7).fill("later")]);
    expect(res.trials.map((t) => t.gems)).toEqual([1, 1, 1, ...Array(7).fill(2)]);
    expect(res.trials[0]!.delayChosenMs).toBe(NOW_DELAY_MS);
    expect(res.trials[5]!.delayChosenMs).toBe(LATER_DELAY_MS);
    expect(res.trials.every((t) => t.delayOfferedMs === LATER_DELAY_MS)).toBe(true);
    expect(res.summary.immediateChoices).toBe(3);
    expect(res.summary.laterChoices).toBe(7);
    expect(res.summary.proportionLater).toBeCloseTo(0.7, 10);
    expect(res.params.n_choices).toBe(10);
  });

  it("gives the gems after the chosen delay and ends every slot after the same time", () => {
    const s = play(
      (i) => (i % 2 ? "later" : "now"),
      () => 600,
    );
    for (const t of s.result()!.trials) {
      const pre = t.rewardMs - t.choiceMs;
      const slot = t.slotEndMs - t.choiceMs;
      // Frame quantisation: the gems come in the first frame at or after the delay (16 ms frames).
      expect(pre).toBeGreaterThanOrEqual(t.delayChosenMs);
      expect(pre).toBeLessThan(t.delayChosenMs + 2 * 16);
      expect(slot).toBeGreaterThanOrEqual(SLOT_MS);
      expect(slot).toBeLessThan(SLOT_MS + 2 * 16);
    }
  });

  it("takes exactly the same total time for an all-now and an all-later run with the same seed (FR-63)", () => {
    for (const frame of [16, 1000 / 60, 1000 / 120]) {
      const decide = (i: number) => 500 + ((i * 337) % 900);
      const allNow = play(() => "now", decide, { frame, seed: 2024 });
      const allLater = play(() => "later", decide, { frame, seed: 2024 });
      expect(allNow.result()!.summary.immediateChoices).toBe(10);
      expect(allLater.result()!.summary.laterChoices).toBe(10);
      expect(allNow.doneAt()).toBe(allLater.doneAt());
      // The rule is not vacuous: the 1-gem gems come much sooner than the 2-gem gems.
      const firstNow = allNow.result()!.trials[0]!;
      const firstLater = allLater.result()!.trials[0]!;
      expect(firstLater.rewardMs - firstLater.choiceMs - (firstNow.rewardMs - firstNow.choiceMs)).toBeGreaterThan(
        LATER_DELAY_MS - NOW_DELAY_MS - 40,
      );
    }
  });

  it("records taps while waiting and resting without changing the flow", () => {
    const s = setup(1);
    s.r.pointerDown(1001, null);
    s.step();
    // Practice: play both forced choices.
    for (let k = 0; k < PRACTICE_CHOICES; k++) {
      s.until(() => s.r.state === "offer");
      s.r.pointerDown(s.now() + 1, s.r.current()!.sched.only!);
      s.step();
    }
    s.until(() => s.r.state === "offer");
    const onset = s.offers[s.offers.length - 1] as number;
    // Realistic stamps: a tap is always stamped before the frame that handles it (next frame at onset + 16).
    expect(s.r.pointerDown(onset + 2, null)).toBe("recorded"); // between the options
    expect(s.r.pointerDown(onset + 5, "later")).toBe("choice");
    s.step();
    expect(s.r.state).toBe("wait");
    expect(s.r.pointerDown(s.now() + 1, "now")).toBe("recorded");
    expect(s.r.pointerDown(s.now() + 2, null)).toBe("recorded");
    s.until(() => s.r.state === "rest");
    expect(s.r.pointerDown(s.now() + 1, null)).toBe("recorded");
    s.until(() => s.r.state === "done");
    const t = s.result()!.trials[0]!;
    expect(t.choice).toBe("later");
    expect(t.waitTaps).toBe(2);
    expect(t.restTaps).toBe(1);
    expect(t.offTargetTaps).toBe(1);
    expect(s.result()!.summary.waitTaps).toBe(2);
    expect(s.result()!.summary.restTaps).toBe(1);
  });
});
