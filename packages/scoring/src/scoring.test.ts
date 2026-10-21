import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SCORE_DISCLAIMER, ScoreResultSchema, SessionMetricsSchema, type SessionMetrics } from "@adhdcheck/contracts";
import { validSessionMetrics } from "../../contracts/src/fixtures/session-metrics.valid";
import { scoreSession, type Thresholds } from "./index";
import shipped from "../thresholds.v0.json";

// Synthetic sessions, all values made up. Hand computations are written next to each expectation.
// Definitions: research/04-game-design-symptom-mapping.md section 7.2 (metrics code) and docs/02 FR-21.

type T = SessionMetrics["trials"][number];

function hit(i: number, rt: number): T {
  return { i, block: 0, type: "go", stimulus_onset_ms: 1000 * i, responded: true, rt_ms: rt, outcome: "hit", x: 1, y: 1 };
}
function omission(i: number): T {
  return { i, block: 0, type: "go", stimulus_onset_ms: 1000 * i, responded: false, rt_ms: null, outcome: "omission", x: 1, y: 1 };
}
function commission(i: number, rt: number): T {
  return { i, block: 0, type: "nogo", stimulus_onset_ms: 1000 * i, responded: true, rt_ms: rt, outcome: "commission", x: 1, y: 1 };
}
function reject(i: number): T {
  return { i, block: 0, type: "nogo", stimulus_onset_ms: 1000 * i, responded: false, rt_ms: null, outcome: "correct_reject", x: 0, y: 0 };
}
function anticipation(i: number, rt: number): T {
  return { i, block: 0, type: "go", stimulus_onset_ms: 1000 * i, responded: true, rt_ms: rt, outcome: "anticipation", x: 1, y: 1 };
}
function calibration(i: number): T {
  return { i, block: 0, type: "calibration", stimulus_onset_ms: 1000 * i, responded: true, rt_ms: 300, outcome: "hit", x: 1, y: 1 };
}

function session(trials: T[], offTarget = 0): SessionMetrics {
  return SessionMetricsSchema.parse({
    ...validSessionMetrics,
    trials,
    off_target_taps: Array.from({ length: offTarget }, (_, k) => ({ t_ms: 100 + k, during: k % 2 ? "stimulus" : "isi" })),
  });
}

// 12 go trials in presentation order, thirds of 4:
//   first third  : hit 400, hit 500, omission, hit 300      -> 1 omission of 4
//   middle third : hit 450, hit 350, hit 450, hit 350
//   last third   : omission, omission, hit 600, hit 400     -> 2 omissions of 4
// 6 no-go trials: 2 commissions, 4 correct rejections. 3 off-target taps. 2 calibration trials (ignored).
const MIXED: T[] = [
  calibration(0),
  calibration(1),
  hit(2, 400),
  hit(3, 500),
  reject(4),
  omission(5),
  hit(6, 300),
  commission(7, 250),
  hit(8, 450),
  hit(9, 350),
  reject(10),
  hit(11, 450),
  hit(12, 350),
  commission(13, 260),
  omission(14),
  omission(15),
  reject(16),
  hit(17, 600),
  hit(18, 400),
  reject(19),
];

// Thresholds used ONLY in these tests to prove the band logic. They are not proposed values.
const FIXTURE: Thresholds = {
  validated: false,
  min_trials: 10,
  min_hits: 5,
  max_anticipation_share: 0.2,
  max: { rt_cv: 0.3, commission_rate: 0.5, omission_rate: 0.2 },
};

