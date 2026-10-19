# Bridge Wait (FR-62), PR notes

Mini-game 4 of research/04 section 5: Luma explains, a chime (and the bridge lighting up) means "cross". Taps during the narration are intrusion taps, taps before the cue are premature taps.

## Result shape and PC-02

`BridgeWaitResult` (types.ts) is defined locally, shaped like the PC-02 proposal (`id`, `version`, `params`, `trials`) plus a `summary`. The `minigames` block of `SessionMetrics` is PROPOSED, not agreed (docs/02 section 10.3), so packages/contracts is untouched. It maps to PC-02 once the team agrees. Field names here are camelCase; the contract uses snake_case in its trial lines (TODO at mapping time: rename, and decide whether `summary` is emitted or recomputed by scoring).

## Search findings (planned X, found Y, chose Y because Z)

- Phaser input timestamp: Phaser 3.88 docs say `Pointer.time` comes directly from the DOM `event.timeStamp`, and `pointer.event` holds the native event. No Phaser 4 page confirming this was found, and 04 section 7 says Phaser 4 loop internals are unverified. Chose a native `pointerdown` listener on the game canvas and read `event.timeStamp` (as 04 section 7.1 does), so the response time does not depend on Phaser's input queue. `touch-action: none` is set on the canvas.
- Phaser timers: the scene runs its own state machine in `update()`, which Phaser calls from its requestAnimationFrame loop, comparing `performance.now()`. No `delayedCall`, so no timer drift between the cue and the frame that draws it. Chime onset is `performance.now()` in the `update()` call that applies the visual cue, drawn in that same frame. Not verified against a real display: true on-screen onset cannot be measured in a browser (research/03 section 2.1).
- Chime: Web Audio, two sine oscillators (880 and 1320 Hz, design choice) through a gain envelope, no audio file.
- iOS Safari: the AudioContext is created and resumed inside the first `pointerdown` (`Chime.unlock`). Reports found: silent when the ringer switch is off (so the visual cue is always drawn), and a 2025 WebKit report of `resume()` never returning in a home-screen web app on iOS 26 (unverified whether fixed). Test on the demo tablet.

## Design choices and TODOs (no sourced value)

- Narration length 2500 ms, go window 2000 ms, between-trial pause 1000 ms: TODO design choices (04 gives only 24 trials and wait 1.5 to 4 s).
- Stop-signal: flag OFF by default (`stopSignal`, dev route `?stop=1`). 25 percent of trials (6 of 24, fixed count, seeded shuffle). Crow delay 250 ms is a placeholder; the staircase and SSRT are TODO (04: parameters TODO).
- Texts in strings.ts: TODO texts owner review.
- Tap boundaries: start-inclusive. A tap exactly at the cue onset is a cross, 1 ms before is premature, exactly at narration end is waiting.
- Several taps in one trial are all kept. RT is from the first go-window tap. Premature-tap rate is the share of scored trials with at least one premature tap. SD is the sample SD.
- Practice: 3 trials, same loop, never recorded. No score, number or failure screen is shown to the child.
- Dev query parameters (`?seed=`, `?trials=`, `?stop=1`) and the JSON panel work in development builds only.
- Layout is a fixed 800 by 600 canvas scaled to fit; portrait phones get bars. TODO: fixed orientation and full screen with the app shell.
