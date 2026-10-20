# Star Path (FR-61), PR notes

Mini-game 3 of research/04 section 5: Corsi-style sequence repetition. Stars light up one by one in the night
sky; the child taps them in the same order. Built on the Bridge Wait stack (three.js, Luma, sound samples), see
`../bridge-wait/NOTES.md` for the engine choice, the iOS WebGL and audio traps, and the game-feel rules.

## Parameters

| Parameter | Value | Source |
|---|---|---|
| Start length | 2 | research/04 section 5 |
| Next length | +1 after a correct sequence | research/04 section 5 |
| Stop rule | 2 failures at one length | research/04 section 5 |
| Star rate | 1 star per 1000 ms (onset to onset, never shorter) | research/04 section 5 (marked design choice there) |
| Number of stars | 9 | design choice: the classic Corsi board has nine blocks; research/04 gives no number |
| Star lit time | 700 ms | TODO, design choice |
| Lead before the first star | 600 ms | TODO, design choice |
| Recall timeout | 12 s without a tap | TODO, design choice |
| Practice | 1 sequence of length 2, not recorded, hand points at the next star | design choice (brief: practice round before every measured task) |
| Device motion during encoding (HI1) | not captured: `motion: null` | TODO; research/04 notes the iOS permission prompt is unverified |

## Result shape and PC-02

`StarPathResult` (types.ts) is local, shaped like the PC-02 proposal (`id`, `version`, `params`, `trials`) plus a
`summary` (`span`, `errors`), as Bridge Wait does. The `minigames` block of `SessionMetrics` is PROPOSED, not
agreed (docs/02 section 10.3), so packages/contracts is untouched.

- `span`: the longest length repeated correctly (0 if none). `errors`: failed sequences (wrong star or timeout).
- Per sequence: the stars, each star's onset (the `requestAnimationFrame` timestamp of the frame that draws it lit),
  the recall start, every tap (`pointerdown` `event.timeStamp`, the star hit or null), the outcome, the position of
  the first wrong star, the time to the first tap and to the last correct tap, taps during the presentation
  (`earlyTaps`) and recall taps on no star (`offTargetTaps`).

## Design choices that protect the measure

- **Pitch follows the position in the sequence, never the star.** A star has no fixed note, so a melody cannot
  replace remembering where the stars were; the task stays visuospatial.
- **No failure feedback.** Every finished sequence, right or wrong, gets the same hop and sparkle. A recall tap
  on a star always lights it briefly. No score, level or counter is ever shown (adhdcheck-dev skill).
- **Calm sky.** While stars are shown and repeated, nothing else moves or lights up. The background dots are tiny,
  dim and static so they never read as stars to tap. Decorative motion (waving, star twinkle, fireworks) only on
  the start and end screens, and none with `prefers-reduced-motion`.
- **Touch targets.** Stars sit on a jittered 3 x 3 grid (layout.ts), at least a fifth of the field apart; a tap
  picks the nearest star within max(48 px, 1.5 x the star radius).

## Checked

- Unit tests (27): sequence building, the staircase, tap judging, summary, layout spacing, hit test, and the runner
  driven frame by frame (onsets are frame times at least 1000 ms apart, practice not recorded, early and
  off-target taps counted, timeout, times relative to the start tap).
- Headless Chrome (SwiftShader) at 520 x 1000, 1024 x 768 and 1440 x 900: start screen; driven over the DevTools
  protocol: practice intro, a lit star, the practice hand on the first star of the sequence.
- Not yet: the demo tablet (touch latency, frame rate, audio on iOS Safari).