describe("indicators (FR-21), hand computed", () => {
  const r = scoreSession(session(MIXED, 3), FIXTURE);
  const ind = r.indicators;

  it("omission rate: 3 omissions / 12 go trials = 0.25", () => expect(ind.omission_rate).toBeCloseTo(0.25, 10));
  it("commission rate: 2 commissions / 6 no-go trials = 0.3333", () => expect(ind.commission_rate).toBeCloseTo(2 / 6, 10));
  it("mean RT of hits: 3800 / 9 = 422.2222 ms", () => expect(ind.rt_mean_ms).toBeCloseTo(422.2222, 3));
  it("RT SD (n-1): sqrt((1670000 - 3800^2/9) / 8) = 90.5232 ms", () => expect(ind.rt_sd_ms).toBeCloseTo(90.5232, 3));
  it("RT CV: 90.5232 / 422.2222 = 0.21439", () => expect(ind.rt_cv).toBeCloseTo(0.21439, 4));
  it("vigilance change: omission rate last third 2/4 minus first third 1/4 = 0.25", () =>
    expect(ind.vigilance_change).toBeCloseTo(0.25, 10));
  it("off-target tap rate counts inter-stimulus-interval taps only (research/03 section 4): 2 of the 3 taps, 2 / (2 + 11) = 0.153846", () =>
    expect(ind.off_target_tap_rate).toBeCloseTo(2 / 13, 10));

  it("ignores calibration trials and the order of the array (sorted by i)", () => {
    const shuffled = [...MIXED].reverse();
    expect(scoreSession(session(shuffled, 3), FIXTURE).indicators).toEqual(ind);
  });

  it("an anticipation is neither a hit nor an omission, and is counted in data quality", () => {
    const withAnt = session([...MIXED, anticipation(20, 90)], 0);
    const a = scoreSession(withAnt, FIXTURE);
    // 13 go trials now, omissions still 3
    expect(a.indicators.omission_rate).toBeCloseTo(3 / 13, 10);
    expect(a.indicators.rt_mean_ms).toBeCloseTo(3800 / 9, 3);
    // 18 Lantern trials (calibration excluded), 1 anticipation
    expect(a.data_quality.n_trials).toBe(19);
    expect(a.data_quality.pct_anticipations).toBeCloseTo(1 / 19, 10);
  });

  it("data quality counts Lantern trials only: 18 here, no anticipation", () => {
    expect(r.data_quality.n_trials).toBe(18);
    expect(r.data_quality.pct_anticipations).toBe(0);
  });

  it("I1: an indicator with an empty denominator is null, never a real-looking 0", () => {
    const none = scoreSession(session([hit(0, 400)], 0), FIXTURE).indicators;
    expect(none.commission_rate).toBeNull(); // no no-go trial
    expect(none.vigilance_change).toBeNull(); // fewer than 3 go trials: no third
    expect(none.rt_sd_ms).toBeNull(); // one hit: no spread
    expect(none.rt_cv).toBeNull();
    expect(none.rt_mean_ms).toBe(400);
    expect(none.omission_rate).toBe(0); // 0 omissions of 1 go trial: a real 0
    for (const v of Object.values(none)) expect(Number.isNaN(v)).toBe(false);
  });

  it("I1: no hit at all gives null RT mean, SD and CV; no go trial gives a null omission rate", () => {
    const noHit = scoreSession(session([omission(0), omission(1), omission(2)], 0), FIXTURE).indicators;
    expect(noHit.rt_mean_ms).toBeNull();
    expect(noHit.rt_sd_ms).toBeNull();
    expect(noHit.rt_cv).toBeNull();
    expect(noHit.omission_rate).toBe(1);
    const noGo = scoreSession(session([reject(0), commission(1, 300)], 0), FIXTURE).indicators;
    expect(noGo.omission_rate).toBeNull();
    expect(noGo.commission_rate).toBeCloseTo(0.5, 10);
    expect(scoreSession(session([], 0), FIXTURE).indicators.off_target_tap_rate).toBeNull();
  });

  it("I1: a band is never given on an indicator that is null", () => {
    const r = scoreSession(session([hit(0, 400), hit(1, 410)], 0), { ...FIXTURE, min_trials: 1, min_hits: 1 });
    expect(r.band).toBe("insufficient_data"); // commission rate is null here
    expect(r.flags).toEqual([]);
    expect(r.data_quality.notes.join(" ")).toMatch(/^dev: /);
  });

  it("I2: a stimulus-time tap is not an off-target tap", () => {
    const s = SessionMetricsSchema.parse({ ...session(MIXED), off_target_taps: [{ t_ms: 5, during: "stimulus" }, { t_ms: 6, during: "stimulus" }] });
    expect(scoreSession(s, FIXTURE).indicators.off_target_tap_rate).toBe(0);
  });
});

