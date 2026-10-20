import { describe, expect, it } from "vitest";
import { PRACTICE_PUZZLE, PUZZLES, greedyMoves, hintStep, judgeTap, neighbours, optimalMoves, same, summarise } from "./logic";
import type { Puzzle, PuzzleRecord } from "./types";

const open: Puzzle = { cols: 3, rows: 3, start: { c: 0, r: 0 }, rocks: [], seeds: [{ c: 2, r: 0 }] };

describe("optimalMoves", () => {
  it("counts the shortest walk to a single seed", () => {
    expect(optimalMoves(open)).toBe(2);
  });

  it("walks around a rock", () => {
    expect(optimalMoves({ ...open, rocks: [{ c: 1, r: 0 }] })).toBe(4);
  });

  it("finds the best order to collect several seeds", () => {
    // Seeds at both ends of a row: going left first (1 + 4) beats right first (3 + 4).
    const row: Puzzle = { cols: 5, rows: 1, start: { c: 1, r: 0 }, rocks: [], seeds: [{ c: 0, r: 0 }, { c: 4, r: 0 }] };
    expect(optimalMoves(row)).toBe(5);
  });

  it("refuses a board where a seed cannot be reached", () => {
    expect(() => optimalMoves({ ...open, rocks: [{ c: 1, r: 0 }, { c: 1, r: 1 }, { c: 1, r: 2 }] })).toThrow();
  });
});

describe("the puzzles", () => {
  it("has a practice board and 4 measured boards of 4 seeds each, all solvable", () => {
    expect(PRACTICE_PUZZLE.seeds).toHaveLength(2);
    expect(PUZZLES).toHaveLength(4);
    for (const pz of PUZZLES) {
      expect(pz.seeds).toHaveLength(4);
      expect(optimalMoves(pz)).toBeGreaterThan(0);
      const cells = [pz.start, ...pz.rocks, ...pz.seeds].map((x) => `${x.c},${x.r}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it("rewards planning on the last two boards: nearest-seed-first costs extra moves there, not on the first two", () => {
    const gaps = PUZZLES.map((pz) => greedyMoves(pz) - optimalMoves(pz));
    expect(gaps).toEqual([0, 0, 2, 3]);
  });
});

describe("judgeTap", () => {
  const pz: Puzzle = { ...open, rocks: [{ c: 0, r: 1 }] };
  it("accepts an open neighbour as a move", () => {
    expect(judgeTap(pz, pz.start, { c: 1, r: 0 })).toBe("move");
  });
  it("calls a rock next to Luma blocked", () => {
    expect(judgeTap(pz, pz.start, { c: 0, r: 1 })).toBe("blocked");
  });
  it("calls a far, diagonal or outside tap off", () => {
    expect(judgeTap(pz, pz.start, { c: 2, r: 0 })).toBe("off");
    expect(judgeTap(pz, pz.start, { c: 1, r: 1 })).toBe("off");
    expect(judgeTap(pz, pz.start, null)).toBe("off");
  });
});

describe("hintStep", () => {
  it("points along a fewest-moves route, and to nothing once every seed is taken", () => {
    const pz = PUZZLES[3] as Puzzle;
    let at = pz.start;
    const taken = pz.seeds.filter((s) => same(s, at));
    let moves = 0;
    for (let step = hintStep(pz, at, taken); step; step = hintStep(pz, at, taken)) {
      expect(neighbours(pz, at).some((n) => same(n, step))).toBe(true);
      at = step;
      moves += 1;
      for (const s of pz.seeds) if (same(s, at) && !taken.some((t) => same(t, s))) taken.push(s);
    }
    expect(taken).toHaveLength(4);
    expect(moves).toBe(optimalMoves(pz));
  });
});

describe("summarise", () => {
  it("adds extra moves, takes the median planning time and counts taps that were not moves", () => {
    const rec = (planningMs: number | null, extraMoves: number, kinds: ("move" | "blocked" | "off")[]): PuzzleRecord => ({
      i: 0,
      practice: false,
      solved: true,
      optimalMoves: 9,
      moves: 9 + extraMoves,
      extraMoves,
      onsetMs: 0,
      firstMoveMs: planningMs,
      planningMs,
      endMs: 1,
      taps: kinds.map((kind) => ({ tMs: 0, cell: null, kind })),
    });
    expect(summarise([rec(1000, 0, ["move"]), rec(3000, 2, ["off", "move"]), rec(2000, 1, ["blocked"]), rec(null, 0, [])])).toEqual({
      nPuzzles: 4,
      totalExtraMoves: 3,
      medianPlanningMs: 2000,
      offTaps: 2,
    });
  });
});
