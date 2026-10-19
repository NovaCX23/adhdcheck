# Person 3: Backend

You build what everything else stands on: the database, auth, the API that receives game sessions and scores them, security, deployment and the demo data.

## Read first (30 minutes)

1. `docs/04-work-split.md`: the team, the decisions, the milestones.
2. `.claude/skills/adhdcheck-dev/SKILL.md`: how we code, and the confidentiality checks.
3. `docs/02-specification-cahier-des-charges.md`, sections 5.1 and 5.2 (privacy and security), section 6 (architecture), section 7 (contracts), section 8 (data model).
4. `research/03-tech-stack.md`, section 5 (backend) and section 13 (what not to do).

## You own

- Folder: `supabase/` and the API routes in `apps/web/app/api/`.
- Requirements: FR-11 (server side), FR-20 (validation, with Person 2), FR-30, FR-39, FR-41, FR-55, FR-56, NFR-01 to NFR-03, NFR-06, NFR-10 to NFR-13.

## Build order

| Step | Task | Done when |
|---|---|---|
| 1 | Create the Supabase project in **Frankfurt**. The region cannot be changed later. | Region shows Frankfurt in the Supabase dashboard |
| 2 | Scaffold `apps/web` (Next.js) with Person 4, deploy to Vercel, set environment variables there (never in git) | The production URL loads |
| 3 | First migration: parents, children (nickname and birth year only), sessions, scores. Row-level security on every table. | A test proves one parent cannot read another parent's child |
| 4 | Parent auth (Supabase Auth) | A parent signs up and logs in on the production URL |
| 5 | `POST /api/sessions`: validate with Person 2's contract, call the scorer, save session and score | A session from the tablet browser is stored with its result |
| 6 | Session tokens for the QR link, rate limit on the session endpoint | An expired or reused token is refused |
| 7 | Delete a child and all their data; demo seed (a parent with 4 weeks of synthetic sessions) and a reset button | The demo starts from a clean state |

## Rules for you

- No secret in the repo. `.env.example` holds names only.
- No video, audio or frames are ever stored. Only the aggregates in the contract.
- The demo runs on the production URL, not a preview URL.

## You depend on

- Person 2: the contracts (by H+6) and the scorer.
- Person 1: the game posting sessions.
- Person 4: the pages that call your API.
