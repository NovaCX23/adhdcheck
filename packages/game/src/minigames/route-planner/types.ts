// Route Planner (FR-64, optional, research/04 section 5, row 6): plan a path that collects 4 seeds in the
// fewest moves. All times are milliseconds relative to the start tap (performance.now() timebase).

export type Cell = { c: number; r: number };

export interface Puzzle {
  cols: number;
  rows: number;
  start: Cell;
  rocks: Cell[];
  seeds: Cell[];
}

export type TapKind = "move" | "blocked" | "off";

export interface RouteTap {
  tMs: number;
  /** The cell under the finger, or null outside the board. */
  cell: Cell | null;
  /** move: an open neighbour of Luma; blocked: a rock next to Luma; off: anything else. */
  kind: TapKind;
}

export interface PuzzleRecord {
  i: number;
  practice: false;
  /** false when the puzzle ended after IDLE_TIMEOUT_MS without a tap. */
  solved: boolean;
  optimalMoves: number;
  moves: number;
  /** null when the puzzle ended unsolved: no value rather than the best possible one. */
  extraMoves: number | null;
  /** Frame time of the requestAnimationFrame callback that first drew the puzzle. */
  onsetMs: number;
  firstMoveMs: number | null;
  /** First move minus onset: time spent looking before acting. */
  planningMs: number | null;
  endMs: number;
  taps: RouteTap[];
}

export interface RoutePlannerSummary {
  nPuzzles: number;
  /** Sum over solved puzzles only. */
  totalExtraMoves: number;
  nUnsolved: number;
  medianPlanningMs: number | null;
  offTaps: number;
}

/** Local, shaped like the PC-02 proposal (docs/02 section 10.3), as Bridge Wait and Star Path. */
export interface RoutePlannerResult {
  id: "route-planner";
  version: string;
  params: { n_puzzles: number; practice_puzzles: number; cols: number; rows: number; seeds_per_puzzle: number };
  puzzles: PuzzleRecord[];
  summary: RoutePlannerSummary;
}
