import { describe, expect, it } from "vitest";
import { SessionMetricsSchema } from "@adhdcheck/contracts";
import { DEFAULT_TASK, type TaskConfig } from "./logic";
import { BREAK_MIN_MS, LanternWatchRunner, type ActiveTrial, type RunData, type RunState } from "./runner";
import { buildSessionMetrics } from "./session";

const FRAME = 1000 / 60;

type Tap = { t: number; lantern: number | null; x?: number; y?: number };
type Child = (trial: ActiveTrial, onset: number) => Tap[];

/** Drives the runner like the scene does: pending pointer events are dispatched before each frame callback. */
function sim(opts: { task?: TaskConfig; child?: Child; breakTapDelay?: number; anticipationMs?: number | null } = {}) {
  const shown: { trial: ActiveTrial; onset: number }[] = [];
  const hidden: { trial: ActiveTrial; at: number }[] = [];
  const states: { s: RunState; ts: number }[] = [];
  let pending: Tap[] = [];
  let data: RunData | null = null;
  const child: Child = opts.child ?? ((tr, onset) => (tr.type === "nogo" ? [] : [{ t: onset + 400, lantern: tr.lantern }]));
  const r = new LanternWatchRunner(
    { task: opts.task ?? DEFAULT_TASK, seed: 42, anticipationMs: opts.anticipationMs ?? null },
    {
      onState: (s, ts) => {
        states.push({ s, ts });
        if (s === "break") pending.push({ t: ts + (opts.breakTapDelay ?? BREAK_MIN_MS + 100), lantern: null });
      },
      onStimulus: (ts, trial) => {
        shown.push({ trial, onset: ts });
        pending.push(...child(trial, ts));
      },
      onHide: (ts, trial) => hidden.push({ trial, at: ts }),
      onComplete: (d) => {
        data = d;
      },
    },
  );
  let ts = 1000;
  r.pointerDown(ts - 5, 0, 0, null); // the start tap
  for (let k = 0; k < 400_000 && !data; k++) {
    ts += FRAME;
    pending.sort((a, b) => a.t - b.t);
    while (pending.length && (pending[0] as Tap).t <= ts) {
      const p = pending.shift() as Tap;
      r.pointerDown(p.t, p.x ?? 100, p.y ?? 200, p.lantern);
    }
    r.frame(ts);
  }
  if (!data) throw new Error(`run never finished, state ${r.state}`);
  return { data: data as RunData, shown, hidden, states, runner: r, addTap: (t: Tap) => (pending = [...pending, t]) };
}

describe("LanternWatchRunner, a child who taps every firefly and no moth", () => {
  const { data, shown, hidden, states } = sim();

  it("records 10 calibration trials then 144 task trials, practice excluded", () => {
    expect(data.trials).toHaveLength(154);
    expect(data.trials.slice(0, 10).every((t) => t.type === "calibration")).toBe(true);
    expect(data.trials.slice(10).every((t) => t.type !== "calibration")).toBe(true);
    expect(shown.filter((s) => s.trial.phase === "practice").length).toBeGreaterThan(0);
    expect(data.trials.map((t) => t.i)).toEqual(data.trials.map((_, k) => k));
  });

  it("classifies every trial: calibration and go hit, no-go correct_reject", () => {
    for (const t of data.trials) {
      if (t.type === "nogo") expect(t.outcome).toBe("correct_reject");
      else expect(t.outcome).toBe("hit");
    }
    expect(data.trials.filter((t) => t.type === "nogo")).toHaveLength(30);
    expect(data.off_target_taps).toEqual([]);
  });

  it("takes RT as tap time minus the onset frame timestamp", () => {
    for (const t of data.trials) if (t.responded) expect(t.rt_ms).toBeCloseTo(400, 6);
  });

  it("keeps every task stimulus on screen for 500 ms or more, hidden on the first frame after (NFR-22)", () => {
    const task = hidden.filter((h) => h.trial.phase === "task");
    expect(task).toHaveLength(144);
    for (const h of task) {
      const on = h.at - (h.trial.onset as number);
      expect(on).toBeGreaterThanOrEqual(500);
      expect(on).toBeLessThan(500 + FRAME + 1e-6);
    }
  });

  it("uses session-relative onsets, increasing, starting at or after 0", () => {
    const on = data.trials.map((t) => t.stimulus_onset_ms);
    expect(on[0]).toBeGreaterThanOrEqual(0);
    for (let k = 1; k < on.length; k++) expect(on[k]).toBeGreaterThan(on[k - 1] as number);
  });

  it("paces each task trial as stimulus plus its ISI", () => {
    const task = shown.filter((s) => s.trial.phase === "task");
    for (let k = 1; k < 48; k++) {
      const prev = task[k - 1] as { trial: ActiveTrial; onset: number };
      const gap = (task[k] as { onset: number }).onset - prev.onset;
      expect(gap).toBeGreaterThanOrEqual(500 + prev.trial.isiMs);
      expect(gap).toBeLessThan(500 + prev.trial.isiMs + FRAME + 1e-6);
    }
  });

  it("goes calibration, practice, then 3 blocks with a break between blocks, then done", () => {
    const seq = states.map((s) => s.s).filter((s, k, a) => s !== a[k - 1]);
    expect(seq).toEqual([
      "calib-intro",
      "calib",
      "practice-intro",
      "practice",
      "block-intro",
      "trials",
      "break",
      "block-intro",
      "trials",
      "break",
      "block-intro",
      "trials",
      "done",
    ]);
  });

  it("builds a SessionMetrics the contract accepts", () => {
    const m = buildSessionMetrics({
      sessionId: "0b6f1c2e-3d4a-4b5c-8d6e-7f8091a2b3c4",
      childId: "1c2d3e4f-5a6b-4c7d-9e8f-0a1b2c3d4e5f",
      startedAt: "2026-10-20T10:00:00.000Z",
      durationMs: data.duration_ms,
      task: DEFAULT_TASK,
      device: {
        user_agent: "synthetic",
        pointer_type: "touch",
        screen_w: 1024,
        screen_h: 768,
        device_pixel_ratio: 1,
        est_refresh_hz: 60,
        cross_origin_isolated: false,
        timer_clock: "event.timeStamp",
      },
      trials: data.trials,
      offTargetTaps: data.off_target_taps,
    });
    expect(SessionMetricsSchema.safeParse(m).success).toBe(true);
    expect(m.calibration).toEqual({ median_rt_ms: 400, n: 10 });
  });
});

