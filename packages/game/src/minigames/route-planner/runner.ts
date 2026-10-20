// Puzzle runner: the render-loop wiring around logic.ts, with no rendering and no DOM, so it is unit-tested.
// As in Bridge Wait and Star Path, the view calls frame(ts) at the top of every requestAnimationFrame callback,
// BEFORE it renders: a board shown in frame(ts) is drawn by that callback's render, so ts is its onset
// (research/03 section 2). pointerDown() takes the pointerdown event.timeStamp and the cell under the finger.
import { PRACTICE_PUZZLE, PUZZLES, judgeTap, optimalMoves, same, summarise } from "./logic";
import type { Cell, Puzzle, PuzzleRecord, RoutePlannerResult, RouteTap } from "./types";

// TODO: design choices, no sourced values (research/04 section 5 gives 4 puzzles, about 2 minutes).
export const PRACTICE_INTRO_MS = 2000;
export const BETWEEN_MS = 1600;
/** A puzzle ends unsolved after this long without a tap, so a child who stops is not stuck. */
export const IDLE_TIMEOUT_MS = 30_000;
export const RESULT_VERSION = "0.1.0";

export type RunState = "intro" | "practice-intro" | "puzzle" | "between" | "done";

export interface Board {
  puzzle: Puzzle;
  practice: boolean;
  /** 0-based index of the measured puzzle; -1 for the practice board. */
  index: number;
  at: Cell;
  taken: Cell[];
}

export interface RunnerHooks {
  onState?: (s: RunState, ts: number, board: Board | undefined) => void;
  /** Called inside frame(ts) when a new board is shown: draw it in this callback's render. */
  onBoard?: (ts: number, board: Board) => void;
  onMove?: (tapMs: number, board: Board, seedTaken: boolean) => void;
  onBlocked?: (tapMs: number, cell: Cell) => void;
  onComplete?: (result: RoutePlannerResult) => void;
}

export class RoutePlannerRunner {
  state: RunState = "intro";
  board: Board | undefined;
  private readonly hooks: RunnerHooks;
  private readonly records: PuzzleRecord[] = [];
  private startRequested = false;
  private t0 = 0;
  private stateSince = 0;
  private next = -1; // -1 = practice board, then 0..3
  private pendingBoard = false;
  private onsetMs = 0;
  private lastTap = 0;
  private moves = 0;
  private firstMoveMs: number | null = null;
  private taps: RouteTap[] = [];
  private finishedAt: number | null = null;

  constructor(hooks: RunnerHooks = {}) {
    this.hooks = hooks;
  }

  private setState(s: RunState, ts: number) {
    this.state = s;
    this.stateSince = ts;
    this.hooks.onState?.(s, ts, this.board);
  }

  private rel(t: number) {
    return t - this.t0;
  }

  frame(ts: number) {
    if (this.state === "intro") {
      if (this.startRequested) this.setState("practice-intro", ts);
      return;
    }
    if (this.state === "practice-intro" && ts - this.stateSince >= PRACTICE_INTRO_MS) return this.show(ts);
    if (this.state === "between" && ts - this.stateSince >= BETWEEN_MS) {
      if (this.next >= PUZZLES.length) return this.finish(ts);
      return this.show(ts);
    }
    if (this.state === "puzzle") {
      if (this.pendingBoard && this.board) {
        this.pendingBoard = false;
        this.onsetMs = ts;
        this.lastTap = ts;
        this.hooks.onBoard?.(ts, this.board);
      }
      if (this.finishedAt !== null) return this.endBoard(ts, true);
      if (ts - this.lastTap >= IDLE_TIMEOUT_MS) return this.endBoard(ts, false);
    }
  }

  private show(ts: number) {
    const practice = this.next === -1;
    const puzzle = practice ? PRACTICE_PUZZLE : (PUZZLES[this.next] as Puzzle);
    this.board = { puzzle, practice, index: this.next, at: puzzle.start, taken: puzzle.seeds.filter((s) => same(s, puzzle.start)) };
    this.pendingBoard = true;
    this.moves = 0;
    this.firstMoveMs = null;
    this.taps = [];
    this.finishedAt = null;
    this.setState("puzzle", ts);
  }

  private endBoard(ts: number, solved: boolean) {
    const b = this.board as Board;
    if (!b.practice) {
      const optimal = optimalMoves(b.puzzle);
      this.records.push({
        i: b.index,
        practice: false,
        solved,
        optimalMoves: optimal,
        moves: this.moves,
        extraMoves: solved ? this.moves - optimal : 0,
        onsetMs: this.rel(this.onsetMs),
        firstMoveMs: this.firstMoveMs === null ? null : this.rel(this.firstMoveMs),
        planningMs: this.firstMoveMs === null ? null : this.firstMoveMs - this.onsetMs,
        endMs: this.rel(this.finishedAt ?? ts),
        taps: this.taps,
      });
    }
    this.next += 1;
    this.setState("between", ts);
  }

  private finish(ts: number) {
    this.board = undefined;
    this.setState("done", ts);
    this.hooks.onComplete?.({
      id: "route-planner",
      version: RESULT_VERSION,
      params: { n_puzzles: PUZZLES.length, practice_puzzles: 1, cols: PRACTICE_PUZZLE.cols, rows: PRACTICE_PUZZLE.rows, seeds_per_puzzle: 4 },
      puzzles: this.records,
      summary: summarise(this.records),
    });
  }

  /** tMs: pointerdown event.timeStamp. cell: the board cell under the finger, null outside the board. */
  pointerDown(tMs: number, cell: Cell | null): "start" | "move" | "blocked" | "off" | "ignored" {
    if (this.state === "intro") {
      if (this.startRequested) return "ignored";
      this.startRequested = true;
      this.t0 = tMs;
      return "start";
    }
    const b = this.board;
    if (this.state !== "puzzle" || !b || this.pendingBoard || this.finishedAt !== null) return "ignored";
    this.lastTap = tMs;
    const kind = judgeTap(b.puzzle, b.at, cell);
    this.taps.push({ tMs: this.rel(tMs), cell, kind });
    if (kind === "blocked" && cell) this.hooks.onBlocked?.(tMs, cell);
    if (kind !== "move" || !cell) return kind;

    this.moves += 1;
    this.firstMoveMs ??= tMs;
    b.at = cell;
    const seed = b.puzzle.seeds.find((s) => same(s, cell) && !b.taken.some((t) => same(t, s)));
    if (seed) b.taken.push(seed);
    this.hooks.onMove?.(tMs, b, !!seed);
    if (b.taken.length === b.puzzle.seeds.length) this.finishedAt = tMs;
    return "move";
  }
}
