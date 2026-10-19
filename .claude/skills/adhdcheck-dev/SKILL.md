---
name: adhdcheck-dev
description: >-
  How to write code and UI for the ADHD Check hackathon project: the child game (Phaser,
  TypeScript), the parent web app (Next.js, Supabase), scoring, camera and microphone
  features. Use before writing or reviewing any code, component, screen, text a user sees,
  or pull request in this repo. Covers the build workflow (contract and test first, then
  code, then check on the real device), coding rules, UI and UX rules for a children's game
  and a parent app, the wording rules of a medical-device orientation tool, and the
  confidentiality checks before every commit to this public repo.
---

# ADHD Check: how we code

This repo is **public**. It holds a health product for children. Three things follow from that, and they come before everything else in this file:

1. **Nothing confidential goes in.** No secret, no personal data, no client or company document.
2. **Nothing invented goes in.** A number, threshold, citation or claim has a source in `research/` or it is written `TODO`.
3. **No text says diagnosis.** The product orients parents toward a professional; it never diagnoses.

The requirements live in `docs/02-specification-cahier-des-charges.md`. Your own tasks live in `docs/team/person-N-*.md`. This skill is how to do the work, not what the work is.

## 1. Confidentiality (check before every commit)

Never commit:
- **Secrets:** API keys, tokens, passwords, Supabase service-role key, Stripe secret or webhook secret, Resend key, connection strings. They live in Vercel environment variables and a local `.env.local` that is gitignored. `.env.example` holds the variable **names** only.
- **Personal data:** a real child's or parent's name, email, photo, voice or session. Demo data are synthetic and look synthetic.
- **Camera or microphone output:** no frame, image, landmark array, audio sample or transcript, ever, in the repo or in the database. Only the aggregates defined in the contract.
- **Third-party confidential material:** documents from a client, a company, a notified body or a teammate's employer; internal emails; meeting notes with names.
- **Local machine details:** absolute paths from your own computer, usernames, internal hostnames or IP addresses.
- **Code we may not copy:** GPL or non-commercial code (WebGazer, PsyToolkit, PEBL are examples already ruled out in `research/`). Check the LICENSE file of any library before copying from it.

Before `git add`, read `git status` and recognise every path. Stage files by name, not with `git add -A`. Then run:

```bash
git diff --cached | grep -inE "api[_-]?key|secret|password|token|sk_live|sk_test_|service_role|BEGIN (RSA|OPENSSH|PRIVATE)" || echo "no secret pattern"
git diff --cached --name-only | grep -iE "\.env($|\.)" && echo "STOP: env file staged"
```

A match is a stop, not a warning. If a secret was ever pushed, treat it as leaked: remove it, tell the team, and rotate the key at the provider. Deleting the commit is not enough.

Before you show a terminal or a screen in the pitch or a screenshot, check that no key, email or personal data is visible.

## 2. Workflow for every task

1. **Read the requirement** (FR or NFR ID in `docs/02`) and its acceptance criterion. If the criterion is unclear, ask in the team channel before building.
2. **Search before you build.** For any library, browser API or pattern, read the official documentation first. Then search for its known problems ("X iOS Safari bug", "X licence"). Write in the PR: "planned X, found Y, chose Y because Z".
3. **Contract first.** Data crossing a boundary (game to API, API to dashboard, sensors to game) uses the types in `packages/contracts`. Never redefine a shape locally. Contracts change only by team agreement (see `docs/03-progress-plan.md`).
4. **Test first, and see it fail.** Write the test from the acceptance criterion, run it, watch it fail on the current code, then write the code and watch it pass. A test that has never failed has not proven anything.
5. **Build the smallest thing that passes.** Full code, no `// TODO rest of component` stubs in a merged PR.
6. **Check on the real target.** The child game on the demo tablet, the parent app on a phone and a laptop, through the production URL. Not only localhost.
7. **Look at the result.** Take a screenshot of every screen you changed, at phone, tablet and desktop width, and look at all of it. A green test does not show what a parent sees.
8. **Open a PR** titled with the requirement IDs. One reviewer other than you. The PR description says how you checked it (test name, or device and steps).

## 3. Coding rules

- **TypeScript strict.** No `any` across a boundary. Validate every input that comes from the network with the contract schema, and reject unknown fields.
- **Copy identifiers, never retype them.** A URL, key name, field name, threshold or quoted sentence is copied from its source file, not typed from memory.
- **Deterministic scoring.** The same session always gives the same result. Thresholds live in a versioned file with `validated: false` until real child norms exist. The scorer never produces a probability or a severity, and never selects a mission.
- **Timing.** Stimulus onset comes from the `requestAnimationFrame` frame that draws it. Responses use `pointerdown` and `event.timeStamp`, never `click`. Score variability and error rates, never an absolute reaction-time cut-off (`research/03-tech-stack.md`, section 2).
- **Sensors on the device.** Camera and microphone are processed in the browser; only aggregates leave it. Model and WASM files are self-hosted, so the child's browser makes no third-party request. The game works the same when permission is refused.
- **Children's data, least possible.** Child profile: nickname and birth year only. Row-level security on every table, with a test proving one parent cannot read another parent's child.
- **Every check must be able to fail.** When you write a check (test, validator, gate), also run it against a case that should fail, and confirm it does.
- **Three attempts, then search.** If the same objective fails three times, stop and search the library's issue tracker and documentation before a fourth attempt. Say the count in the team channel.
- **One round for all fixes.** When a review returns several findings, fix them all in one PR, with a test for each, not one PR per finding.
- **Small, named branches.** `feat/FR-xx-short-name`. No direct push to `main` once code exists.

