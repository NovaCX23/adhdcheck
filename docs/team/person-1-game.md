# Person 1: Game developer

You build the game the child plays. One story (Luma the firefly keeper), mini-games, timing, and the session data the game sends at the end.

## Read first (30 minutes)

1. `docs/04-work-split.md`: the team, the decisions, the milestones.
2. `research/04-game-design-symptom-mapping.md`, section 5 (mini-game designs) and section 7 (code: trial loop and metrics).
3. `research/03-tech-stack.md`, section 2 (timing in the browser) and section 11 (hand-off contracts).
4. `docs/02-specification-cahier-des-charges.md`, sections 4.1 and 4.1b (your requirements, each with its test).

## You own

- Folder: `packages/game` (Phaser 4, TypeScript).
- Requirements: FR-01 to FR-16, FR-60 to FR-64.

## Build order

| Step | Task | Done when |
|---|---|---|
| 1 | Scaffold Phaser 4 + TypeScript. Bare Lantern Watch loop (go/no-go). Stimulus onset from the `requestAnimationFrame` frame that draws it; response from `pointerdown` `event.timeStamp`. Never `click`. | A tap on the demo tablet logs a trial with a reaction time |
| 2 | Calibration block (10 taps) and the practice round | Calibration median appears in the session data |
| 3 | Emit a valid `SessionMetrics` v1 (contract from Person 2) and post it to the API (URL from Person 3) | The API accepts the session from the tablet |
| 4 | Demo round of 60 to 90 seconds, full screen, no failure screens | Plays end to end on the demo tablet |
| 5 | Call `startSensors()` from Person 2 at game start, if the parent allowed camera or microphone | The game runs the same with permission on or refused |
| 6 | Storm Watch, then the other mini-games if time allows (Should, then Could) | Each one records its trials |

## Rules for you

- The child never sees a result, a score or a ranking.
- No ads, purchases or external links in the game.
- Every visible text comes from Person 4. Do not write your own wording.
- Test on the demo tablet, not only on your laptop.

## You depend on

- Person 2: the `SessionMetrics` contract (by H+6) and `startSensors()`.
- Person 3: the deployed API URL.
- Person 4: the texts and the story lines.