describe("bands with fixture thresholds (FR-20, FR-22, FR-23)", () => {
  it("follow_up_suggested when an indicator exceeds its maximum, one flag and one reason each", () => {
    const r = scoreSession(session(MIXED, 3), FIXTURE);
    // omission 0.25 > 0.2 ; commission 0.333 <= 0.5 ; cv 0.2144 <= 0.3
    expect(r.band).toBe("follow_up_suggested");
    expect(r.flags).toEqual(["omission_rate"]);
    expect(r.reasons).toHaveLength(r.flags.length);
  });

  it("no_flag when nothing exceeds", () => {
    const high = { ...FIXTURE, max: { rt_cv: 0.9, commission_rate: 0.9, omission_rate: 0.9 } };
    const r = scoreSession(session(MIXED, 3), high);
    expect(r.band).toBe("no_flag");
    expect(r.flags).toEqual([]);
    expect(r.reasons).toEqual([]);
  });

  it("insufficient_data below the minimum trial count", () => {
    expect(scoreSession(session(MIXED, 3), { ...FIXTURE, min_trials: 19 }).band).toBe("insufficient_data");
    expect(scoreSession(session(MIXED, 3), { ...FIXTURE, min_trials: 18 }).band).not.toBe("insufficient_data");
  });

  it("insufficient_data below the minimum number of hits", () => {
    expect(scoreSession(session(MIXED, 3), { ...FIXTURE, min_hits: 10 }).band).toBe("insufficient_data");
    expect(scoreSession(session(MIXED, 3), { ...FIXTURE, min_hits: 9 }).band).not.toBe("insufficient_data");
  });

  it("insufficient_data when the anticipation share is above its maximum", () => {
    const trials = [...MIXED, anticipation(20, 90), anticipation(21, 80), anticipation(22, 70), anticipation(23, 60)];
    const r = scoreSession(session(trials), FIXTURE);
    expect(r.data_quality.pct_anticipations).toBeCloseTo(4 / 22, 10); // 0.18, not above 0.2
    expect(r.band).not.toBe("insufficient_data");
    const r2 = scoreSession(session(trials), { ...FIXTURE, max_anticipation_share: 0.1 });
    expect(r2.band).toBe("insufficient_data");
  });

  it("every result satisfies the contract, is deterministic, carries the disclaimer and no mission", () => {
    const r = scoreSession(session(MIXED, 3), FIXTURE);
    expect(ScoreResultSchema.safeParse(r).success).toBe(true);
    expect(scoreSession(session(MIXED, 3), FIXTURE)).toEqual(r);
    expect(r.disclaimer).toBe(SCORE_DISCLAIMER);
    expect(r.validated).toBe(false);
    expect(r.recommendations).toEqual([]);
  });
});

describe("shipped thresholds.v0.json (no value is sourced yet)", () => {
  it("is labelled not validated and holds no invented number", () => {
    expect(shipped.validated).toBe(false);
    const numbers: unknown[] = [shipped.min_trials, shipped.min_hits, shipped.max_anticipation_share, ...Object.values(shipped.max)];
    expect(numbers.every((v) => v === null)).toBe(true);
  });

  it("with null thresholds the band is insufficient_data, said out loud, and the indicators are still computed", () => {
    const r = scoreSession(session(MIXED, 3));
    expect(r.band).toBe("insufficient_data");
    expect(r.indicators.omission_rate).toBeCloseTo(0.25, 10);
    expect(r.flags).toEqual([]);
    expect(r.data_quality.notes.join(" ")).toMatch(/^dev: .*thresholds\.v0\.json/);
    expect(ScoreResultSchema.safeParse(r).success).toBe(true);
  });

  it("scoring_method is bumped from rules_v0 (FR-25)", () => {
    expect(scoreSession(session(MIXED, 3)).scoring_method).toBe("rules_v1");
  });

  it("no numeric threshold literal in the scoring code outside the JSON (FR-22)", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = readdirSync(dir).filter((n) => n.endsWith(".ts") && !n.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const code = readFileSync(join(dir, f), "utf8")
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/"[^"\n]*"/g, '""');
      const literals = (code.match(/(?<![\w.])\d+(\.\d+)?(?!\w)/g) ?? []).filter((n) => !["0", "1", "2", "3"].includes(n));
      expect(literals, f).toEqual([]);
    }
  });
});

// FR-25: changing a threshold requires a new scoring_method. The values are pinned per method: edit thresholds.v0.json
// without bumping scoring_method (and adding the new method here) and this test fails.
const PINNED: Record<string, string> = {
  rules_v1: '{"validated":false,"min_trials":null,"min_hits":null,"max_anticipation_share":null,"max":{"rt_cv":null,"commission_rate":null,"omission_rate":null}}',
};
describe("FR-25: thresholds are tied to scoring_method", () => {
  it("the shipped values are the ones pinned for the method the scorer reports", () => {
    const { validated, min_trials, min_hits, max_anticipation_share, max } = shipped;
    const method = scoreSession(session(MIXED)).scoring_method;
    expect(JSON.stringify({ validated, min_trials, min_hits, max_anticipation_share, max })).toBe(PINNED[method]);
  });
  it("the check can fail: a changed value no longer matches the pin", () => {
    const changed = JSON.stringify({ validated: false, min_trials: 1, min_hits: null, max_anticipation_share: null, max: { rt_cv: null, commission_rate: null, omission_rate: null } });
    expect(changed).not.toBe(PINNED.rules_v1);
  });
});

describe("the placeholder session fixture still scores", () => {
  it("validates", () => {
    const s = SessionMetricsSchema.parse(validSessionMetrics);
    expect(ScoreResultSchema.safeParse(scoreSession(s)).success).toBe(true);
  });
});
