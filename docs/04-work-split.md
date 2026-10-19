# 04 - Work split: who does what (start here if you are building)

Status: PROPOSAL, version 0.2, 2026-10-19. The team is four people, all technical, and the hackathon builds **one web app only**. The team assigns names to Person 1 to 4 and may swap roles. Requirements: `docs/02-specification-cahier-des-charges.md`. Tracker: `docs/03-progress-plan.md`. How we code: `.claude/skills/adhdcheck-dev/SKILL.md`.

## Decisions already taken (do not reopen without the team)

| ID | Decision | Date |
|---|---|---|
| D-01 | Orientation tool, not diagnosis. Expected class IIa maximum. The parent sees "A professional assessment is recommended" or "No specific follow-up indicated by this activity". Never an ADHD probability or a severity. | 2026-10-19 |
| D-02 | Missions are chosen by the parent or a professional. They are never assigned from the score. | 2026-10-19 |
| D-17 | The game uses camera and microphone in the browser, processed on the device. Only aggregate features (counts, durations) leave the device: no video, no audio, no frames. If permission is denied, the game still works. Details: `research/06-camera-microphone-acquisition.md`; requirements FR-70 to FR-74 in `docs/02` section 4.1c. | 2026-10-19 |
| D-18 | **Hackathon scope: one web app only.** The child game runs inside it at `/play` in the tablet or phone browser; the parent pages are in the same app. Native mobile and tablet apps come after the hackathon. | 2026-10-19 |

## The four technical roles

| Person | Role | Owns | Folder | Brief |
|---|---|---|---|---|
| Person 1 | Game | The Phaser game inside the web app: story, mini-games, timing, session recorder | `packages/game`, mounted at `apps/web/app/play/` | [person-1-game.md](team/person-1-game.md) |
| Person 2 | Data: contracts, scoring, sensors | The JSON contracts, the scoring rules, camera and microphone features on the device | `packages/contracts`, `packages/scoring`, `packages/sensors` | [person-2-sensors-scoring.md](team/person-2-sensors-scoring.md) |
| Person 3 | Backend | Supabase (Frankfurt), migrations, row-level security, auth, `/api/sessions`, deployment, demo seed | `supabase/`, `apps/web/app/api/` | [person-3-backend.md](team/person-3-backend.md) |
| Person 4 | Parent web app | Landing page, sign-up, child profile, consent screen, QR, result card, missions, progress chart, Stripe test mode, email | `apps/web/app/` pages and components | [person-4-parent-webapp.md](team/person-4-parent-webapp.md) |

**Shared duty, not a role:** every visible text, the claims check and the pitch. One owner (TODO: name) holds it on top of their build work: [shared-texts-claims-pitch.md](team/shared-texts-claims-pitch.md).

## First 2 hours: one concrete task each

| Person | Task | Done when |
|---|---|---|
| Person 1 | Scaffold Phaser 4 + TypeScript in `packages/game`. Bare Lantern Watch loop (go/no-go) timestamped with `requestAnimationFrame` and `pointerdown` (`research/03-tech-stack.md`, section 2). | A tap in the tablet browser logs a trial with a reaction time |
| Person 2 | `packages/contracts` with `SessionMetrics` v1 and `ScoreResult` v1, copied from `docs/02` section 7, with valid and invalid fixtures. Then a camera probe in the browser printing face present or absent. | Contracts merged; the probe runs in the tablet browser |
| Person 3 | Supabase project in **Frankfurt** (cannot be changed later). First migration with row-level security. Deploy the empty app to Vercel with Person 4. | A parent can sign up on the production URL |
| Person 4 | Next.js layout and design tokens with Person 3; child profile page; QR that opens `/play` | Scanning the QR in the tablet browser opens the game page |

## Milestones (relative hours, replace with the real deadline)

| Milestone | When | Everyone checks |
|---|---|---|
| M1 Contracts frozen | H+6 | `SessionMetrics` and `ScoreResult` merged; the camera and microphone extension (PC-04) agreed or postponed |
| M2 Walking skeleton | H+12 | QR opens the game, a session uploads, a score is saved, the parent sees the result card |
| M3 Feature complete | H+30 | Every Must requirement passes its test |
| M4 Rehearsal | H+44 | Demo run twice on the production URL with the demo tablet; fallback recording made |
| M5 Pitch | TODO: real slot | |

## Hand-offs (who waits for whom)

1. Person 2 delivers the contracts, then Person 1 emits sessions, Person 3 stores them, Person 4 displays them. Nobody changes a contract after M1 without the team.
2. Person 2 delivers `startSensors()` returning aggregates only; Person 1 calls it from the game; Person 4's consent screen decides whether it starts.
3. Person 3 delivers auth and the API; Person 4 builds the pages on them.
4. The texts owner delivers every visible sentence; Person 1 and Person 4 paste them unchanged.

## Rules

- One branch per task (`feat/FR-xx-name`), a pull request to `main`, one reviewer.
- No secrets in this public repo. Keys live in Vercel and in a local `.env.local` that is never committed.
- No real child data. Demo data are synthetic.
- No video, audio or frames are ever uploaded or stored.
