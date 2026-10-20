# Route Planner (FR-64), PR notes

Optional mini-game, row 6 of research/04 section 5 (outside the 15 minute core): plan a path that collects 4 seeds
in the fewest moves; 4 puzzles; measures extra moves and planning time (IA5). Luma flies one square per tap.

## Parameters

| Parameter | Value | Source |
|---|---|---|
| Puzzles | 4 measured, 4 seeds each | research/04 section 5 |
| Measures | extra moves (moves minus the fewest possible), planning time (first move minus board onset) | research/04 section 5 |
| Board | 5 x 5 squares, rocks block a square | TODO, design choice |
| Puzzles themselves | found by a search over random boards: on boards 1 and 2 walking to the nearest seed is already a fewest-moves route, on boards 3 and 4 it costs 2 and 3 extra moves | TODO, design choice (logic.test.ts checks the gaps) |
| Moves | one square up, down, left or right per tap | TODO, design choice |
| Practice | 1 board with 2 seeds, not recorded, hand points along a fewest-moves route | design choice (practice before every measured task) |
| Idle timeout | a board ends unsolved after 30 s without a tap | TODO, design choice |
| Sound | none yet | TODO |

## Result shape and PC-02

`RoutePlannerResult` (types.ts) is local, shaped like the PC-02 proposal (`id`, `version`, `params`, `puzzles`) plus a
`summary`, as Bridge Wait and Star Path do. research/04 lists no `route_planner` entry in the proposed `minigames`
block yet, so packages/contracts is untouched.

Per puzzle: fewest moves, moves, extra moves, solved, onset (the `requestAnimationFrame` timestamp of the frame
that first draws the board), first move and planning time, and every tap (`pointerdown` `event.timeStamp`, the
square, and `move`, `blocked` for a rock next to Luma, or `off` for anything else).

## Design choices that protect the measure

- **No failure feedback.** Every board ends with the same "all seeds collected" line whatever the route; no move
  counter, score or best-route reveal is ever shown (adhdcheck-dev skill).
- **Calm board.** Nothing moves while the child plans; only Luma glides one square per tap. The open squares next
  to Luma show a faint ring so the child knows where a tap goes, without hinting at the best route (the hand only
  appears in practice).
- **Touch targets.** Squares are at least about 80 px on a 520 px wide screen, far above the 44 px minimum.

## Checked

- Unit tests (16): the fewest-moves solver, the 4 boards and their nearest-seed gaps, tap judging, the practice hint,
  the summary, and the runner driven frame by frame (onset is a frame time, planning time from the first move,
  practice not recorded, off and blocked taps counted without moving Luma, idle timeout).
- Seen failing: onset not taken from the frame, diagonal taps accepted as moves, practice recorded.
- Headless Chrome at 520 x 1000, 1024 x 768 and 1440 x 900: start, practice with the hand, a board in progress,
  played through to the end screen by tapping squares.
- Not yet: the demo tablet.
