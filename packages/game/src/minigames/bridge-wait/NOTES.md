# Bridge Wait (FR-62), PR notes

Mini-game 4 of research/04 section 5: Luma explains, a chime (and the bridge lanterns lighting up) means "cross". Taps during the narration are intrusion taps, taps before the cue are premature taps.

## Result shape and PC-02

`BridgeWaitResult` (types.ts) is defined locally, shaped like the PC-02 proposal (`id`, `version`, `params`, `trials`) plus a `summary`. The `minigames` block of `SessionMetrics` is PROPOSED, not agreed (docs/02 section 10.3), so packages/contracts is untouched. It maps to PC-02 once the team agrees. Field names here are camelCase; the contract uses snake_case in its trial lines (TODO at mapping time: rename, and decide whether `summary` is emitted or recomputed by scoring).

`RESULT_VERSION` is 0.2.0: same shape as 0.1.0, but every onset (narration start, narration end, cue) is now the `requestAnimationFrame` callback timestamp of the frame that draws it (research/03 section 2, method 4), where 0.1.0 used `performance.now()` inside Phaser's update.

## 3D rebuild: research findings (2026-10-19)

### Engine

| Option | Version checked (npm, 2026-10-19) | Licence | React 19 | Notes |
|---|---|---|---|---|
| three | 0.186.1 | MIT | not needed (plain DOM canvas) | about 168 kB min+gzip for 0.175 per Bundlephobia, cited by [utsubo](https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison) |
| @react-three/fiber + drei | 9.8.2 + 10.7.9 | MIT | peer `react >=19 <19.4` (repo has 19.3.0), drei peer `@react-three/fiber ^9` | adds a React reconciler on top of three |
| @babylonjs/core | 9.31.0 | Apache-2.0 | n/a | about 1.4 MB min+gzip for 8.1.1 per Bundlephobia (same source), modular |
| playcanvas | 2.23.3 | MIT | n/a | about 300 kB in one comparison table, not confirmed at a primary source |

