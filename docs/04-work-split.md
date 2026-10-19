# 04 - Work split: who does what (start here if you are building)

Status: PROPOSAL, version 0.1, 2026-10-19. The team confirms names and swaps roles freely. The detailed requirements are in `docs/02-specification-cahier-des-charges.md`. The tracker is in `docs/03-progress-plan.md`.

## Decisions already taken (do not reopen without the team)

| ID | Decision | Date |
|---|---|---|
| D-01 | Orientation tool, not diagnosis. Expected class IIa maximum. The parent sees "A professional assessment is recommended" or "No specific follow-up indicated by this activity". Never an ADHD probability or a severity. | 2026-10-19 |
| D-02 | Missions are chosen by the parent or a professional. They are never assigned from the score. | 2026-10-19 |
| D-17 | **Web first, WITH camera and microphone** in the browser game. A native mobile app comes later. Camera and microphone are processed on the device. Only aggregate features (counts, durations) leave the device: no video, no audio, no frames. If permission is denied, the game still works without them. Details: `research/06-camera-microphone-acquisition.md`; requirements FR-70 to FR-74 in `docs/02` section 4.1c. P2 owns them; the 06 file holds an 8-hour plan for one developer. | 2026-10-19 |

## The team: 4 people (5th person splits P3)

| Person | Role | Owns | Folder | Requirements |
|---|---|---|---|---|
| P1 | Game developer | The Phaser game: story, mini-games, timing, session recorder | `packages/game` | FR-01 to FR-16, FR-60 to FR-64 |
| P2 | Sensors and scoring | Camera and microphone features on the device, the metrics contract, the scoring rules | `packages/sensors`, `packages/contracts`, `packages/scoring` | FR-09, FR-10, FR-20 to FR-26, plus the camera and microphone FRs (to add from research 06) |
| P3 | Backend and parent web app | Supabase (Frankfurt), auth, `/api/sessions`, Next.js dashboard, result card, Stripe test mode, email | `apps/web`, `supabase/` | FR-11, FR-30 to FR-50, FR-55, FR-56 |
| P4 | Clinical, regulatory, pitch | Intended purpose, all wording a parent or child sees, consent screens (camera and microphone too), parent questionnaire, business canvas, pitch and demo | `docs/`, `pitch/` | FR-34 to FR-36 texts, FR-43, NFR-50 to NFR-53 |

With a 5th person: P3 keeps the backend (Supabase, API, auth, row-level security) and P5 takes the parent web app (dashboard, result card, Stripe, email).

PROPOSAL: Hatem takes P4, because the regulatory and clinical wording is his field.

## First 2 hours: one concrete task each

| Person | Task | Done when |
|---|---|---|
| P1 | Scaffold Phaser 4 + TypeScript in `packages/game`. Build a bare Lantern Watch loop (go/no-go) that timestamps with `requestAnimationFrame` and `pointerdown` (`research/03-tech-stack.md`, section 4). | A tap on the demo tablet logs a trial with a reaction time |
| P2 | Write `packages/contracts` with `SessionMetrics` v1 and `ScoreResult` v1, copied from `docs/02` section 7. Add a test fixture. Start a camera probe: open the camera in the browser and print face present or absent. | The contract is merged; the probe runs on the demo tablet |
| P3 | Create the Supabase project in **Frankfurt** (the region cannot be changed later). Write the first migration (parents, children, sessions, scores) with row-level security. Scaffold Next.js with login. | A parent can sign up and sees an empty dashboard |
| P4 | Write the consent screen text (parent first, then the child-friendly camera and microphone explanation). Freeze the two result headlines. Ask the organisers which canvas version the jury scores (15 or 18 blocks). | Texts merged in `docs/`; jury answer recorded in `TODO.md` |

## Milestones (relative hours, replace with the real deadline)

| Milestone | When | Everyone checks |
|---|---|---|
| M1 Contracts frozen | H+6 | `SessionMetrics` and `ScoreResult` merged; the camera and microphone extension agreed as an optional block |
| M2 Walking skeleton | H+12 | A QR opens the game on the tablet, a session uploads, a score is saved, the parent sees the result card |
| M3 Feature complete | H+30 | Every Must requirement passes its test |
| M4 Rehearsal | H+44 | Demo run twice on the production URL with the demo tablet; a fallback recording is made |
| M5 Pitch | TODO: real slot | |

## Hand-offs (who waits for whom)

1. P2 delivers the contracts, then P1 emits sessions and P3 stores them. Nobody changes a contract after M1 without the team.
2. P2 delivers the camera and microphone features as one function, `startSensors()` returning a summary, and P1 calls it from the game.
3. P4 delivers every visible text, then P1 and P3 paste it unchanged. P4 reviews each PR that touches visible text.
4. P3 delivers the deployed URL, then P1 points the game upload at it.

## Rules

- One branch per task (`feat/FR-xx-name`), a pull request to `main`, one reviewer.
- No secrets in this public repo. Keys live in Vercel and in a local `.env.local` that is never committed.
- No real child data. Demo data are synthetic.
- No video, audio or frames are ever uploaded or stored.
