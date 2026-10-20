# Bridge Wait: third-party assets

Every file below was downloaded on 2026-10-19. The licence was read on the asset's kenney.nl page and in the `License.txt` inside the downloaded pack ("License: (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/ ... free to use in personal, educational and commercial projects"). CC0 allows commercial use and redistribution in this public repository; credit is optional and is given here. The Kenney logo is not used.

Files are self-hosted under `apps/web/public/games/bridge-wait/audio/`, converted from Ogg Vorbis to mono MP3 (96 kbit/s, ffmpeg libmp3lame) because Safari's `decodeAudioData` support for Ogg is not confirmed (NOTES.md).

| Shipped file | Original file | Pack | Source page | Licence |
|---|---|---|---|---|
| start-pluck.mp3 | pluck_002.ogg | Interface Sounds 1.0, Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| arrive-sparkle.mp3 | glass_002.ogg | Interface Sounds 1.0, Kenney | https://kenney.nl/assets/interface-sounds | CC0 1.0 |
| step-wood-0.mp3 | footstep_wood_000.ogg | Impact Sounds, Kenney | https://kenney.nl/assets/impact-sounds | CC0 1.0 |
| step-wood-1.mp3 | footstep_wood_001.ogg | Impact Sounds, Kenney | https://kenney.nl/assets/impact-sounds | CC0 1.0 |
| step-wood-2.mp3 | footstep_wood_002.ogg | Impact Sounds, Kenney | https://kenney.nl/assets/impact-sounds | CC0 1.0 |
| jingle-ready.mp3 | Steel jingles/jingles_STEEL10.ogg | Music Jingles, Kenney | https://kenney.nl/assets/music-jingles | CC0 1.0 |
| jingle-done.mp3 | Steel jingles/jingles_STEEL02.ogg | Music Jingles, Kenney | https://kenney.nl/assets/music-jingles | CC0 1.0 |

The Digital Audio pack (https://kenney.nl/assets/digital-audio, CC0) was downloaded and checked but nothing from it is shipped.

## Made in this repo (no third-party licence)

- Luma, the crow, the bridge, lanterns, trees, rocks, flowers, mushrooms, hills, moon and stars: built in code from three.js primitives (`luma.ts`, `world.ts`).
- Glow, shadow and water-ripple textures: drawn at runtime on a canvas (`world.ts`).
- The practice hand: an SVG drawn in `ui.ts`.
- Go chime, Luma's babble and the river ambience: synthesised with the Web Audio API (`audio.ts`).

## Libraries

- three 0.186.1, MIT (https://github.com/mrdoob/three.js/blob/dev/LICENSE), npm dependency of `@adhdcheck/game`.