Traps searched:
- Next.js App Router: `ssr: false` in `next/dynamic` works only from a Client Component, and is ignored when combined with `suspense: true` ([Next.js lazy loading](https://nextjs.org/docs/app/guides/lazy-loading), [invalid-dynamic-suspense](https://nextjs.org/docs/messages/invalid-dynamic-suspense)). The page already loads the canvas this way, and the three.js scene module is itself imported lazily inside `mountBridgeWait`, so nothing touches `window` on the server and the other pages that import `@adhdcheck/game` do not pull three.
- iOS WebGL context loss: reported on backgrounding Safari on iPadOS 17 ([three.js forum](https://discourse.threejs.org/t/context-lost-when-backgrounding-safari-on-ios-17-developer-beta-8/55772)), on buffer upload on iOS 18 ([WebKit 289601](https://bugs.webkit.org/show_bug.cgi?id=289601), duplicate of [286297](https://bugs.webkit.org/show_bug.cgi?id=286297), traced to a `flat` varying), and when switching between three.js pages ([WebKit 290623](https://bugs.webkit.org/show_bug.cgi?id=290623), still NEW). Applied: `webglcontextlost` calls `preventDefault()` and pauses the loop, `webglcontextrestored` resumes it; no custom shader uses `flat`; the renderer is disposed and `forceContextLoss()` is called on unmount.
- Pixel ratio: a forum report of a simple scene dropping to about 40 fps on iOS at full `devicePixelRatio` ([three.js forum](https://discourse.threejs.org/t/low-fps-on-ios-mobile-with-pixel-ration-set-as-window-devicepixelratio/4963)); guides cap it at 1.5 to 2. Applied: cap at 2 (brief), measured on the tablet later (TODO).
- Ogg on iOS: Safari has historically not decoded Ogg Vorbis in `decodeAudioData` ([oggmented](https://www.npmjs.com/package/oggmented)); Ogg playback arrived in iOS 18.4 per [MacG](https://www.macg.co/macos/2026/02/apple-ajoute-le-support-de-logg-vorbis-en-douce-dans-macos-et-ios-avec-une-lecture-native-306585) but `decodeAudioData` was not confirmed. Applied: the Kenney Ogg files are converted to MP3 before shipping.
- Pointer events on the canvas: the listener is a native `pointerdown` on the game container (not a three.js raycast and not `click`), `touch-action: none`, timestamp from `event.timeStamp`.

**Planned Phaser with drawn shapes, found three.js, R3F, Babylon.js and PlayCanvas, chose plain three.js because** it is the smallest MIT 3D engine of the four, it keeps `mountBridgeWait(parent)` framework-free like the other mini-games, and owning the `requestAnimationFrame` loop lets the cue be applied and rendered in the one callback whose timestamp is recorded, which R3F's `useFrame` would also allow but behind a reconciler we do not need.

### Assets (full list with URLs: ASSETS.md)

- 3D: none downloaded. The hero (Luma), the crow, the bridge, trees, rocks, flowers and lanterns are built procedurally from rounded primitives with toon shading, so there is no model licence to carry and nothing looks like an existing character.
- Sound: Kenney Interface Sounds, Impact Sounds and Music Jingles, CC0, licence read on each kenney.nl page and in each pack's License.txt. The go chime and the river ambience are synthesised with Web Audio (no file).

### Game feel: the 10 tips applied

Sources: Jonasson and Purho, "Juice it or lose it", Nordic Game Jam 2012, as summarised by [rpgplayground](https://rpgplayground.com/research-making-a-juicy-game/); the 12 animation principles in games ([Game Developer](https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games), [UW CSE 457](https://courses.cs.washington.edu/courses/cse457/13sp/lectures/animation.pdf)); onboarding guidance from [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/onboarding.md) and the "less text, more visuals" study ([paper](https://astro.paperswithcode.com/paper/less-text-more-visuals-evaluating-the)); open-ended play without scores or levels ([TechCrunch on Toca Boca](https://techcrunch.com/2017/07/10/kids-app-maker-toca-boca-debuts-its-first-consumer-product-collection-at-target/)). Tips 9 and 10 are our design judgement, not sourced.

1. Squash and stretch, volume preserved: Luma stretches on take-off and squashes on landing (Game Developer).
2. Anticipation, kept short: a 90 ms crouch before the jump (UW: anticipation directs attention; do not dwell).
3. Easing everywhere: every move uses ease-out or ease-in-out curves, never linear (Juice it or lose it: tweening). The UI (bubble, button) eases out with no overshoot, per the adhdcheck-dev motion rule; only Luma's body squashes and stretches.
4. Layered sound: wood footstep per hop, a sparkle on arrival, a jingle between rounds (Juice it or lose it: sound).
5. Particles, but few: a small sparkle burst on arrival and a firefly firework at the end only (Juice it or lose it warns on particle counts).
6. Secondary motion: antennae and wings lag and flutter during the jump; Luma blinks and breathes when idle.
7. Show, do not tell: in the practice round an animated hand taps when the lanterns light (Apple HIG: understand by experiencing; study: visuals over text).
8. Reward without score: the same happy hop and sparkle for every cross, a firefly celebration at the end, no number, star count or level (Toca Boca).
9. No camera shake and no flashing during the wait: the go signal must be the only salient change (adhdcheck-dev skill, calm design).
10. Things that read as cheap and are avoided: flat unlit colours, hard-edged primitives, a teleporting character, text labels like "tap here", silent actions. Here: toon lighting with outlines, rounded shapes, Luma crosses back and forth instead of jumping back, every action has a sound.

## 3D rebuild: design

Story fit (research/04): Luma the firefly keeper, night forest.

- **Scene.** Twilight river valley, seen slightly from above. Left bank and right bank (grass, rocks, mushrooms, round trees), a river with slow ripples between, a wooden rope bridge across the middle of the screen with lantern posts. Moon, static stars and soft hills behind. The bottom of the screen is near-bank grass: the tap area, no label.
- **Luma.** Original creature: round teal body, cream belly, very big eyes with highlights, rosy cheeks, two antennae with soft glowing tips, small translucent wings, little feet. Not yellow, no goggles, no overalls, nothing from any existing character.
- **Intro.** Luma waves; a large round play button (icon) and the `start` text in a speech bubble. Drifting decorative fireflies.
- **Practice intro.** `practiceIntro` bubble, then three practice trials.
- **Narration.** Speech bubble with the `narration` text; Luma's mouth opens and closes and the body bobs; a soft synthesised babble (no words). Decorative fireflies fade out.
- **Waiting.** Bubble gone. Luma breathes and blinks. River ripples are slow and low contrast, trees do not sway. Nothing flashes, nothing moves near the bridge, no sound event (only a steady low river noise).
- **Go.** In one frame every bridge lantern switches from dark glass to bright gold with a halo, and a point light washes the planks gold; the synthesised chime plays in the same callback. The halo then breathes gently while the window is open. Works muted.
- **Cross.** First tap in the go window: short crouch, then Luma hops across the bridge (squash and stretch, footstep per hop, wings flutter), lands with a sparkle burst. Identical for every cross. Next trial Luma waits on the side where it is, so it crosses back the other way.
- **Taps outside the go window.** No visible or audible reaction (unchanged from 0.1.0). TODO team decision: whether a neutral reaction would help a child who thinks the game is broken, weighed against teaching the timing.
- **Between rounds.** After practice, the `realIntro` bubble and a short rising jingle.
- **End.** Firefly fireworks above the river, Luma jumps happily, the `done` bubble, a rising jingle. No score.
- **Crow (stop-signal, flag off).** A round dark bird pops up on the middle post of the bridge.
- **Reduced motion.** `prefers-reduced-motion` turns off the drifting fireflies, the fireworks motion and the camera drift; the lantern cue is unchanged.

## Earlier search findings (0.1.0, still valid)

- Timing: native `pointerdown` listener and `event.timeStamp` so the response does not depend on an engine input queue; `touch-action: none` on the game surface.
- Chime: Web Audio oscillators through a gain envelope, no audio file.
- iOS Safari: the AudioContext is created and resumed inside the first `pointerdown`. Silent when the ringer switch is off (so the visual cue is always drawn), and a 2025 WebKit report of `resume()` never returning in a home-screen web app on iOS 26 (unverified whether fixed). Test on the demo tablet.

## Design choices and TODOs (no sourced value)

- Narration length 2500 ms, go window 2000 ms, between-trial pause 1000 ms, practice intro 2000 ms, between-rounds pause 1500 ms: TODO design choices (04 gives only 24 trials and wait 1.5 to 4 s).
- Stop-signal: flag OFF by default (`stopSignal`, dev route `?stop=1`). 25 percent of trials (6 of 24, fixed count, seeded shuffle). Crow delay 250 ms is a placeholder; the staircase and SSRT are TODO (04: parameters TODO).
- Texts in strings.ts: TODO texts owner review. The narration sentence is long for a 2.5 s bubble and a non-reader: TODO texts owner and a recorded voice line sized to the narration window.
- Tap boundaries: start-inclusive. A tap exactly at the cue onset is a cross, 1 ms before is premature, exactly at narration end is waiting.
- Several taps in one trial are all kept. RT is from the first go-window tap. Premature-tap rate is the share of scored trials with at least one premature tap. SD is the sample SD.
- Practice: 3 trials, same loop, never recorded. No score, number or failure screen is shown to the child.
- Taps count anywhere on the game surface (the lower half is the visual tap zone, the hand points there).
- Dev query parameters (`?seed=`, `?trials=`, `?stop=1`) and the JSON panel work in development builds only.
- Jingles were chosen by a rising pitch contour estimated by FFT, not by a person listening: TODO listen and confirm none sounds sad.
- TODO on the demo tablet: frame rate, context loss on backgrounding, and what happens to a trial when the tab is hidden mid-trial (the rAF loop stops).
