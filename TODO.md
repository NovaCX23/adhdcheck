# TODO: ADHD Check (hackathon)

Research in `research/`. Every figure in a pitch must come from those files with its source.

## Research
- [x] Tech stack: `research/03-tech-stack.md`
- [ ] Literature and unmet need: `research/01-literature-unmet-need.md` (agent running)
- [ ] Competitors and regulatory (MDR Rule 11, AI Act, GDPR): `research/02-competitors-and-regulatory.md` (agent running)
- [ ] Game design: map ADHD symptom questions to in-game behaviours, the AI to use, the articles behind it: `research/04-game-design-symptom-mapping.md`
- [ ] Healthcare Business Model Canvas (CIMIT / GAITS, 2026 version, source: https://www.gaits.org/hbmc), all 15 blocks in detail: `research/05-healthcare-business-model-canvas.md`
  1. Value Promise
  2. Users
  3. Economic Buyers
  4. Expert Influencers
  5. Authorities
  6. Value Quantification
  7. Market Size
  8. Transaction Model
  9. Channels and Customer Relationships
  10. Key Partners
  11. Key Activities
  12. Key Resources
  13. Cost Structure
  14. Revenue Stream
  15. Investor Economics

## Team decisions
- [x] DECIDED 2026-10-19: class IIa maximum (class I if achievable). Positioning is orientation, not diagnosis: the product helps parents decide whether to seek a professional assessment.
  - Regulatory reading: orientation or referral output is still Rule 11 class IIa (MDCG 2019-11 rev.1). Class I holds only if the output has no diagnostic or referral purpose.
  - To stay at IIa max: missions are not auto-prescribed from the score, there is no severity grading, and there are no treatment claims.
- [ ] Final output wording for parents (proposal: "a professional assessment is recommended" or "no specific follow-up indicated by this activity"; never "ADHD likely")
- [ ] Pricing and subscription content
- [ ] Gadget: which one, and is it a medical device itself

## Build (48 h plan in `research/03-tech-stack.md`)
- [ ] Game (Phaser 4, go/no-go style mechanics)
- [ ] Scoring module (transparent rules, illustrative thresholds)
- [ ] Backend (Supabase, Frankfurt region)
- [ ] Parent dashboard and Stripe test subscription
- [ ] Pitch deck and demo script
