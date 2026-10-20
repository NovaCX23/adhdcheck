import { describe, expect, it } from "vitest";
import { hintStep, neighbours, same } from "./logic";
import { BETWEEN_MS, IDLE_TIMEOUT_MS, PRACTICE_INTRO_MS, RoutePlannerRunner } from "./runner";
import type { Cell, RoutePlannerResult } from "./types";

const FRAME = 16;

function setup() {
  let result: RoutePlannerResult | undefined;
  const onsets: number[] = [];
  const r = new RoutePlannerRunner({ onBoard: (ts) => onsets.push(ts), onComplete: (x) => (result = x) });
  let ts = 1000;
  const tick = (ms: number) => {
    for (const end = ts + ms; ts < end; ) {
      ts += FRAME;
      r.frame(ts);
    }
  };
  const tap = (cell: Cell | null, after = 300) => {
    tick(after);
    return r.pointerDown(ts - 3, cell);
  };
  // Walk the board along the hint route; `detour` adds a step out and back first.
  const solve = (detour = false) => {
    const b = r.board!;
    if (detour) {
      const away = neighbours(b.puzzle, b.at).find((n) => !b.puzzle.seeds.some((s) => same(s, n)))!;
      const back = b.at;
      tap(away);
      tap(back);
    }
    for (let step = hintStep(b.puzzle, b.at, b.taken); step; step = hintStep(b.puzzle, b.at, b.taken)) tap(step);
  };
  const toNextBoard = () => tick(BETWEEN_MS + 2 * FRAME);
  return { r, tick, tap, solve, toNextBoard, onsets, now: () => ts, result: () => result };
}

describe("RoutePlannerRunner", () => {
  it("runs start, practice (not recorded), then the 4 measured puzzles, and reports extra moves", () => {
    const s = setup();
    expect(s.tap(null)).toBe("start");
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    expect(s.r.board?.practice).toBe(true);
    s.solve();
    for (let k = 0; k < 4; k++) {
      s.toNextBoard();
      expect(s.r.board?.index).toBe(k);
      s.solve(k === 1); // one detour of 2 extra moves on the second puzzle
    }
    s.toNextBoard();
    const result = s.result()!;
    expect(s.r.state).toBe("done");
    expect(result.puzzles.map((p) => p.i)).toEqual([0, 1, 2, 3]);
    expect(result.puzzles.map((p) => p.extraMoves)).toEqual([0, 2, 0, 0]);
    expect(result.puzzles.every((p) => p.solved)).toBe(true);
    expect(result.summary.totalExtraMoves).toBe(2);
  });

  it("takes the onset from the frame that first draws the board and the planning time from the first move", () => {
    const s = setup();
    s.tap(null);
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    s.toNextBoard();
    const onset = s.onsets.at(-1)!;
    const startTap = 1000 + Math.ceil(300 / FRAME) * FRAME - 3; // the start tap's time
    const step = hintStep(s.r.board!.puzzle, s.r.board!.at, s.r.board!.taken)!;
    s.tap(step, 2000);
    const firstMove = s.now() - 3;
    s.solve();
    s.toNextBoard();
    for (let k = 1; k < 4; k++) {
      s.solve();
      s.toNextBoard();
    }
    const first = s.result()!.puzzles[0]!;
    expect(first.onsetMs).toBe(onset - startTap);
    expect(first.planningMs).toBe(firstMove - onset);
    expect(first.firstMoveMs).toBe(firstMove - startTap);
  });

  it("records taps on rocks and outside the board without moving Luma", () => {
    const s = setup();
    s.tap(null);
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    s.toNextBoard();
    const b = s.r.board!;
    const at = b.at;
    expect(s.tap(null)).toBe("off");
    expect(s.tap({ c: 4, r: 4 })).toBe("off");
    expect(s.r.board!.at).toEqual(at);
    s.solve();
    s.toNextBoard();
    for (let k = 1; k < 4; k++) {
      if (k === 3) {
        // Puzzle 4 has a rock at (4, 2), right of the seed at (4, 3); stand next to it and tap it.
        const r = s.r.board!;
        expect(s.tap({ c: 3, r: 3 })).toBe("move");
        expect(s.tap({ c: 3, r: 2 })).toBe("move");
        expect(s.tap({ c: 4, r: 2 })).toBe("blocked");
        expect(r.at).toEqual({ c: 3, r: 2 });
      }
      s.solve();
      s.toNextBoard();
    }
    const [p0, , , p3] = s.result()!.puzzles;
    expect(p0!.taps.filter((t) => t.kind === "off")).toHaveLength(2);
    expect(p3!.taps.some((t) => t.kind === "blocked")).toBe(true);
    expect(s.result()!.summary.offTaps).toBe(3);
  });

  it("ends a puzzle unsolved after a long pause, so the game always finishes", () => {
    const s = setup();
    s.tap(null);
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    s.toNextBoard();
    s.tick(IDLE_TIMEOUT_MS + 2 * FRAME);
    expect(s.r.state).toBe("between");
    for (let k = 1; k < 4; k++) {
      s.toNextBoard();
      s.solve();
    }
    s.toNextBoard();
    const [p0] = s.result()!.puzzles;
    expect(p0!.solved).toBe(false);
    expect(p0!.planningMs).toBeNull();
    expect(p0!.extraMoves).toBeNull();
    expect(s.result()!.summary.nUnsolved).toBe(1);
    expect(s.result()!.summary.totalExtraMoves).toBe(0);
  });

  it("ignores taps before the board is drawn and between puzzles", () => {
    const s = setup();
    s.tap(null);
    expect(s.r.pointerDown(s.now(), { c: 2, r: 3 })).toBe("ignored"); // practice intro still showing
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    expect(s.r.pointerDown(s.now(), { c: 2, r: 3 })).toBe("ignored"); // solved, ends on the next frame
    s.tick(FRAME);
    expect(s.r.state).toBe("between");
    expect(s.r.pointerDown(s.now(), { c: 2, r: 3 })).toBe("ignored");
  });

  it("does not let an unsolved board lower the total extra moves", () => {
    const s = setup();
    s.tap(null);
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    s.toNextBoard();
    s.solve(true); // puzzle 0: a detour of 2 extra moves
    s.toNextBoard();
    s.tick(IDLE_TIMEOUT_MS + 2 * FRAME); // puzzle 1: unsolved
    for (let k = 2; k < 4; k++) {
      s.toNextBoard();
      s.solve();
    }
    s.toNextBoard();
    const res = s.result()!;
    expect(res.puzzles.map((p) => p.extraMoves)).toEqual([2, null, 0, 0]);
    expect(res.summary.totalExtraMoves).toBe(2);
    expect(res.summary.nUnsolved).toBe(1);
  });

  it("ignores a tap stamped before the onset frame, so planningMs is never negative", () => {
    const s = setup();
    s.tap(null);
    s.tick(PRACTICE_INTRO_MS + 2 * FRAME);
    s.solve();
    s.toNextBoard();
    const b = s.r.board!;
    const step = hintStep(b.puzzle, b.at, b.taken)!;
    expect(s.r.pointerDown(s.now() - 50, step)).toBe("ignored");
    expect(s.r.pointerDown(s.now() - 50, step)).toBe("ignored");
    s.solve();
    for (let k = 1; k < 4; k++) {
      s.toNextBoard();
      s.solve();
    }
    s.toNextBoard();
    for (const p of s.result()!.puzzles) expect(p.planningMs!).toBeGreaterThanOrEqual(0);
  });
});