describe("LanternWatchRunner, errors and off-target taps", () => {
  const small: TaskConfig = { ...DEFAULT_TASK, blocks: 1, trialsPerBlock: 10 };

  it("records omissions with no RT and the x/y convention 0, 0", () => {
    const { data } = sim({ task: small, child: (tr, on) => (tr.phase === "task" ? [] : [{ t: on + 350, lantern: tr.lantern }]) });
    const go = data.trials.filter((t) => t.type === "go");
    expect(go).toHaveLength(8);
    for (const t of go) expect(t).toMatchObject({ responded: false, rt_ms: null, outcome: "omission", x: 0, y: 0 });
  });

  it("records a tap on a moth as a commission with its RT and tap position", () => {
    const { data } = sim({
      task: small,
      child: (tr, on) => [{ t: on + 300, lantern: tr.lantern, x: 321, y: 123 }],
    });
    const nogo = data.trials.filter((t) => t.type === "nogo");
    expect(nogo).toHaveLength(2);
    for (const t of nogo) expect(t).toMatchObject({ responded: true, outcome: "commission", x: 321, y: 123 });
    for (const t of nogo) expect(t.rt_ms).toBeCloseTo(300, 6);
  });

  it("counts a late go tap inside the ISI as the trial's response", () => {
    const { data } = sim({ task: small, child: (tr, on) => (tr.type === "nogo" ? [] : [{ t: on + 800, lantern: tr.lantern }]) });
    for (const t of data.trials.filter((x) => x.type === "go")) expect(t.outcome).toBe("hit");
  });

  it("logs a tap on the wrong lantern during the stimulus as off-target 'stimulus', and an empty-sky tap in the ISI as 'isi'", () => {
    const { data } = sim({
      task: small,
      child: (tr, on) =>
        tr.phase === "task" && tr.taskIndex === 0
          ? [
              { t: on + 100, lantern: (tr.lantern + 1) % 3 },
              { t: on + 700, lantern: null },
              { t: on + 750, lantern: tr.lantern },
            ]
          : tr.type === "nogo"
            ? []
            : [{ t: on + 400, lantern: tr.lantern }],
    });
    const first = data.trials[10];
    expect(first?.responded).toBe(true); // the on-target tap at 750 ms, inside the ISI
    expect(first?.rt_ms).toBeCloseTo(750, 6);
    const during = data.off_target_taps.map((o) => o.during);
    expect(during[0]).toBe("stimulus");
    expect(during[1]).toBe("isi");
    for (const o of data.off_target_taps) expect(o.t_ms).toBeGreaterThanOrEqual(0);
  });

  it("classifies anticipations against the threshold when one is configured", () => {
    const { data } = sim({ task: small, anticipationMs: 150, child: (tr, on) => [{ t: on + 60, lantern: tr.lantern }] });
    for (const t of data.trials.filter((x) => x.type !== "calibration")) expect(t.outcome).toBe("anticipation");
  });

  it("does not leave a break before BREAK_MIN_MS, even on a tap", () => {
    const two: TaskConfig = { ...DEFAULT_TASK, blocks: 2, trialsPerBlock: 5 };
    // The simulated child taps once, too early: the tap is ignored and the run waits in the break.
    expect(() => sim({ task: two, breakTapDelay: 200 })).toThrow(/state break/);
    // The same run with the tap after BREAK_MIN_MS finishes.
    expect(sim({ task: two }).data.trials).toHaveLength(20);
  });
});
