# Person 4: Clinical, regulatory and pitch

You own what the product says and why it is safe to say it. Every text a parent or child reads, the consent screens, the intended purpose, the evidence, the business canvas, and the pitch.

## Read first (30 minutes)

1. `docs/04-work-split.md`: the team, the decisions, the milestones.
2. `docs/02-specification-cahier-des-charges.md`, section 2 (intended purpose), section 5.8 (claims rules), section 10 (decisions and open questions).
3. `research/02-competitors-and-regulatory.md`: competitors, MDR Rule 11, AI Act, GDPR.
4. `research/05-healthcare-business-model-canvas.md`: the 15 blocks, market size, channels.
5. `research/01-literature-unmet-need.md`: the evidence for the pitch.

## You own

- Folders: `docs/`, `pitch/`.
- Requirements: the texts of FR-34 to FR-36, FR-43 (parent questionnaire), FR-70 (consent screen text), NFR-50 to NFR-53.
- The open decisions in `docs/02` section 10.2.

## Build order

| Step | Task | Done when |
|---|---|---|
| 1 | Consent screens: the parent first, then a child-friendly explanation of camera and microphone (both off by default) | Texts merged; Person 1 and 3 paste them unchanged |
| 2 | Freeze the result wording: the two headlines (decided) plus the supporting lines and the disclaimer (D-03) | Merged before M2 (H+12) |
| 3 | Ask the organisers which canvas version the jury scores: 15 blocks (the slide) or 18 (the current gaits.org guide) | Answer recorded in `TODO.md` |
| 4 | Intended purpose final wording (R-02), product name (D-08), language (D-07) | Recorded in `docs/02` section 10.1 |
| 5 | Review every pull request that changes a visible text: no diagnosis, probability, severity or treatment wording | Each such PR carries your approval |
| 6 | Pitch deck and demo script (`docs/03-progress-plan.md`, section 5) | Rehearsed twice on the production URL (M4) |

## Key messages already sourced

- A CPT alone has sensitivity 0.75 and specificity 0.71 (19 studies, PMID 37004919). That is why we orient and do not diagnose.
- No study tested a game screening a general child population against a full clinical diagnosis. That gap is our study.
- Expected class IIa (Rule 11, MDCG 2019-11 rev.1). The design keeps it at IIa: no auto-prescribed missions, no severity.
- EU27 children aged 6-12: 31,711,259 (Eurostat `demo_pjan`, 1 Jan 2025). At 5.29% community prevalence (PMID 17541055): 1,677,526 children with ADHD.

## You depend on

- Everyone: show you each visible text before it ships.
- The organisers: the canvas version and the pitch slot.
