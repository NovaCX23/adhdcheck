# Treasure Choice: assets

No third-party file is added by this mini-game.

## Reused from Bridge Wait (licences listed in ../bridge-wait/ASSETS.md)

- Sound samples, served from `/games/bridge-wait/audio/` through `assetBase` (the convention Star Path uses):
  `start-pluck.mp3` (choice tap, start), `arrive-sparkle.mp3` (chest opens, gem lands), `jingle-ready.mp3`
  (between rounds), `jingle-done.mp3` (end). All Kenney, CC0 1.0, licence verified at source in
  ../bridge-wait/ASSETS.md.
- Luma (`../bridge-wait/luma.ts`), the river valley and bridge (`../bridge-wait/world.ts`), Luma's babble and the
  river ambience (`../bridge-wait/audio.ts`): made in that repo folder, no third-party licence.

## Made in this folder (no third-party licence)

- Gems, stepping stone, boat with its lantern, treasure chest: built in code from three.js primitives (`props.ts`).
- Luma's bag, the gem icons in it and the practice hand: SVG drawn in `ui.ts` (the hand is the Bridge Wait one).
- Particles: `particles.ts`, copied from `../bridge-wait/scene.ts`.

## Libraries

- three 0.186.1, MIT (https://github.com/mrdoob/three.js/blob/dev/LICENSE), already a dependency of
  `@adhdcheck/game`. No new dependency.
