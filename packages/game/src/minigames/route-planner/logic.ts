// Route Planner rules, no DOM: the puzzles, the fewest-moves solver, tap judging and the summary.
// research/04 section 5 sets 4 puzzles of 4 seeds, scored as extra moves and planning time. The board
// size and the puzzles themselves are design choices (TODO, no sourced values; NOTES.md).
import type { Cell, Puzzle, PuzzleRecord, RoutePlannerSummary, RouteTap, TapKind } from "./types";

export const COLS = 5;
export const ROWS = 5;

const p = (c: number, r: number): Cell => ({ c, r });

/** One short practice board (2 seeds, not recorded) before the 4 measured ones. */
export const PRACTICE_PUZZLE: Puzzle = {
  cols: COLS,
  rows: ROWS,
  start: p(2, 4),
  rocks: [],
  seeds: [p(2, 2), p(3, 1)],
};

// Found by a search over random 5 x 5 boards. On the first two, walking to the nearest seed each time is
// already a fewest-moves route; on the last two it costs 2 and 3 extra moves (checked in logic.test.ts),
// so the later puzzles reward looking before moving.
export const PUZZLES: readonly Puzzle[] = [
  { cols: COLS, rows: ROWS, start: p(0, 3), rocks: [p(3, 1), p(4, 3), p(1, 3)], seeds: [p(4, 2), p(0, 2), p(3, 4), p(2, 3)] },
  { cols: COLS, rows: ROWS, start: p(0, 2), rocks: [p(3, 1), p(1, 1), p(4, 4), p(2, 2)], seeds: [p(4, 0), p(0, 1), p(1, 2), p(4, 2)] },
  { cols: COLS, rows: ROWS, start: p(1, 4), rocks: [p(3, 3), p(3, 0), p(4, 4)], seeds: [p(3, 1), p(0, 0), p(1, 1), p(2, 2)] },
  { cols: COLS, rows: ROWS, start: p(3, 4), rocks: [p(3, 0), p(1, 1), p(4, 2)], seeds: [p(0, 4), p(3, 2), p(1, 2), p(4, 3)] },
];

export const same = (a: Cell, b: Cell) => a.c === b.c && a.r === b.r;
const isRock = (pz: Puzzle, x: Cell) => pz.rocks.some((r) => same(r, x));
const inside = (pz: Puzzle, x: Cell) => x.c >= 0 && x.r >= 0 && x.c < pz.cols && x.r < pz.rows;
const STEPS: readonly Cell[] = [p(1, 0), p(-1, 0), p(0, 1), p(0, -1)];

export function neighbours(pz: Puzzle, at: Cell): Cell[] {
  return STEPS.map((d) => p(at.c + d.c, at.r + d.r)).filter((x) => inside(pz, x) && !isRock(pz, x));
}

/** Fewest moves to collect every seed from the start (breadth-first search over cell and seeds taken). */
export function optimalMoves(pz: Puzzle): number {
  const all = (1 << pz.seeds.length) - 1;
  const take = (at: Cell, mask: number) => pz.seeds.reduce((m, s, k) => (same(s, at) ? m | (1 << k) : m), mask);
  const key = (at: Cell, mask: number) => `${at.c},${at.r},${mask}`;
  let frontier: [Cell, number][] = [[pz.start, take(pz.start, 0)]];
  const seen = new Set(frontier.map(([a, m]) => key(a, m)));
  for (let depth = 0; frontier.length; depth++) {
    if (frontier.some(([, m]) => m === all)) return depth;
    const next: [Cell, number][] = [];
    for (const [at, mask] of frontier)
      for (const n of neighbours(pz, at)) {
        const m = take(n, mask);
        if (!seen.has(key(n, m))) {
          seen.add(key(n, m));
          next.push([n, m]);
        }
      }
    frontier = next;
  }
  throw new Error("puzzle cannot be solved");
}

/** Moves taken by always walking to the nearest remaining seed: the no-planning strategy. */
export function greedyMoves(pz: Puzzle): number {
  let at = pz.start;
  let left = pz.seeds.filter((s) => !same(s, at));
  let total = 0;
  while (left.length) {
    const dist = distances(pz, at);
    const best = left.reduce((a, b) => ((dist.get(`${b.c},${b.r}`) ?? Infinity) < (dist.get(`${a.c},${a.r}`) ?? Infinity) ? b : a));
    total += dist.get(`${best.c},${best.r}`) ?? Infinity;
    at = best;
    left = left.filter((s) => !same(s, best));
  }
  return total;
}

function distances(pz: Puzzle, from: Cell): Map<string, number> {
  const d = new Map([[`${from.c},${from.r}`, 0]]);
  const queue = [from];
  while (queue.length) {
    const at = queue.shift() as Cell;
    for (const n of neighbours(pz, at))
      if (!d.has(`${n.c},${n.r}`)) {
        d.set(`${n.c},${n.r}`, (d.get(`${at.c},${at.r}`) ?? 0) + 1);
        queue.push(n);
      }
  }
  return d;
}

export function judgeTap(pz: Puzzle, at: Cell, cell: Cell | null): TapKind {
  if (!cell) return "off";
  const adjacent = Math.abs(cell.c - at.c) + Math.abs(cell.r - at.r) === 1;
  if (!adjacent || !inside(pz, cell)) return "off";
  return isRock(pz, cell) ? "blocked" : "move";
}

/** The next cell on a fewest-moves route (for the practice hand). */
export function hintStep(pz: Puzzle, at: Cell, taken: Cell[]): Cell | null {
  const rest: Puzzle = { ...pz, start: at, seeds: pz.seeds.filter((s) => !taken.some((t) => same(t, s))) };
  if (!rest.seeds.length) return null;
  const best = optimalMoves(rest);
  for (const n of neighbours(pz, at)) if (1 + optimalMoves({ ...rest, start: n }) === best) return n;
  return null;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

export function summarise(records: PuzzleRecord[]): RoutePlannerSummary {
  return {
    nPuzzles: records.length,
    totalExtraMoves: records.reduce((n, r) => n + (r.extraMoves ?? 0), 0),
    nUnsolved: records.filter((r) => r.extraMoves === null).length,
    medianPlanningMs: median(records.flatMap((r) => (r.planningMs === null ? [] : [r.planningMs]))),
    offTaps: records.reduce((n, r) => n + r.taps.filter((t: RouteTap) => t.kind !== "move").length, 0),
  };
}
