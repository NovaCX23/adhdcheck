# Person 3: Backend and parent web app

You build what the parent uses: login, the child profile, the QR that starts a game, the result card, missions, the subscription and the email. Plus the database and the API behind it.

## Read first (30 minutes)

1. `docs/04-work-split.md`: the team, the decisions, the milestones.
2. `docs/02-specification-cahier-des-charges.md`, sections 4.3 to 4.6 (parent web app, Stripe, email, demo seeding), section 5.1 and 5.2 (privacy and security), section 6 (architecture), section 8 (data model).
3. `research/03-tech-stack.md`, sections 5 to 7 (backend, payments, notifications) and section 13 (what not to do).

## You own

- Folders: `apps/web` (Next.js on Vercel), `supabase/`.
- Requirements: FR-11 (server side), FR-30 to FR-50, FR-55, FR-56.
- With a 5th person: you keep the backend; Person 5 takes the dashboard, Stripe and email.

## Build order

| Step | Task | Done when |
|---|---|---|
| 1 | Create the Supabase project in **Frankfurt**. The region cannot be changed later. | Region shows Frankfurt in the dashboard |
| 2 | First migration: parents, children (nickname and birth year only), sessions, scores. Row-level security on every table. | A test shows one parent cannot read another parent's child |
| 3 | Next.js with parent login, deployed on Vercel | A parent signs up on the production URL |
| 4 | `/api/sessions`: validate with Person 2's contract, score, save | A session from the tablet is stored with its result |
| 5 | Child profile, "start a session" with a QR code, the result card (texts from Person 4) | Walking skeleton: QR, play, result card (milestone M2, H+12) |
| 6 | Missions chosen by the parent, progress chart, Stripe test-mode Checkout and Customer Portal, email via Resend | Each Should requirement passes its test |
| 7 | Demo seed: a parent account with 4 weeks of synthetic sessions, and a reset button | The demo runs from a clean state |

## Rules for you

- No secret in the repo. Keys live in Vercel and in a local `.env.local` that is never committed. `.env.example` holds names only.
- The result and the next step are never behind the paywall.
- Emails carry no result data.
- No video, audio or frames are ever stored. Only the aggregates Person 2 defines.
- The demo runs on the production URL, not a preview URL (preview URLs can block the QR).

## You depend on

- Person 2: the contracts (by H+6) and the scorer.
- Person 1: the game posting sessions.
- Person 4: every text the parent reads.