## 4. UI and UX rules

### Before designing: the usability questions

For every screen, answer in one line each:
- Who uses it, doing what, where? (A 7-year-old on a tablet at the kitchen table. A tired parent on a phone in the evening.)
- What can the user do now?
- After each action, how does the user know it worked?
- What happens when it goes wrong (no network, permission refused, session too short)?

A beautiful screen that cannot answer these is not done.

### The child game

- **No failure screens, no shaming sounds, no visible score or ranking.** The child is never told they did badly. The child never sees a result.
- **No ads, purchases, external links, timers that pressure, or streak mechanics.** No dark pattern of any kind, and no monetisation aimed at the child.
- **Big touch targets.** At least 44 by 44 CSS pixels (WCAG 2.2 success criterion 2.5.5, Target Size Enhanced; the AA minimum in 2.5.8 is 24 by 24, too small for a child).
- **One instruction at a time**, short, read aloud where possible. Practice round before every measured task.
- **Full screen and fixed orientation** on the tablet, so a stray swipe does not leave the game.
- **Calm visual design.** The task stimuli must be the most salient thing on screen; decoration must not compete with them, or it changes what we measure.

### The parent web app

- **The result card shows exactly one of the two fixed headlines**, then the next step to a professional. Same visual weight for both outcomes: no red alarm for one and green relief for the other.
- **The result and the next step are never behind the paywall.**
- **Consent before capture.** Camera and microphone toggles start off; the explanation is plain and short.
- **Empty states, loading states and errors** each have a designed screen with a next action.

### Visual craft (both apps)

- **Contrast:** body text at least 4.5:1, large text at least 3:1 (WCAG 2.2, criterion 1.4.3). Never muted grey body text on a tinted near-white background.
- **Typography:** body line length 65 to 75 characters. At most two families, contrasting (serif plus sans) or one family in several weights.
- **Layout:** Flexbox for one dimension, Grid for two. A named z-index scale (dropdown, sticky, modal, toast), never 999. Cards only when they are the best answer, and never nested.
- **Motion:** ease-out curves, no bounce. Do not animate layout properties. Respect `prefers-reduced-motion`: it switches off autoplay, parallax and auto-scroll, not only shortens transitions.
- **Interaction:** handle `pointercancel` as well as `pointerup`. Any custom gesture declares `touch-action`. Never `outline: none`; use `:focus-visible`.
- **Avoid the generic AI look.** Do not reach by default for: a cream or beige page background, gradient text, glassmorphism, side-stripe accent borders, a big-number "hero metric" block, identical icon-heading-text card grids, numbered "01 / 02 / 03" section labels, pill buttons everywhere, or the left-text right-image hero. Each is allowed only when it is genuinely the best choice for this screen.

## 5. Wording rules (every text a user sees)

All visible text comes from Person 4 (clinical and regulatory) and is pasted unchanged. If you need a new text, ask; do not write your own.

Never in the product, the emails, the screenshots or the pitch:
- "diagnosis", "diagnose", "ADHD likely", "probability", "risk score", "percent chance";
- any severity word next to ADHD ("mild", "moderate", "severe", a level, a grade);
- any treatment or improvement claim ("treats", "reduces ADHD", "improves symptoms", "clinically proven", "validated").

The two result headlines are fixed (`docs/02`, decision D-03a). Missions are wellbeing activities the parent chooses; they are never presented as therapy.

Check before a PR that touches text:

```bash
git diff --cached | grep -inE "diagnos|likely|probabilit|risk score|severe|moderate|mild|treat|cure|clinically (proven|validated)" || echo "no banned wording"
```

House style for all text, code comments and commit messages: no em-dash character. Use commas, colons, parentheses or full stops.

## 6. Definition of done

A task is done when all of these are true:
1. Its acceptance criterion passes, and the PR says how it was checked.
2. The test was seen failing before the change and passing after.
3. It works on the production URL, and child-game work works on the demo tablet.
4. You looked at screenshots of every changed screen at phone, tablet and desktop width.
5. The confidentiality and wording checks above return clean.
6. Person 4 approved any visible text change.
7. The tracker row in `docs/03-progress-plan.md` is set to done with the PR link.
