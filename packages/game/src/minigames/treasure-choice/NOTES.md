# Treasure Choice (FR-63), PR notes

Mini-game 5 of research/04 section 5 (HI8, difficulty waiting): a simple choice-delay task. A treasure chest floats
up the river in front of Luma and opens; the child picks one gem now (the gem on the stepping stone, left) or two
gems when the boat arrives (the boat, right, whose mast lantern fills with light while it sails in). Built on the
Bridge Wait stack (three.js, Luma, world, sound samples): see `../bridge-wait/NOTES.md` for the engine choice, the
iOS WebGL and audio traps and the game-feel rules, which apply here unchanged.

## Task design: what the literature does (searched 2026-10-20)

Sources (PubMed records retrieved and checked with the PubMed metadata tool; only abstracts read unless stated):

- Sonuga-Barke EJ, Taylor E, Sembi S, Smith J. Hyperactivity and delay aversion I: the effect of delay on choice.
  J Child Psychol Psychiatry 1992;33(2):387-98. PMID 1564081, https://doi.org/10.1111/j.1469-7610.1992.tb00874.x.
  Hyperactive children preferred the small reward when the session was a fixed number of trials (so choosing small
  shortened it), but not when the session was a fixed time.
- Kuntsi J, Oosterlaan J, Stevenson J. Psychological mechanisms in hyperactivity I. J Child Psychol Psychiatry
  2001;42(2):199-210. PMID 11280416 (no DOI in the PubMed record). Origin of the Maudsley Index of Delay Aversion
  (MIDA), per Marco 2009.
- Marco R, et al. Delay and reward choice in ADHD: an experimental test of the role of delay aversion.
  Neuropsychology 2009;23(3):367-80. PMID 19413450, https://doi.org/10.1037/a0014914. MIDA: "SS (1 point after 2 s)
  and LL reward (2 points after 30 s)"; 360 ADHD probands, 349 siblings, 112 controls aged 6 to 17. "ADHD
  participants chose SS more than controls under both conditions. This effect was larger when SS choice reduced
  trial delay."
- Paloyelis Y, Asherson P, Kuntsi J. Are ADHD symptoms associated with delay aversion or choice impulsivity?
  J Am Acad Child Adolesc Psychiatry 2009;48(8):837-46. PMID 19564796, https://doi.org/10.1097/CHI.0b013e3181ab8c97
  (full text read on PMC2788754): 1,062 children aged 7.9 to 10.9; "Two conditions, each with 20 trials"; small
  reward = one point after a 2 s pre-reward delay, large = two points after 30 s; in the post-reward-delay
  condition "choosing the small reward led to a delay period of 30 seconds and choosing the large reward to a delay
  period of 2 seconds before the next trial ... therefore the overall delay was constant and independent of choice
  made". What the child sees during the delays and the practice trials are not described there (it refers to
  Kuntsi et al. 2006, not read).
- Solanto MV, et al. The ecological validity of delay aversion and response inhibition as measures of impulsivity
  in AD/HD. J Abnorm Child Psychol 2001;29(3):215-28. PMID 11411784, https://doi.org/10.1023/a:1010329714819.
  Choice-Delay Task correlated with teacher ratings and classroom observations (parameters not in the abstract).
- Scheres A, et al. Temporal reward discounting in ADHD. Biol Psychiatry 2010;67(7):641-8. PMID 20034616,
  https://doi.org/10.1016/j.biopsych.2009.10.033. Steep discounting linked to hyperactivity-impulsivity, "especially
  when reward magnitude at the trial level was small".
- Already in research/04: PMID 26602954 (choice impulsivity g = 0.47), PMID 29806533 (simple choice paradigm,
  real rewards), PMID 30596297 (sex differences), PMID 25956255 (age windows).

## The trap the search found, and what it means for FR-63

The fairness rule asked for (total time constant whichever option is chosen) is exactly the MIDA
**post-reward-delay** condition. Sonuga-Barke 1992 found no group difference under a fixed-time constraint, and
Marco 2009 found the ADHD effect present under both conditions but larger when choosing small shortens the task.
So this design measures choice impulsivity (preference for immediacy) and deliberately removes the delay-aversion
component (escaping the wait). This follows research/04 and docs/02 as written; whether to add the second MIDA
condition (choosing "now" shortens play) is a **team decision**, not taken here.

**Planned** my own filler logic, **found** the MIDA post-reward-delay structure (pre-delay + post-delay = the same
slot for both options), **chose** MIDA's structure because it is the published way to hold total time constant,
and it gives one sourced value (the 2 s small-reward delay).

## Parameters

