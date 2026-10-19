# 03 - Tech stack for the ADHD-check serious game (hackathon, 2026-10-19, 24 to 48 h)

Researched 2026-10-19. Every claim about a tool carries a URL. "unverified" means it could not be confirmed from a source read during this research. Where a figure is a design choice of this document and not a sourced fact, it says "design choice".

## 0. Three findings that change the plan

1. **HYPERAKTIV is an adult dataset.** It holds 51 adults with ADHD and 52 clinical controls, and the terms say competitions and commercial use need prior written permission (https://datasets.simula.no/hyperaktiv/). A model trained on it cannot be applied to children aged 6 to 12 and may not be usable in a hackathon competition without permission. Verdict: do not train on it. Use transparent rules built on within-child indices.
2. **CPT-type tasks discriminate only modestly.** A 2024 meta-analysis of 19 studies in children and adolescents reports pooled sensitivity 0.75 and specificity 0.71 for the total score, lower for omissions (0.63 / 0.74) and commissions (0.59 / 0.66) (summary at https://pubmed.ncbi.nlm.nih.gov/37004919/ and https://eprints.soton.ac.uk/477404; read through search abstracts only, full paper not read). So the output must read "attention profile, follow-up with a professional suggested", never "ADHD likely". The pitch role must also check regulatory status (section 8).
3. **Browser reaction times carry a constant device lag of about 60 to 130 ms.** Design the task around within-child variability and relative indices, not absolute cut-offs (section 2).

## 1. Recommended stack

| Layer | Pick | Alternative | Why | Source |
|---|---|---|---|---|
| Game engine | Phaser 4.x (MIT), written in TypeScript, mounted in a Next.js client component | PixiJS (MIT) or plain canvas; KAPLAY (MIT) for the fastest toy-style prototyping | Phaser runs one codebase on desktop and mobile browsers, MIT; GitHub lists v4.2.1. A go/no-go task is simple, so plain canvas is also acceptable; the engine buys sprites, tweens, audio and scaling for polish. Phaser 4 maturity vs 3.x for production: unverified, fall back to 3.x if a blocker appears | https://github.com/phaserjs/phaser , https://github.com/kaplayjs/kaplay , https://github.com/pixijs/pixijs |
| Why not Godot web | Not chosen | Godot 4 web export | Compatibility renderer only, Safari has WebGL 2 issues, large .wasm/.pck, web is slower than native; single-thread is default since 4.3 so no header setup needed, but the payload and Safari risk remain on a tablet demo | https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html |
| Why not Unity WebGL | Not chosen | Unity WebGL | Unity's own manual (2020.3 and older pages) says WebGL content is not currently supported on mobile devices and shows a warning; the Unity 6 wording could not be fetched (unverified) | https://docs.unity3d.com/2020.3/Documentation/Manual/webgl-browsercompatibility.html |
| Web app + dashboard | Next.js (App Router, TypeScript, Tailwind) on Node 20.9 or newer; docs reference Next.js 16 | Vite + React SPA | `create-next-app` gives routes, server actions and route handlers in one repo; Vercel deploys it natively | https://nextjs.org/docs/app/getting-started/installation |
| Backend, auth, DB | Supabase (Postgres + Auth + RLS), EU region | Firebase (Firestore, EU location) | Postgres RLS maps cleanly to "parent sees only own children". Free plan: 2 active projects, 500 MB, 50,000 MAU, pauses after 1 week of inactivity. Supabase MCP is available to us. Firebase has EU locations (eur3, europe-west1/4) but location is immutable; Firebase pricing and rules model not fetched (unverified) | https://supabase.com/pricing , https://supabase.com/docs/guides/database/postgres/row-level-security , https://firebase.google.com/docs/firestore/locations |
| EU hosting | Create the project in a specific EU region (Frankfurt), not the general "Europe" region | none | General Europe region can land in London or Zurich, which are not EU; region cannot be changed after creation; docs state region selection is "not proof of regulatory compliance" | https://supabase.com/docs/guides/platform/regions |
| Scoring runtime | Pure TypeScript package `packages/scoring`, called from a Next.js route handler (server recomputes from raw trials) | Python FastAPI service; Supabase Edge Function | One language, unit-testable, no extra deploy. Supabase Edge Functions are TypeScript on Deno and the page does not mention Python, so a Python scorer would need its own host | https://supabase.com/docs/guides/functions |
| Payments | Stripe test mode: Checkout (mode subscription) + Customer Portal | Payment Links | Portal is created by POST to `/v1/billing_portal/sessions` with customer and `return_url`; configure portal in the test Dashboard; listen to `customer.subscription.updated` and `customer.subscription.deleted` to grant or revoke access | https://docs.stripe.com/customer-management/integrate-customer-portal , https://docs.stripe.com/payments/checkout/build-subscriptions |
| Email to parents | Resend (free: 3,000 emails/month, 100/day, 3 domains) for weekly summaries and mission reminders; Supabase Auth emails for login only | Push notifications | Email needs no device permission and works in a demo. Resend Pro is 20 USD/month for 50,000 emails. Supabase built-in SMTP sending limits: unverified. Web push on iOS: unverified, skip | https://resend.com/pricing |
| Hosting | Vercel | Netlify (not researched, unverified) | Vercel MCP available. WARNING: Hobby plan is restricted to non-commercial, personal use; Pro developer seat is 20 USD/user/month. Hobby preview deployments are behind Vercel Authentication by default, which would block a phone scanning a QR code, so demo from the production alias | https://vercel.com/docs/plans/hobby |
| QR code | `qrcode` npm package (MIT), `toCanvas` in browser | any | Renders to canvas in the browser | https://github.com/soldair/node-qrcode |

## 2. Timing accuracy: what is realistic and how to design around it

### 2.1 Findings with sources

| Topic | Finding | Unit / scale / condition | Source |
|---|---|---|---|
| `performance.now()` resolution | 5 microseconds when cross-origin isolated, 100 microseconds otherwise | per MDN, deliberately coarsened against fingerprinting | https://developer.mozilla.org/en-US/docs/Web/API/Performance/now |
| `Event.timeStamp` | DOMHighResTimeStamp, ms since time origin, time the event was created (not when the listener ran). Rounding: Chrome 0.1 ms, Safari 1 ms, Firefox 1 ms by default; 0.005 / 0.02 / 0.02 ms if cross-origin isolated. Firefox with `privacy.resistFingerprinting`: 16.667 ms or more | per MDN | https://developer.mozilla.org/en-US/docs/Web/API/Event/timeStamp |
| Conclusion on clamping | Clamping (at most 1 ms by default, 16.7 ms only in Firefox resist-fingerprinting mode) is small next to device lag (below). It is not the bottleneck | derived from the two rows above | same |
| Online platform response lag | Robot-actuator test on keyboards: mean lag Gorilla 78.5 ms (SD 8.3), lab.js 71.3 (SD 28.2), PsychoJS 82.3 (SD 16.4), jsPsych 87.4 (SD 15.3) | ms, keyboard, Windows and macOS, 4 browsers | Anwyl-Irvine et al. 2021, https://pmc.ncbi.nlm.nih.gov/articles/PMC8367876/ (read via Europe PMC XML) |
| Same study, devices | Windows desktop USB 76.2 ms (SD 14.5), Windows laptop 73.7 (SD 20.3), macOS desktop 85.4 (SD 18.3), macOS laptop 83.1 (SD 21.4) | ms | same |
| Same study, display | Visual duration error: Gorilla +13.4 ms, lab.js +9.8 (max 16.5 = one 60 Hz frame), PsychoJS -6.2, jsPsych +26.0 | ms, mean delay | same |
| Timing mega-study | Most online packages reach response-time precision (SD) under 10 ms; PsychoPy under 3.5 ms. Lags in the browser are much larger than in desktop software, constant within a browser/OS combination but varying a great deal between combinations. Examples: jsPsych on Windows 10 Chrome SD about 7.9 ms, lag about 23 ms | ms, Black Box Toolkit | Bridges et al. 2020, https://peerj.com/articles/9414 (read via https://pmc.ncbi.nlm.nih.gov/articles/PMC7512138/ Europe PMC XML) |
| Visual onset online | Could not be measured online (no trigger pulse), so true on-screen onset lag is unknown in a browser. Lab software showed a constant lag of about 4 ms | ms | same |
| Touchscreens | Response-time overestimation (touch, via actuator): Android Chrome 69.8 ms (SD 7.4), Android Firefox 66.1 (SD 7.5), iOS Chrome 57.9 (SD 6.7), iOS Safari 57.6 (SD 6.5). Keyboard comparison: Windows Chrome 68.5 (SD 1.7), macOS Safari 132.9 (SD 8.1), macOS Chrome 95.4 (SD 8.1) | ms, mean (SD) | Pronk et al. 2020, https://pmc.ncbi.nlm.nih.gov/articles/PMC7280355/ (via Europe PMC XML) |
| Same study, relative RT | Authors: for relative RTs (differences between conditions within a person) "risks are less severe". Brief stimuli up to 100 ms on macOS Chrome and Safari tended to be shown too briefly | qualitative | same |
| Tablet validation | Touch delay errors on an Samsung Android tablet were 88 to 105 ms; authors advise against touchscreens for simple RT, acceptable for choice RT on Safari/iOS and Chrome. Source is a conference abstract: treat as unverified | ms | https://www.ebsco.com/articles/computer-science/c826ce2d-a9f9-517c-8855-8c67d79823f0/a-55-updated-validation-of-the-accuracy-of-reaction-time-assessment-on-computer-based-tablet-devices/ |
| Device effect on scores | Mobile users, especially Android smartphone users, were slower on RT tests than laptop/desktop users, attributed to device latency | observational | https://pubmed.ncbi.nlm.nih.gov/33954913/ |

Note on like-for-like: the Anwyl-Irvine and Pronk figures are lags of a robot actuator against the true press, in ms, on tasks with a keyboard or a touch tap; they are not child reaction times. Different studies used different devices and robots; do not pool them into one number. The ranges above are quoted per source.

### 2.2 Verdict

- **Realistic precision (within one device):** SD of measurement noise roughly 2 to 20 ms depending on browser, OS and platform (Bridges: mostly under 10 ms; Anwyl-Irvine: 8 to 28 ms; Pronk touch: 6.5 to 7.5 ms).
- **Realistic accuracy (absolute):** a constant positive offset of roughly 58 to 133 ms depending on device and browser. It cannot be calibrated away without hardware (true display onset is not measurable in a browser).
- **Child reaction-time variability is far larger** than 10 to 20 ms of measurement noise (design reasoning; sourced child norms: unverified, TODO). So within-child variability measures survive, absolute RT thresholds do not.

### 2.3 Design so that it does not matter (design choices, not sourced facts)

1. **Use within-subject indices:** RT standard deviation and coefficient of variation inside the session, early-vs-late block change (vigilance decrement), commission and omission rates. A constant lag cancels in differences and does not change an SD.
2. **Never use an absolute RT cut-off** (for example "RT under 200 ms = anticipation") without first subtracting a per-device baseline. Collect a calibration block: a simple-tap block at the start gives a per-device floor.
3. **Standardised device for the demo:** one named tablet, one browser (Chrome on Android or Safari on iOS per the Schatz abstract, unverified), fullscreen, same refresh rate. Log device facts in the session JSON so the data can be stratified.
4. **Timestamping method:** record stimulus onset as the `requestAnimationFrame` callback timestamp of the frame in which the stimulus was drawn; record the response with `pointerdown` `event.timeStamp` (creation time), not the time the handler runs. Use `pointerdown`, not `click`. Both clocks share the time origin (MDN states the origin; the shared-origin comparison is an inference, test it in a 10-line probe on the demo tablet).
5. **Stimulus duration:** keep the Go/No-Go stimulus on screen for 500 ms or more, so one 60 Hz frame (16.7 ms) of display error is small. Avoid sub-100 ms stimuli (Pronk).
6. **Do not use the numbers as a diagnosis.** Report percentile-style or band output only, with the disclaimer in the score contract.

## 3. Reusable open source

| Item | Use | Licence | Source | Notes |
|---|---|---|---|---|
| Phaser | game engine | MIT | https://github.com/phaserjs/phaser | v4.2.1 listed |
| KAPLAY | game engine alternative | MIT | https://github.com/kaplayjs/kaplay | |
| PixiJS | renderer alternative | MIT | https://github.com/pixijs/pixijs | |
| jsPsych | timing-validated task framework (core + plugins) | MIT (per package registries; GitHub LICENSE file not fetched, unverified) | https://npmjs.com/package/jspsych | Docs example uses 8.3.0 (https://www.jspsych.org/latest/overview/plugins/); latest version sources disagree, unverified. Using jsPsych inside a Phaser game is not required; use it only if you drop Phaser |
| jspsych-contrib | extra plugins: stop-signal, flanker, `html-keyboard-response-raf` (rAF timing) | not stated on the page, check each plugin `package.json` (unverified) | https://github.com/jspsych/jspsych-contrib | No go/no-go or CPT plugin is listed |
| jspsi-go-example | go/no-go demo with psiTurk + jsPsych | MIT per search snippet (unverified on repo) | https://github.com/saralilyb/jspsi-go-example | Template only, not clinical |
| PEBL | test battery incl. a free CPT; has a WebAssembly build | GPL (copying code into our repo makes it GPL) | https://pebl.sourceforge.net/ | A 2016 PeerJ study found PEBL CPT vs Conners CPT correlations r 0.78 (RT), 0.65 (omissions), 0.66 (commissions) in 44 young adults (search snippet, https://pmc.ncbi.nlm.nih.gov/articles/PMC4806597 , unverified in full). Current CPT presence in the battery: unverified. Use as a design reference, not as code |
| PsyToolkit | go/no-go in its experiment library | lessons and web interface CC BY-NC-SA 3.0; Linux software GPL v3; experiment library items belong to their authors; commercial use needs permission | https://www.psytoolkit.org/legal.html | Non-commercial: do not copy into a product with a paid subscription |
| Millisecond Inquisit CPT | Rosvold-style CPT | free with Inquisit licence, not open source | https://millisecond.com/download/library/categories/gonogo | Reference only |
| node-qrcode | QR on result card and landing | MIT | https://github.com/soldair/node-qrcode | |
| HYPERAKTIV | reference dataset | "open for research and educational purposes"; competitions and commercial use need written permission; no standard licence named | https://datasets.simula.no/hyperaktiv/ | Adults. Do not train on it |

Recommendation: write the go/no-go ourselves (about 100 lines of TypeScript). No permissive pediatric CPT implementation was found; the cleanest legal path is our own code following the published paradigm.

## 4. Scoring (prototype)

Pick: **transparent rule-based indicators**, computed in `packages/scoring`, recomputed server-side from raw trials.

- Indicators (all within-child, from the session JSON): omission rate, commission rate, mean RT of correct Go, RT SD, RT coefficient of variation, vigilance change (last third vs first third of the task), off-target taps during inter-stimulus interval (activity proxy).
- Thresholds: **TODO / unverified.** No verified pediatric norms for this custom task were found. For the demo, label thresholds "illustrative, not clinically validated" and keep them in one JSON file `packages/scoring/thresholds.v0.json` with a visible `validated: false` flag.
- Why not logistic regression: no child dataset was found; HYPERAKTIV is adult and restricted (section 0). A model trained on it would be both invalid and possibly not permitted.
- Run location: server route handler (TypeScript). Client-side scoring is tamperable and would show a result before saving; Python FastAPI adds a second deploy; Edge Functions are Deno/TypeScript (no Python mentioned).
- Output language: a band ("no flag", "follow-up with a professional suggested", "not enough data"), never a diagnosis. The 0.75 / 0.71 pooled figures above are the reason.

## 5. Backend, auth, database, dashboard

- Supabase Auth for the parent only. The child never has an account: the parent creates a child profile (nickname, birth year, no surname, no photo) and starts a session from the parent's logged-in device or a short-lived link (design choice).
- Tables: `parents` (via `auth.users`), `children`, `sessions`, `trials`, `scores`, `missions`, `subscriptions`. Enable RLS on every table; policies use `(select auth.uid())` with `to authenticated` and one policy per operation; index the policy columns; never use `user_metadata` for authorisation; keep the `service_role` key server-side only (all from https://supabase.com/docs/guides/database/postgres/row-level-security).
- Child data policy: `children.parent_id = (select auth.uid())`; sessions, trials and scores reach the parent through `child_id` joins in a `security definer` helper with `search_path = ''`, or by copying `parent_id` into each row (simpler for 48 h).
- Test RLS with two parent accounts and assert parent B reads zero rows of parent A (pgTAP via `supabase test db` is documented on the same page).
- EU: create the project in Frankfurt (section 1). GDPR Art. 8: consent for information society services offered directly to a child needs parental authorisation below 16, member states may lower to a minimum of 13, France is listed at 15 by several secondary sources (https://gdpr-text.com/fr/read/article-8 , https://gdprlocal.com/digital-age-of-consent-under-the-gdpr/ ; France figure: verify in the Loi Informatique et Libertes before claiming it). Our design (parent account, child has no account) sidesteps child consent but health-like data is still sensitive: the pitch role writes the data-minimisation slide.
- Firebase comparison: Firestore is document-based with its own rules language; its EU location is immutable (https://firebase.google.com/docs/firestore/locations). Not chosen because SQL joins for the dashboard and RLS are faster for this team to reason about; this is a judgement, not a measured result.

## 6. Payments (demo)

1. Dashboard in test mode: create product "Family plan" with a recurring price; configure the Customer Portal in test mode.
2. Route handler creates a Checkout Session with `mode: "subscription"` and the parent's Stripe customer id; success returns to `/dashboard?paid=1`.
3. Route handler `POST /api/stripe/portal` creates a portal session (customer + `return_url`).
4. Webhook route handles `checkout.session.completed` (name unverified from the pages read), `customer.subscription.updated`, `customer.subscription.deleted`; writes `subscriptions.status`. Verify the webhook signature. Local forwarding with the Stripe CLI `stripe listen`: standard but not fetched, unverified.
5. Test card number 4242 4242 4242 4242: widely used, not re-verified in this research (unverified).
6. Keys: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only in Vercel env vars and a local gitignored `.env.local`.

## 7. Notifications

Resend for "weekly summary" and "new mission" emails, sent from a route handler or a Supabase scheduled job (scheduler specifics not researched, unverified). Free tier 3,000/month and 100/day is ample for a demo (https://resend.com/pricing). Skip push. Emails carry no raw scores; link to the dashboard.

## 8. Regulatory flag for the pitch/clinical role

- Software that provides information used to take diagnostic decisions can qualify as medical device software under EU MDR, and qualification turns on the intended purpose the manufacturer claims (MDCG 2019-11, revised June 2025: https://openregulatory.com/mdcg/mdcg-2019-11 , summaries at https://mdrregulator.com/news/revised-mdcg-2019-11-guidance-updated-approach-to-qualification-and-classification-of-medical-software ). A secondary summary states Rule 11 gives class IIa by default for such software (https://www.bristows.com/?p=8332 ; primary text not read, unverified).
- Implication: the words "ADHD profile likely" are a diagnostic claim. For the demo, present as "attention profile and follow-up game", state "not a medical device, not a diagnosis, validation planned", and put the validation plan on a slide. This is a flag for the human decision, not a legal conclusion.

## 9. Demo polish that wins

1. **Live flow (3 minutes):** landing page with QR (qrcode) -> phone scans -> child plays a 60 to 90 s demo round (full task is longer) -> result card appears on the big screen via Supabase Realtime (capability not fetched, unverified; fallback is polling every 2 s) -> parent dashboard with bands, trends, missions -> "Subscribe" -> Stripe test checkout -> portal -> email arrives.
2. **Pre-seed** a demo parent with 4 weeks of sessions so charts are not empty; a "Reset demo" admin button.
3. **Offline-safe:** keep a screen recording and a seeded account as fallback if venue wifi fails.
4. **Result card:** shareable image of the child's nickname, three indicator bars, the band, the disclaimer line; generated with canvas or `next/og` (not researched, unverified).
5. **Make the timing story a feature:** one slide "we measure variability, not absolute speed, because browser latency is 60 to 130 ms and constant" citing section 2. It pre-empts the sharpest jury question.
6. **Public repo hygiene:** no secrets in git, `.env.example` only, `NEXT_PUBLIC_` variables limited to the Supabase URL and publishable key. GitHub secret-scanning push protection: not verified, check the repo settings.

## 10. Suggested repo structure

```
adhdcheck/
  README.md
  .env.example                 # names only, no values
  .gitignore                   # .env*, .vercel, node_modules, supabase/.temp
  package.json                 # pnpm workspaces
  research/                    # these notes
  apps/
    web/                       # Next.js (landing, play, parent dashboard, API routes)
      app/(marketing)/         # landing + QR
      app/play/[token]/        # mounts the Phaser game
      app/dashboard/           # parent: children, results, missions, billing
      app/api/sessions/        # POST session metrics -> validate -> score -> save
      app/api/stripe/          # checkout, portal, webhook
  packages/
    game/                      # Phaser scenes, go/no-go engine, session recorder
    scoring/                   # pure TS: indicators, thresholds.v0.json, tests
    contracts/                 # TypeScript types + zod schemas: SessionMetrics, ScoreResult
  supabase/
    migrations/                # tables + RLS
    seed.sql                   # demo parent and 4 weeks of data
    tests/                     # pgTAP RLS tests
  docs/
    pitch/  clinical/  regulatory/
```

## 11. Hand-off contracts

### 11.1 Session metrics (game -> backend), `SessionMetrics` v1

```json
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "child_id": "uuid (pseudonymous, no name)",
  "started_at": "2026-10-19T10:00:00Z",
  "duration_ms": 0,
  "task": {
    "type": "go_nogo",
    "version": "0.1.0",
    "blocks": 3,
    "go_probability": 0.8,
    "stimulus_ms": 500,
    "isi_ms_min": 900,
    "isi_ms_max": 1500,
    "calibration_trials": 10
  },
  "device": {
    "user_agent": "string",
    "pointer_type": "touch | mouse | pen",
    "screen_w": 0,
    "screen_h": 0,
    "device_pixel_ratio": 1,
    "est_refresh_hz": 60,
    "cross_origin_isolated": false,
    "timer_clock": "event.timeStamp"
  },
  "trials": [
    {
      "i": 0,
      "block": 0,
      "type": "go | nogo | calibration",
      "stimulus_onset_ms": 0,
      "responded": true,
      "rt_ms": 0,
      "outcome": "hit | omission | correct_reject | commission | anticipation",
      "x": 0,
      "y": 0
    }
  ],
  "off_target_taps": [{ "t_ms": 0, "during": "isi | stimulus" }],
  "calibration": { "median_rt_ms": 0, "n": 0 }
}
```

Units: all times in milliseconds (`DOMHighResTimeStamp`, session-relative), `rt_ms` null when `responded` is false. `go_probability` is a design choice, not a sourced value. Validate with the zod schema in `packages/contracts`; reject sessions with fewer than a minimum number of trials (set in `thresholds.v0.json`).

### 11.2 Score output (scoring -> dashboard), `ScoreResult` v1

```json
{
  "schema_version": "1.0",
  "session_id": "uuid",
  "scoring_method": "rules_v0",
  "validated": false,
  "indicators": {
    "omission_rate": 0.0,
    "commission_rate": 0.0,
    "rt_mean_ms": 0,
    "rt_sd_ms": 0,
    "rt_cv": 0.0,
    "vigilance_change": 0.0,
    "off_target_tap_rate": 0.0
  },
  "flags": ["high_rt_variability", "high_commission_rate"],
  "band": "no_flag | follow_up_suggested | insufficient_data",
  "data_quality": { "n_trials": 0, "pct_anticipations": 0.0, "notes": [] },
  "reasons": ["plain-language line per flag"],
  "recommendations": ["mission ids or text"],
  "disclaimer": "Attention profile from a game. Not a diagnosis. Talk to a healthcare professional."
}
```

Rates are fractions 0 to 1. Thresholds live in `thresholds.v0.json` and are TODO / illustrative until validated.

## 12. 48-hour plan by role

| Role | Hours 0 to 12 | Hours 12 to 30 | Hours 30 to 48 |
|---|---|---|---|
| **Game dev** | Scaffold `packages/game`, Phaser scene, go/no-go loop, rAF onset + `pointerdown` timestamps, probe timing on the demo tablet | Child-friendly art/sound, calibration block, session recorder emitting `SessionMetrics`, QR-launch route | Polish, 60 to 90 s demo mode, full-screen/orientation handling, test on the target tablet |
| **Scoring / data** | Define `contracts` zod schemas with backend; scorer skeleton + unit tests on synthetic sessions | Indicators, `thresholds.v0.json`, data-quality rules, synthetic "typical / variable / impulsive" fixtures | Seed data for the demo, sanity checks, document method and limits (cite section 0 findings) |
| **Backend** | Supabase project in Frankfurt, migrations, RLS, two-parent isolation test | `/api/sessions` (validate, score, save), auth flows, seed script | Hardening: rate limit session POST, secrets audit of the public repo, Realtime or polling for result card |
| **Parent dashboard + payments** | Next.js shell, auth pages, children CRUD | Result view, trend chart, missions; Stripe Checkout + portal + webhook | Email via Resend, subscription gating, empty/loading states |
| **Pitch / clinical / regulatory** | Problem story, evidence slide (CPT accuracy 0.75 / 0.71), claim wording | Regulatory slide (MDCG 2019-11 flag), GDPR/data-minimisation slide, validation roadmap | Demo script and rehearsal, fallback recording, jury Q&A sheet (timing, validity, privacy) |

Interfaces freeze at hour 6: `SessionMetrics`, `ScoreResult`, DB table names. Changes after that go through one owner.

## 13. What NOT to do

- Do not train on HYPERAKTIV or claim it validates a child tool (adult, restricted terms).
- Do not output "ADHD likely" or any diagnosis; do not claim clinical validation.
- Do not compare absolute RTs across devices or use absolute RT cut-offs without a device baseline.
- Do not use stimuli under 100 ms or `click` events for responses.
- Do not copy GPL (PEBL) or non-commercial (PsyToolkit) code into the repo.
- Do not use Unity WebGL or Godot web for a tablet demo in 48 h.
- Do not put any key in git (Stripe secret, Supabase service role, Resend). Public repo.
- Do not use the Supabase `service_role` key in the browser; do not leave a table without RLS.
- Do not collect child names, photos or exact birthdates; birth year and nickname only.
- Do not demo from a Vercel preview URL behind deployment protection; do not rely on Hobby for anything commercial.
- Do not pick the Supabase general "Europe" region if EU residency is claimed.
- Do not build push notifications, a native app or custom analytics in this window.