| Parameter | Value | Source |
|---|---|---|
| Choices | 10 | research/04 section 5 |
| Rewards | 1 gem now, 2 gems after the wait | research/04 section 5 (MIDA uses 1 and 2 points) |
| "Now" pre-reward delay | 2000 ms | MIDA (PMID 19413450, PMID 19564796) |
| "Later" pre-reward delay | 8000 ms | **design choice, TODO validate**. MIDA uses 30 s; 10 choices x 32 s would be over 5 minutes against the about 2 minute budget in research/04 |
| Slot from the choice to the end of the choice | 10000 ms = 2000 + 8000, both options | MIDA post-reward-delay structure; the values are the two above |
| Post-reward delay | 8000 ms after "now", 2000 ms after "later" | follows from the slot |
| Practice | 2 forced choices (only the stone, then only the boat), not recorded | **design choice, TODO validate** (brief: practice before every measured task; lets the child experience both delays once) |
| Chest appearing before each offer | 1500 ms | **design choice, TODO** |
| Practice intro / between rounds | 2500 ms / 2200 ms | **design choice, TODO** |
| Seed | cosmetic only: picks the gem colour of each chest; delays, sides and rewards never change | design choice |
| Option sides | stone (now) always left, boat (later) always right | **design choice, TODO**: a fixed side helps a non-reader; side bias is not counterbalanced |

Session length with the defaults: about 2.5 minutes at 1 s decisions (fixed parts plus the child's own decision
times), above the "about 2 min" of research/04: TODO team check.

## Constant-time rule (FR-63 acceptance)

The gems come `preDelay` after the choosing tap and the choice ends `slotMs` after that same tap, for either
option (runner.ts). Every other part (chest, intro, between) is fixed. So an all-now and an all-later run with the
same seed and the same decision times end on the same frame: `runner.test.ts` "takes exactly the same total time"
proves it exactly at 16 ms, 60 Hz and 120 Hz frame grids, and a mutation run (removing the post-reward filler)
makes that test and the slot test fail. Only the child's own decision time changes the session length.

## Result shape and PC-02

`TreasureChoiceResult` (types.ts) is local, shaped like the PC-02 proposal (`id`, `version`, `params`, `trials`)
plus a `summary`, as Bridge Wait and Star Path do (same conventions adopted from `origin/feat/FR-61-star-path`:
kebab-case `id`, snake_case `params`, camelCase trial fields, a renamed `summarise` export to avoid a name clash in
the package index, the scene imported lazily in `mount.ts`, sounds shared from `/games/bridge-wait`). The
`minigames` block of `SessionMetrics` is PROPOSED, not agreed (docs/02 section 10.3), so packages/contracts is
untouched. research/04 proposes `{ immediate_choices, n_choices }`: both are in `summary` (`immediateChoices`,
`nChoices`).

- Per choice: `choice` (now or later), `delayChosenMs`, `delayOfferedMs`, `gems`, `offerOnsetMs` (the
  `requestAnimationFrame` timestamp of the frame that first draws the options), `choiceMs` (pointerdown
  `event.timeStamp`), `decisionMs`, `rewardMs`, `slotEndMs`, every other tap with its phase, `waitTaps`
  (pre-reward), `restTaps` (post-reward), `offTargetTaps` (between the options, or stamped before the offer frame).
- Summary: `proportionLater`, `immediateChoices`, `laterChoices`, `medianDecisionMs`, `waitTaps`, `restTaps`.
- Taps during waits are recorded and never change anything on screen.

## Differences from Star Path conventions

- `Particles` is copied into `particles.ts`: Star Path imports it from `../bridge-wait/scene`, which exports it only
  on the Star Path branch. Exporting it here would have meant editing Bridge Wait. TODO: move it to `../shared`
  once both branches merge.
- No new audio files: the Bridge Wait samples are reused through `assetBase` (as Star Path does), so
  `apps/web/public/games/treasure-choice/` is not created.

## Design (what the child sees)

- **Intro.** Luma hovers in front of the bridge rail (so no rope crosses its face), waves; the play button.
- **Chest.** A chest rises from the river in front of Luma and opens with a sparkle; a short narration bubble.
- **Offer.** Left: a mossy stepping stone with one gem. Right: a little boat with two gems and an unlit mast
  lantern. Soft glow rings on the water under both. Tap anywhere on the left or right half (big targets; a 6 percent
  dead zone on the centre line chooses nothing). Practice: only one option shown, with the animated hand on it.
- **Wait.** After "now", the gem floats from the stone to Luma over 2 s. After "later", the boat sails in beside
  Luma over 8 s while its lantern fills with light (the gentle timer). The option not taken shrinks away. No extra
  tap is needed; Luma rocks gently and watches.
- **Collect.** The gems fly into Luma's bag at the top of the screen and pile up inside it. The same hop, sparkle
  and sound for one gem or two (research/04 section 4.3: identical feedback). No number, no count, no progress bar.
- **Rest.** Calm fireflies drift; nothing to do until the next chest.
- **End.** Firefly fireworks, Luma celebrates, the bag full of gems, the `done` bubble.
- **Reduced motion.** No drifting fireflies, fireworks, camera drift or hover float.

## Open TODOs

- Texts in strings.ts: texts owner review (placeholder, no digits, no hint that one option is better).
- Later delay (8 s), practice design, chest time, session length: validate with the team.
- Whether to add the MIDA no-post-reward-delay condition (delay aversion): team decision.
- No offer timeout: a child who never chooses holds the game on the offer. TODO decide a gentle re-prompt.
- Sides fixed, not counterbalanced: TODO decide.
- On the demo tablet: frame rate (the automation browser here ran both Bridge Wait and Treasure Choice at about
  1.5 fps until the window was brought to the front, then about 32 fps), context loss on backgrounding.
