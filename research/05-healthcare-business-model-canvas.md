# 05. Healthcare Business Model Canvas (H-BMC) for ADHD Check

Prepared 2026-10-19 for the hackathon team. Role of this file: collect, structure and cite. Every choice (segment, price, channel, value promise, launch countries) is marked **PROPOSAL** and is the team's decision. Every number carries its source, population, unit and year; a missing figure is written TODO.

**Team decisions already taken (2026-10-19, 14:35), used as the baseline below:**
- Positioning is **orientation, not diagnosis**: the product helps parents decide whether to seek a professional assessment and orients them to the right professional.
- Target **class IIa maximum**; class I only if the output carries no diagnostic or referral purpose (MDCG 2019-11 rev.1, Rule 11, see block 5).
- **Missions are general wellbeing activities chosen by the parent or a professional**, never selected automatically by the score (to stay out of the Rule 22 / class III example, see block 5).

**Team input under evaluation (2026-10-19):** Instagram, trend-driven distribution modelled on the "Sephora kids" trend, and an affiliate model where clinics pay a fee per referred family. Researched in blocks 9 and 14, with the legal findings and the safer alternatives.

**Evidence labels.** P = read at the primary source this session. S = taken from a search summary or secondary page, not re-read at the primary source: a lead to confirm before external use. Research files are cited as [R01 n], [R02 n], [R03 section]; canvas definitions as [G..]; other web sources as [W..] (list at the end).

---

## 0. Which canvas, and what the official source actually says

- The 15 blocks on the event slide (1 Value Promise ... 15 Investor Economics) match the GAITS glossary entry for the H-BMC: "organized as 15 blocks across 5 tiers", "12 hypothesis blocks and 3 financial calculation blocks" [G0] (P). The five tiers are named in the glossary as "Value Foundation, Stakeholder, Economic Model, Operations, and Financial" [G-glossary] (P).
- The current public guide page at gaits.org/hbmc shows a **different, 18-block version in 8 rows** (for example "Unmet Need", "Competitive Advantage", "Market Access", "Advisory Bodies" as separate blocks) and states that the complete framework guide sits behind a GAITS sign-in [G-hbmc] (P). The quick-start page also says "eighteen blocks across eight rows" [G-qs] (P). The team should confirm with the organisers which version the jury will score against; this file follows the 15-block slide.
- **Guiding questions.** The per-block guiding questions are not public: the block reference page ("The Blocks") redirects to a sign-in [G-hbmc] (P). What is public, and quoted below for each block, is (a) the one-line glossary definition, (b) the "Full Definition" paragraph of each block's glossary page [G1-G15] (P), and (c) for some blocks the one-line definition from the 18-block page [G-hbmc]. Where a definition paragraph implies questions (for example Economic Buyers: "who controls the budget, what they care about ... and what threshold of evidence they require"), they are quoted verbatim.
- **Authorship.** No GAITS page read here names CIMIT as author or gives a version year; "Healthcare Business Model Canvas 2026" as a title was not found at source. A cimit.org/web/guest/h-bmc URL returned the CIMIT home page, not an H-BMC page [W-cimit] (P). Attribution to CIMIT rests on the event slide only.

---

## 1. One-page summary canvas (all lines are PROPOSALS for the team)

| # | Block | One-line proposal |
|---|---|---|
| 1 | Value Promise | For parents of children aged 6-12 who are unsure about attention or hyperactivity, a short game turns everyday worry into a structured orientation: whether a professional assessment is worth seeking, and which professional to see. Not a diagnosis. |
| 2 | Users | Two users: the child (plays, 6-12) and the parent (reads the orientation, chooses missions). Later, a professional user who receives the shared report. |
| 3 | Economic Buyers | Beachhead: the parent (B2C subscription). Next: insurers or mutuelles, schools or municipalities, paediatric practices (B2B2C, flat fee), then statutory payers via DiGA (DE) or Belgian M3 if the evidence supports it. |
| 4 | Expert Influencers | Paediatricians, child psychiatrists and school psychologists as champions or anti-buyers; parent associations; the authors of the CPT and QbTest meta-analyses whose warnings ("not a triage gate") the jury may quote. |
| 5 | Authorities | MDR: expected class IIa under Rule 11 (orientation is information used for diagnostic decisions), notified body required; class I only without diagnostic or referral purpose. AI Act high-risk from 2 Aug 2028 if AI-based and IIa. GDPR Art. 8 and 9 for children's health data. Reimbursement: DiGA (DE) possible in principle, PECAN (FR) does not cover orientation tools as described, Belgian M1-M3 pyramid, Romania: no route found. |
| 6 | Value Quantification | Claimable today only by analogy and with care: waits of "up to 4+ years for children" (England) and a clinic-side objective test that raised decisions at 6 months from 50% to 76%. Our own triage and time-to-referral value is "to be generated" by a named study. |
| 7 | Market Size | EU27 children aged 6-12 (1 Jan 2025): 31,711,259. Times community prevalence 5.29%: 1,677,526 children with ADHD (TAM, prevalence view). SAM (FR+DE+BE+RO): 718,172. SOM: TODO. |
| 8 | Transaction Model | Options, no price set: B2C monthly or yearly subscription (benchmarks EUR 30/month Poppins, USD 24.99/month EndeavorOTC); B2B2C flat per-member or per-school fee; statutory reimbursement later. No per-referral fee from clinics. |
| 9 | Channels and Customer Relationships | Parent-targeted (not child-targeted) Instagram content with claims limited to the intended purpose; school and paediatrician channels for trust; relationship through weekly parent summaries and the "share with a professional" report. The Sephora-style trend is a reputational risk, see 9.3. |
| 10 | Key Partners | One clinical partner (child psychiatry or paediatrics unit) for the validation study; notified body; regulatory and data-protection advisors; EU hosting and payments providers. |
| 11 | Key Activities | Game and scoring development; the validation study; QMS and technical documentation; data protection; parent-facing content within MDR Art. 7. |
| 12 | Key Resources | The child gameplay dataset with clinical labels (does not exist publicly, must be built); the CE certificate; the evidence; the game IP and brand trust with parents. |
| 13 | Cost Structure | Pre-revenue: notified body (only per-item fees found, for example EUR 1,495 per audit day at NB 1383; total TODO), clinical study (TODO), development and hosting (free tiers up to USD 20 per seat or per month, Vercel Pro and Resend Pro). |
| 14 | Revenue Stream | Volume x price, three scenarios, all inputs TODO until the price and penetration are chosen and tested. Clinic affiliate fees excluded on legal grounds; flat B2B fees as the alternative. |
| 15 | Investor Economics | Investors look for behaviour change, outcomes that matter and customers who pay (Rock Health). Value-inflection milestones: validation study, CE IIa, first payer contract, AI Act readiness before 2 Aug 2028. Capital needed: TODO. |

---

## Block 1. Value Promise

**Official definition.** Glossary: "the core unmet need, why it matters, and why the solution is the right answer" [G1] (P). Full definition: "The Value Promise is the anchor of the entire H-BMC canvas. It captures the specific unmet need the solution addresses, the evidence that this need is real and significant, and the reason the proposed solution is better than alternatives. Every other block must support and validate the Value Promise. [...] The Value Promise is for users" and "describes clinical or operational value, not economic value" [G1] (P). Implied guiding questions (from that text): What is the specific unmet need? What evidence shows it is real and significant? Why is the solution better than the alternatives? The 18-block page splits this into "Unmet Need: the important job current alternatives leave undone" and "Competitive Advantage: the clinical case: why users choose you" [G-hbmc] (P).

**Our answer (PROPOSAL).** "Parents of children aged 6-12 who wonder whether attention or hyperactivity is a problem get, from a 10-minute game played at home, a plain-language orientation: whether a professional assessment is worth seeking and which professional to see, plus wellbeing activities they choose. It is not a diagnosis." (Duration "10-minute" is a placeholder: TODO, game design file 04 not present.)

**Evidence.**
- Need is real: community prevalence 5.29% (102 studies, 171,756 subjects aged 18 or under) [R01 1]; 3.4% (95% CI 2.6-4.5) in a stricter pooled analysis [R01 3].
- Access gap (England only): waits "up to 4+ years for children"; fewer than one-third of strictly diagnosed children in contact with any mental health service [R01 web-A].
- Under-recognition in girls: administrative prevalence 2.55% boys vs 0.67% girls against 5% population prevalence (England) [R01 web-A].
- Parent report alone is weak: parent-teacher agreement kappa 0.25 (11 studies, 8,796 participants under 18) [R01 24].
- Better than alternatives? No study found of a game-based screen in an undifferentiated child population against a full clinical reference [R01 B, "Not found"]. Plain CPTs reach pooled Se 0.75 / Sp 0.71 [R01 9]; QbTest Se 0.78 / Sp 0.70 [R01 10]. So "better" can only be argued on access, engagement and parent use, not on accuracy.
- White space: no CE-marked or cleared ADHD assessment found that reports to parents; all are HCP-interpreted [R02 Part 3].

**Assumptions to validate.** Parents act on an orientation (book an assessment) rather than ignore it or over-react; the game measures something related to attention in 6-12-year-olds at home; "orientation" is understood by parents as "not a diagnosis".

**Open questions.** Which professionals does the orientation name (paediatrician, child psychiatrist, psychologist), and does that differ by country? Does the promise mention ADHD by name (it re-qualifies the product as MDSW either way, [R02 2.7])?

---

## Block 2. Users

**Official definition.** Glossary: "the individuals who directly use the solution in clinical or operational practice" [G2] (P). Full definition: "Users are the people who interact with the solution day-to-day. In healthcare they are almost never the people who pay for it. Understanding users requires knowing who they are, what problem the solution solves for them, what their current workaround is, what they value and prioritize, and what would drive or block adoption. The user value case is distinct from the economic buyer value case and must be addressed separately." [G2] (P). 18-block page: "who actually uses it, in what workflow" [G-hbmc] (P).

**Our answer (PROPOSAL).**
| User | What they do | Current workaround | What drives or blocks adoption |
|---|---|---|---|
| Child, 6-12 | Plays the game; never has an account [R03 5] | Nothing, or school observation | Fun and short; blocks: boredom, device issues |
| Parent | Creates the child profile, reads the orientation, chooses missions, shares the report | Online questionnaires, waiting for school or GP opinion | Trust, clarity, privacy; blocks: fear of labelling the child |
| Professional (later) | Receives a parent-shared report | Rating scales, CPT or QbTest in clinic [R02 1.1] | Usefulness in the assessment; blocks: scepticism of consumer tools |

**Evidence.** A serious game discriminated in children 6-11 (|d|=0.901) but not adolescents (|d|=0.191) [R01 19]; AKL-T01 compliance 83% of sessions in children 8-12 [R01 26]. MDR lay-user requirements apply when the user is a lay person: Annex I 22 and 23.4(w), per MDCG 2019-11 rev.1, p. 11, fn 22 [R02 2.3].

**Assumptions to validate.** Parents of 6-12-year-olds will run the game at home under suitable conditions; children complete the session.

**Open questions.** Is the professional an intended user from version 1 (that pulls the product toward Option B in [R02 2.8])? Lower age bound (6) vs the evidence base (most studies 6-17 or 8-12)?

---

## Block 3. Economic Buyers

**Official definition.** Glossary: "the individuals or institutions that control the budget and make the purchasing decision" [G3] (P). Full definition: "Economic buyers are the people or institutions that pay for the solution. [...] A solution that is compelling to users but not to economic buyers will not be purchased. The economic buyer analysis must identify who controls the budget, what they care about (cost savings, revenue, efficiency, risk reduction), and what threshold of evidence they require to make a purchasing decision." [G3] (P). 18-block page: "who approves the purchase and pays" [G-hbmc] (P).

**Our answer (PROPOSAL), in launch order for the team to choose.**
| Buyer | What they care about | Evidence threshold (from sources) |
|---|---|---|
| Parent (B2C) | Reassurance, a next step, child wellbeing | Consumer trust; MDR Art. 7 limits what may be promised [W9] |
| Insurer / mutuelle / employer benefit (B2B2C) | Fewer unnecessary specialist visits, member satisfaction | TODO: no payer study found for this category |
| School or municipality (B2B2C) | Early support for pupils | TODO; also GDPR Art. 8/9 consent load [R02 2.6] |
| Paediatric practice or clinic (B2B, flat fee) | Better-prepared first appointments | Clinic-side analogue: AQUA RCT, fewer consultations to decision [W21] |
| Statutory payer (DE DiGA, BE M3) | Positive healthcare effect, budget impact | DiGA: evidence of positive healthcare effect assessed by BfArM [W2]; BE M3: socio-economic added value and budget impact [W5] |

**Assumptions to validate.** Parents pay for orientation (not only for therapy); a payer sees value in earlier, better-targeted referrals.

**Open questions.** Who pays in Romania (event country)? See block 5 (no route found).

---

## Block 4. Expert Influencers

**Official definition.** Glossary: "clinical champions, KOLs, and other individuals who shape adoption without controlling the budget" [G4] (P). Full definition: "Expert Influencers are individuals whose opinion significantly affects whether a solution is adopted, but who don't control the purchasing decision. They include clinical champions who advocate internally, KOLs whose published opinion shapes market perception, and anti-buyers [...] influential skeptics whose opposition can block adoption regardless of clinical evidence." [G4] (P). 18-block page: "champions, KOLs, and detractors" [G-hbmc] (P).

**Our answer (PROPOSAL).**
- Champions to recruit: paediatricians and child psychiatrists who face long waiting lists; school psychologists; parent associations for ADHD (names per country: TODO, none sourced here).
- Likely anti-buyers, with their published position:
  - QbTest meta-analysis: "should not be used as stand-alone screening or diagnostic tool, or as a triage system for accepting individuals on the waiting-list" [R01 10].
  - CPT meta-analysis: CPTs "should be used only within a more comprehensive diagnostic process" [R01 9].
  - NICE NG87 (summary copy): diagnosis "should not be made solely on the basis of rating scale or observational data" [R01 web-B].
  - Paediatric dermatology authors of the TikTok skincare study, as a model of how clinicians react publicly to trend-driven products aimed at children [W18].

**Assumptions to validate.** The orientation framing ("talk to a professional") defuses the anti-buyer arguments, which target diagnosis and triage gating.

**Open questions.** Which named KOL in Romania, France, Germany or Belgium would co-author the validation study (TODO)?

---

## Block 5. Authorities

**Official definition.** Glossary: "regulatory bodies, payors, specialty boards, and other institutional forces that shape market access" [G5] (P). Full definition: "Authorities are the institutional actors that establish the rules within which a healthcare solution must operate. [...] Understanding authorities means knowing which approvals are required, what evidence standards apply, what the timeline looks like, and how authority decisions affect commercial strategy." [G5] (P). 18-block page splits it into "Market Access: regulators and payors who permit and pay" and "Advisory Bodies: societies, advocacy groups, evidence standards" [G-hbmc] (P).

### 5.1 MDR classification (baseline from the team decision)
- Rule 11, sub-rule 11a: "Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa", unless the impact is serious (IIb) or may cause death or irreversible deterioration (III) [R02 2.2] (MDCG 2019-11 rev.1, p. 17).
- MDCG rev.1: sub-rule 11a "is generally applicable to all MDSW (excluding those MDSW that have no medical purpose)"; class I is for "all other MDSW" (11c) [R02 2.3].
- **Reading for the team (not a legal opinion):** an orientation toward "whether to seek an assessment and which professional" is information used to take a decision with a diagnostic purpose, so **class IIa is the expected class** (team baseline). Class I would require that the output carries no diagnostic and no referral purpose; the rev.1 class I examples have no diagnostic output [R02 2.3]. The closest Annex IV example (symptom-based depression scoring) is IIb, so the IIa vs IIb call ("serious" or "non-serious" situation) is open and belongs to the regulatory advisor [R02 2.4].
- **Missions.** MDCG places therapy software whose diagnostic function feeds back to determine follow-up therapy in class III per Rule 22; when a specialist determines the therapy, the example is IIa [R02 2.3]. Team decision: missions are wellbeing activities chosen by the parent or a professional, not selected by the score. The design must make that true in the code, not only in the text (assumption A3).
- Lay users: Annex I 22 and 23.4(w) apply [R02 2.3].
- Consequence: notified body, clinical evidence for the claimed performance (MDCG p. 7: claims must be "supported by appropriate level of clinical evidence") [R02 2.1]. Conformity-assessment annex (for example Annex IX): TODO, confirm in the MDR text with the regulatory advisor (MDR text not read at EUR-Lex this session [R02 open items]).

### 5.2 EU AI Act (Regulation (EU) 2024/1689)
- A class IIa device needing a notified body meets both conditions of Article 6(1), so an AI-based scoring model would be high-risk; Article 6(1) obligations apply from 2 August 2028 per the amended Article 113 (Digital Omnibus, Regulation (EU) 2026/1744, secondary source) [R02 2.5].
- Whether a transparent rule-based scorer [R03 4] is an "AI system" under Article 3(1) is open [R02 2.5].

### 5.3 GDPR, children's health data
- Art. 9(1) prohibits processing "data concerning health" unless an exception applies, for example explicit consent (9(2)(a)); Member States may add conditions (9(4)) [R02 2.6].
- Art. 8(1): below 16 (Member States may lower to 13), consent "given or authorised by the holder of parental responsibility"; France 15 (CNIL, S) [R02 2.6].
- Design consequence: parent account, child without account, nickname and birth year only, EU region hosting (Frankfurt) [R03 1, 5]. DPIA: expected, to confirm [R02 2.6].

### 5.4 Advertising authorities (feeds block 9)
- MDR Art. 7 prohibits, in labelling and **advertising**, any text, name, picture or sign that may mislead about intended purpose, safety and performance, including "creating a false impression regarding treatment or diagnosis" and "suggesting uses for the device other than those stated to form part of the intended purpose" [W9] (P, via a reproduction of the MDR text).
- France, ANSM: for reimbursable devices, advertising to the general public is possible "uniquement s'il s'agit de DM de classes I et IIa" (a posteriori control); for non-reimbursable devices, public advertising is possible, with prior control only for devices on the list of devices presenting a significant risk [W8] (P). Use of well-known non-professional personalities in public advertising is reserved to class I or IIa devices (R.5213-1, 4° g, per an ANSM 2025 working-group record) [W8b] (S).
- Germany (HWG), Belgium, Romania advertising rules for medical devices: TODO, not researched this session.

### 5.5 Reimbursement routes
| Country | Route | What the source says | Fit for ADHD Check (reading for the team) |
|---|---|---|---|
| Germany | DiGA, BfArM fast track (SGB V Sections 33a, 139e) | A DiGA is a CE-marked medical device "of the risk class I or IIa"; supports "the recognition, monitoring, treatment or alleviation of diseases"; "used by the patient alone or by patient and healthcare provider together"; prescribed by "a physician or psychotherapist"; about 73 million insured entitled; BfArM assesses within three months, including "evidence of the positive healthcare effect" [W2] (P). A secondary source says the DigiG (2024) extended DiGA to higher risk classes [W2b] (S). | Possible in principle: "recognition" is in scope and IIa is eligible. Open: is a parent-operated tool for a child "used by the patient"? Evidence of positive healthcare effect needed. DiGA price levels: TODO. Precedent for ADHD families: hiToco (parent training) listed per secondary sources [R02 1.2]. |
| France | PECAN (prise en charge anticipée numérique), LFSS 2022 art. 58, decree 2023-232 | Covers digital medical devices with "une dimension thérapeutique" (aim: LPPR) or "une activité de télésurveillance médicale" (aim: LATM); requires innovation, proof of benefit within deadlines, "un marquage CE médical valide", ANS interoperability and security conformity [W3] (P). Flat-rate coverage for one non-renewable year (search summary) [W3b] (S). Precedent: Poppins Clinical, class I therapeutic game for dyslexia, favourable CNEDiMTS PECAN opinion 23 June 2026 [R02 44]. | An orientation or diagnostic-aid tool is neither therapeutic nor telemonitoring as described on the ANS page, so **PECAN does not appear to fit** the orientation module. A separate therapeutic module would need its own evidence and would change the class analysis. Confirm with HAS before relying on this reading. |
| Belgium | mHealthBelgium validation pyramid | M1: CE marking, GDPR compliance, notification in the FAMHP database; M2: M1 plus quality criteria (authentication, data protection, interoperability); M3 (from 20 Jan 2021): reimbursement via INAMI/RIZIV, application assessing added value and budget impact [W5] (P, law-firm article dated 2 Feb 2021). Reimbursed listings so far are tied to care pathways: chronic heart failure (Feb 2025) and oncology remote monitoring (Apr 2026) [W6] (S). | M1 is reachable once CE marked. M3 requires an INAMI care pathway; none found for paediatric ADHD (TODO). |
| Romania | National reimbursement for digital health | No CNAS route for software medical devices or digital therapeutics found. A market report says CNAS reimbursement follows DRG rates and is "still evolving" [W7] (S, weak source). A parliamentary question (2026) asks the Ministry of Health about ADHD prevalence and publicly funded medication [W7b] (S). | **No route found: TODO.** Romania is the event country; B2C or B2B2C would be the only paths until a route is identified. |

**Assumptions to validate.** IIa (not IIb) holds; the notified body accepts the orientation framing; the missions module stays non-medical or is assessed with the rest.

**Open questions.** Is the intended purpose wording Option B or C of [R02 2.8]? Is a modular split (Option D) worth the effort [R02 2.8]?

---

## Block 6. Value Quantification

**Official definition.** Glossary: "the economic case for institutional buyers, translating clinical value into measurable financial impact" [G6] (P). Full definition: it "builds the economic argument for economic buyers by connecting the clinical value the solution creates to the financial metrics institutions care about: cost savings, revenue enhancement, efficiency gains, and risk reduction. [...] Value Quantification requires a rigorous, evidence-based calculation, not an assertion." [G6] (P). 18-block page: "the economic case for the institution" [G-hbmc] (P).

**What can be claimed today (with its limits).**
| Claim area | Evidence | Population, unit, year | Can we claim it for ADHD Check? |
|---|---|---|---|
| Time to referral (size of the problem) | Waits "up to 4+ years for children" | England, NHS services, Taskforce report April 2025 [R01 web-A] | Yes, as the problem, for England only |
| Clinic efficiency of an objective test (analogue) | With the QbTest report, 76% had a diagnostic decision at 6 months vs 50% without; hazard ratio 1.44 (95% CI 1.04-2.01); appointment length reduced 15% (time ratio 0.85, 0.77-0.93); no difference in diagnostic accuracy; health economics "cost neutral" | 267 randomised, aged 6-17, referred for ADHD assessment, England, published 2018 (AQUA RCT, PMID 29700813) [W21] (P) | **No.** Clinic-side test with HCP interpretation in a referred population; it does not transfer to a parent-side home game. It shows what kind of efficiency payers recognise |
| Cost burden | Direct medical cost weighted mean $5,319 (ADHD) vs $1,152 (counterparts), 32 studies | Children, mixed countries and years, USD [R01 6] | Only as burden context, not as a saving we produce |
| Triage efficiency (fewer unnecessary specialist visits, earlier visits for those who need them) | None found | n/a | **To be generated** |
| Under-recognition in girls | 0.67% vs 2.55% administrative prevalence | England [R01 web-A] | As problem only; our effect is to be generated |

**Studies that would generate the missing value (PROPOSAL for the team):**
1. **Diagnostic-accuracy / orientation-validity study:** children 6-12 from the general or school population (not case-control), game output vs a full clinical reference assessment; outcomes sensitivity, specificity, PPV, NPV of "assessment advised"; ethics approval and a clinical partner needed [R01 gaps 8].
2. **Pathway study (pragmatic, randomised or stepped):** families with a concern, orientation vs usual care; outcomes time from first concern to first appropriate appointment, proportion of appropriate referrals, parent decisional conflict. This is what a payer would price.
3. **Health-economic model** built on study 2 (template: the NIHR HTA model for QbTest [R01 11]).

**Assumptions to validate.** Earlier orientation shortens time to a first appropriate appointment in systems where the bottleneck is the specialist, not the decision to seek care (may not hold where waits are capacity-bound, as in England).

**Open questions.** Cost per specialist assessment per country: TODO.

---

## Block 7. Market Size

**Official definition.** Glossary page: "the volume of potential use cases, expressed as addressable patients, procedures, or episodes" [G7] (P). Full definition: "Market Size in the H-BMC is calculated bottom-up from clinical data rather than top-down from market reports. It expresses the number of patients, procedures, or episodes that could benefit from the solution, segmented by the team's target market and beachhead. [...] Top-down market sizing ('the global market is $4B') is not a substitute for bottom-up validation." [G7] (P). 18-block page: "potential uses, counted bottom-up" [G-hbmc] (P).

**Inputs (unit, population, timepoint stated per source).**
| Input | Value | Unit | Population | Timepoint | Source |
|---|---|---|---|---|---|
| EU27 children aged 6 to 12 | 31,711,259 | persons | EU27_2020, sum of single ages Y6 to Y12, both sexes | 1 January 2025 | Eurostat, dataset **demo_pjan** (DOI 10.2908/DEMO_PJAN), data updated 2026-09-25; EU27 values flagged "e" (estimated) and "p" (provisional) [W1] (P, API query) |
| France, 6-12 | 5,612,732 | persons | FR | 1 Jan 2025, flag "p" | [W1] |
| Germany, 6-12 | 5,589,134 | persons | DE | 1 Jan 2025 | [W1] |
| Belgium, 6-12 | 921,909 | persons | BE | 1 Jan 2025 | [W1] |
| Romania, 6-12 | 1,452,261 | persons | RO | 1 Jan 2025, flag "e" | [W1] |
| Community prevalence of ADHD/HD | 5.29% | proportion | Worldwide pooled, 102 studies, 171,756 subjects aged 18 or under, community or school surveys | Studies to 2006, published 2007 | PMID 17541055 [R01 1] |
| Lower, stricter community prevalence (sensitivity) | 3.4% (95% CI 2.6-4.5) | proportion | 41 studies, 27 countries, children and adolescents | Published 2015 | PMID 25649325 [R01 3] |

**Like-for-like note.** The prevalence is pooled over ages up to 18 and over countries; applying it to ages 6-12 in the EU assumes the same rate in that age band and region. Polanczyk found variability "explained by methods, not geography" [R01 1][R01 2], which supports the geographic transfer; the age-band transfer is an assumption (A6). The clinical-setting figure of 32.4% [R01 4] is **not** used: it describes children already in clinics.

**Calculation (computed in code, rounded to whole persons).**
| Level | Chain | Result (persons) | Sensitivity at 3.4% |
|---|---|---|---|
| TAM, population view (PROPOSAL) | EU27 children 6-12 = 31,711,259 [W1] | 31,711,259 children whose parents could run a check | n/a |
| TAM, prevalence view (PROPOSAL) | 31,711,259 x 5.29% [W1][R01 1] | **1,677,526** children with ADHD aged 6-12 in the EU27 | 1,078,183 |
| SAM (PROPOSAL: launch countries FR, DE, BE, RO) | (5,612,732 + 5,589,134 + 921,909 + 1,452,261) = 13,576,036 x 5.29% | **718,172** | 461,585 |
| SAM by country | FR 296,914; DE 295,665; BE 48,769; RO 76,825 (each x 5.29%) | see left | FR 190,833; DE 190,031; BE 31,345; RO 49,377 |
| SOM | SAM x achievable penetration in years 1-3 | **TODO** (no sourced penetration rate) | TODO |

**Which TAM view fits a parent-facing orientation tool is the team's call:** the product is used by any parent with a concern (population view, but only a TODO share of parents has a concern), while the prevalence view counts the children who most need an assessment. Share of parents of 6-12-year-olds with an attention concern: **TODO** (no source found). Number of uses per child per year (H-BMC counts "uses"): **TODO**, depends on the subscription design.

**Assumptions to validate.** A6 prevalence transfers to the 6-12 band; A7 the SAM countries are the right launch set (Romania chosen because the event is in Bucharest; FR, DE, BE because a reimbursement route was researched).

---

## Block 8. Transaction Model

**Official definition.** Glossary: "how each use of the solution converts to revenue" [G8] (P). Full definition: it "specifies the pricing model (per-use, subscription, per-patient, license), the unit of transaction, the price point, and the payment flow. The Transaction Model must be realistic for the economic buyer, how they budget, how procurement works, and what approval thresholds apply." (comma substituted for a dash in the source) [G8] (P). 18-block page: "the charge basis, price, and terms" [G-hbmc] (P).

**Price benchmarks (benchmarks only, not our price).**
| Product | Model | Price | Population / market | Source |
|---|---|---|---|---|
| EndeavorOTC (adults 18+) | Consumer subscription | USD 24.99/month; USD 99.99/6 months; USD 129.99/year | US | [R02 1.1 row 2] (S) |
| EndeavorRx (8-17) | Prescription | "$99 for a 30 day prescription" | US | [R02 1.1 row 1] (S) |
| Poppins (dyslexia, 7-11) | Subscription | about EUR 30/month | France | [R02 1.2] (S) |
| Nesplora AULA (clinician CPT) | Per use or clinic plan | EUR 27 per use plus EUR 110 activation; EUR 100/month (7 uses); EUR 1,670/year (620 uses) | Clinicians, Europe | [R02 1.1 row 6] (P) |
| Canvas Dx (autism analogue) | Payer coverage | price not found | US payers | [R02 1.1 row 7] |

**Options (PROPOSAL; the team sets the price).**
| Option | Unit and payment flow | Pros | Cons and risks |
|---|---|---|---|
| A. B2C subscription | Per family, monthly or yearly, Stripe [R03 6] | Fast, matches benchmarks | Churn once orientation is given; consumer CAC; ANSM and Art. 7 limits on claims |
| A2. One-off check plus optional subscription for missions | Per check, then per month | Matches the one-time nature of orientation | Missions must stay wellbeing, not therapy (block 5) |
| B. B2B2C flat fee (insurer, mutuelle, school, employer) | Per member per year or per school per year, independent of referrals | Lower CAC; trust | Longer sales cycle; consent via schools is heavy (GDPR Art. 8/9) |
| C. Clinic SaaS (flat) | Per practice per month for receiving parent-shared reports | Professional channel | Must not depend on the number of patients sent (block 14.2) |
| D. Statutory reimbursement | DiGA price (DE) or M3 (BE) | Scale and credibility | Needs CE IIa plus positive-effect evidence; PECAN does not fit (block 5) |
| Excluded | Fee per family referred, paid by a clinic | | Legal and ethical exposure in FR, DE, RO (block 14.2) |

---

## Block 9. Channels and Customer Relationships

**Official definition.** Glossary: "how the solution reaches stakeholders and what ongoing relationships sustain adoption" [G9] (P). Full definition: "Channels describes the pathways through which the solution reaches users, economic buyers, and influencers [...]. Customer Relationships describes what ongoing engagement is required to drive adoption, reduce churn, and generate referrals. In healthcare, channel strategy is significantly shaped by the length and complexity of the sales cycle." [G9] (P). 18-block page: "Channels: pathways to awareness, trial, and purchase"; "Customer Relationships: how you get, keep, and grow accounts" [G-hbmc] (P).

### 9.1 Team input: Instagram, trend-driven, "Sephora kids" model
### 9.2 What the evidence says about that trend
- **How it spread.** The best-sourced description is a peer-reviewed analysis of 100 TikTok skin-care videos by creators **aged 7 to 18**, reached through new accounts registered as 13-year-olds via the "For You" feed; each video averaged **1.1 million views**; regimens averaged 6 products and **USD 168** per regimen (TikTok, published Pediatrics July 2025, PMID 40484399) [W18] (P). The engine was **children as creators** and an algorithmic feed, not brand advertising to parents. Sales data showing commercial effect for the brand: **not found (TODO)**.
- **The backlash.**
  - Clinical: the same study concluded regimens "are costly, infrequently include sunscreen [26.2% of videos], and often involve exposure to ingredients that carry a risk of irritation, allergic contact dermatitis, and sun sensitivity. They offer little to no benefit for the pediatric populations they are targeting." [W18] (P). Dermatologists' public warnings in mainstream media [W20] (S).
  - Legislative: California AB 2491 (2024) would have barred sales of certain anti-ageing products to under-13s; it failed to advance in the Assembly [W19] (S).
- **Reading for the team.** A children's **health** product riding a children's consumption trend inherits the backlash pattern above in a more sensitive category (a mental-health label, not a cosmetic), with clinicians as natural critics (block 4).

### 9.3 Rules that bind the channel
- **Platform age floor.** Instagram: "You must be at least 13 to use Instagram, even if your parent or guardian approves your use of the app." [W17] (P). Our users are 6-12, so they are not a lawful audience on the platform; the audience is parents.
- **DSA Art. 28(2):** providers of online platforms "shall not present advertisements on their interface based on profiling [...] using personal data of the recipient of the service when they are aware with reasonable certainty that the recipient of the service is a minor" (Regulation (EU) 2022/2065) [W16] (P, via a reproduction of the final text). The duty sits on the platform; the consequence for us is that targeting must be built on adult (parent) audiences.
- **MDR Art. 7** (block 5.4): no claim outside the certified intended purpose; no "false impression regarding treatment or diagnosis" [W9].
- **ANSM (France):** public advertising of a class IIa device is allowed (a posteriori control for reimbursable class I/IIa; for non-reimbursable devices prior control only if on the significant-risk list) [W8]; celebrity or influencer-style endorsement allowed only for class I/IIa public advertising (S) [W8b].
- **French influencer law** (loi n° 2023-451 of 9 June 2023): whether it restricts influencer promotion of medical devices: **TODO, not verified** [W26] (S).
- **GDPR:** a child's result is health data [R02 2.6]; any user-generated "share your child's result" mechanic publishes a minor's health data. Exclude it.

### 9.4 Options (PROPOSAL; the team decides)
| Option | What it is | Trade-off |
|---|---|---|
| 1. Parent-targeted Instagram content, claims locked to the intended purpose | Educational posts for parents (attention at school, when to see whom), creators who are parents or clinicians, ads targeted to adult audiences, wording reviewed against Art. 7 | Reach with control; slower than a viral trend; every post is advertising of a medical device |
| 2. Trend mechanic modelled on "Sephora kids" | Children film themselves playing and share | Reach, but children under 13 off-platform, health data of minors published, the clinical backlash pattern of 9.2; **not recommended by the evidence collected** |
| 3. Trust channels | School psychologists, paediatric practices (flat SaaS), parent associations | Credibility with block 4; slower |
| 4. Payer channel | Insurer or mutuelle benefit, later DiGA prescription | Scale; needs evidence |

**Customer relationships (PROPOSAL).** Weekly parent summary email with no raw scores [R03 7]; a "share with a professional" report; missions chosen by the parent; an explicit "not a diagnosis" line on every result [R03 11.2].

---

## Block 10. Key Partners

**Official definition.** Glossary: "external relationships and organizations that make the business model possible" [G10] (P). Full definition: "Key Partners are the external organizations whose capabilities, relationships, or resources are essential to delivering the value promise or executing the business model. In healthcare they commonly include distribution partners, contract manufacturers, clinical study sites, regulatory consultants, reimbursement specialists, and health system reference customers." [G10] (P). 18-block page: "who you depend on" [G-hbmc] (P).

**Our answer (PROPOSAL).**
- Clinical partner (child psychiatry or paediatrics unit) for the validation study, ethics approval and reference assessments; the only public child datasets found are unsuitable [R01 E], [R03 0].
- Notified body designated for MDR software (fee lists published under MDR Art. 50 [W25] (S)).
- Regulatory consultant and DPO (GDPR Art. 8/9, DPIA).
- Technology: Supabase (EU Frankfurt region), Vercel, Stripe, Resend [R03 1].
- Distribution: insurers or mutuelles, school networks, parent associations (names TODO).
- Academic precedent to approach: LUSHA, University Hospital Grenoble (feasibility study NCT07204873) [R02 1.2].

**Open questions.** Is the clinical partner in Romania, France or both?

---

## Block 11. Key Activities

**Official definition.** Glossary: "the critical activities the company must perform to deliver its value promise and execute its business model" [G11] (P). Full definition: "Key Activities are the things the company must do well to make the business model work. They are the activities that differentiate the company and that cannot be reliably outsourced [...]. For healthcare innovators, Key Activities often include clinical evidence generation, regulatory management, health system sales, and product development" [G11] (P). 18-block page: "what stays in-house" [G-hbmc] (P).

**Our answer (PROPOSAL), in-house:**
1. Game and within-child scoring (variability indices, not absolute reaction times, because of browser lag of about 58 to 133 ms) [R03 2].
2. Evidence generation: the studies of block 6.
3. Regulatory: intended purpose, risk management, technical documentation, QMS (standard and article references: TODO, confirm with the advisor), post-market surveillance.
4. Data protection by design (no child account, minimal data, RLS) [R03 5].
5. Claims governance for every channel (Art. 7, ANSM).
6. Parent content and community.

---

## Block 12. Key Resources

**Official definition.** Glossary: "the assets that make the business model defensible and operational" [G12] (P). Full definition (extract): "In healthcare, Key Resources commonly include proprietary data, regulatory clearances, clinical evidence, reimbursement codes, manufacturing capabilities, and specialized clinical or regulatory expertise. Key Resources are closely related to defensibility" [G12] (P). 18-block page: "defensible assets and runway" [G-hbmc] (P).

**Our answer (PROPOSAL).**
- Proprietary dataset: child gameplay sessions with clinical labels. Does not exist publicly ("Not found: a public, child-specific dataset ... with ADHD labels and a verified permissive licence") [R01 E]; HYPERAKTIV is adult and restricted [R03 0].
- CE certificate (IIa) and, later, DiGA listing or M3 status.
- Clinical evidence (block 6 studies).
- Game IP, the scoring method, the brand's trust with parents.
- Runway: TODO.

---

## Block 13. Cost Structure

**Official definition.** Glossary: "what it costs to operate the business model at scale" [G13] (P). Full definition: "Cost Structure maps the fixed and variable costs required to deliver the value promise, maintain key resources, execute key activities, and sustain key partnerships. In healthcare, cost structure analysis must account for the extended pre-revenue period required for regulatory clearance and clinical evidence generation." [G13] (P). 18-block page: "what delivery costs" [G-hbmc] (P).

**Our answer (PROPOSAL), sourced items only.**
| Cost item | Figure | Unit, year | Source |
|---|---|---|---|
| Notified body application fee (example NB 1383, CMI Medical) | EUR 1,080 | flat, price list 26-001 | [W24] (P) |
| Notified body audit | EUR 1,495 per day (one auditor); EUR 3,200 per day (two auditors) | per day | [W24] (P) |
| Technical documentation assessment, class IIa | EUR 245 per hour | per hour | [W24] (P) |
| Total class IIa certification | **TODO**: depends on audit days and assessment hours the notified body estimates; ask two or three notified bodies for a quote | | [W25] (S) |
| Clinical validation study | **TODO** | | none found |
| Hosting and tools (prototype) | Supabase free plan (2 projects, 500 MB, 50,000 MAU); Vercel Pro USD 20 per user per month (Hobby is non-commercial only); Resend free 3,000 emails/month, Pro USD 20/month | 2026 pricing pages | [R03 1] |
| AI Act conformity (if AI-based, from 2 Aug 2028) | **TODO** | | [R02 2.5] |
| Customer acquisition (CAC) | **TODO** | | none found |

**Pre-revenue period.** Between now and CE IIa the product cannot be marketed with an ADHD orientation claim (MDCG p. 7 and Art. 7) [R02 2.1][W9]; duration: TODO.

---

## Block 14. Revenue Stream

**Official definition.** Glossary: "the revenue the business model generates at scale, derived from market size and transaction model" [G14] (P). Full definition: "Revenue Stream is calculated by applying the Transaction Model to the addressable Market Size. [...] it is built from the bottom up using validated assumptions about penetration, pricing, and transaction frequency. Revenue Stream analysis should model multiple scenarios (conservative, base, optimistic) and identify the assumptions that most significantly affect the outcome." [G14] (P). 18-block page: "volume x price" [G-hbmc] (P).

### 14.1 Formula (inputs TODO until the team chooses)
Revenue (year n) = SAM (block 7) x penetration (TODO) x paying conversion (TODO) x price (TODO, block 8) x months retained (TODO), plus B2B2C contracts x contract value (TODO). Three scenarios to fill: conservative, base, optimistic. No number is produced here because penetration, conversion, price and retention have no source.

### 14.2 Team input: clinic pays a fee per referred family (affiliate)
What the sources say:
| Jurisdiction | Rule | Text (verbatim where read) | Relevance |
|---|---|---|---|
| France | Code de déontologie médicale, art. 23 (R.4127-23 CSP) | "Tout compérage entre médecins, entre médecins et pharmaciens, auxiliaires médicaux ou toutes autres personnes physiques ou morales est interdit." CNOM commentary: it covers "toutes les formes de compérage, notamment avec d'éventuels pourvoyeurs et 'rabatteurs' de clientèle", and "Il peut y avoir compérage sans versement d'argent" [W10] (P) | A clinic paying a company per family sent is the "rabatteur" pattern the commentary names |
| France | Anti-gift rules (L.1453-3 to L.1453-6 CSP) | Prohibit companies producing or marketing health products (including medical devices) from offering advantages to health professionals, with exceptions under agreements [W15] (S) | Relevant to any perk we give clinicians (for example free accounts tied to volume) |
| Germany | § 299a StGB (Bestechlichkeit im Gesundheitswesen) | A health professional who takes an advantage as consideration for unfairly favouring another "bei der Zuführung von Patienten" faces "Freiheitsstrafe bis zu drei Jahren oder [...] Geldstrafe" [W11] (P) | Criminal exposure where the advantage flows to a health professional |
| Germany | § 299b StGB (Bestechung im Gesundheitswesen) | Mirror offence for whoever offers or grants the advantage to a health professional for the "Zuführung von Patienten" [W12] (P) | Whether a fee paid by a clinic to a non-professional company falls under 299a/b: **TODO, needs German counsel** |
| Germany | § 31 MBO-Ä (professional code, model) | Doctors may not demand, accept, offer or grant payment or other advantages "für die Zuweisung von Patientinnen und Patienten" [W13] (S, quoted via a health-insurer presentation and a BÄK document; Land codes apply) | A doctor paying for patient referrals is a professional-law breach; contracts can be void (S) |
| Romania | Codul de deontologie medicală (CMR, updated April 2026), art. 16(11) | "Medicul nu poate accepta niciun fel de avantaje materiale sau morale pentru îndrumarea pacienţilor către alt coleg medic sau către o unitate sanitară publică sau privată." [W14] (P) | Doctor side of a referral fee |
| Romania | Same code, art. 41 (Concurenţa profesională), letter f) | Lists as prohibited conduct "oferirea de avantaje materiale unei persoane fizice sau juridice pentru atragerea pacienţilor" [W14] (P) | **Directly describes a clinic paying a company to attract patients** |
| Romania | Same code, art. 10(3) | "Sunt interzise comportamentele care denaturează relaţia medicală în una comercială." [W14] (P) | General principle |
| EU | MDR Art. 7 | No claim that may mislead about intended purpose or create a false impression regarding diagnosis [W9] | An orientation steered by who pays risks being read as misleading (inference, to confirm with counsel) |

**Reading for the team.** In all three countries checked, the doctor or clinic side of a per-patient referral payment is prohibited by professional codes, and in Germany the criminal provisions use the same "Zuführung von Patienten" concept. A per-referral fee would also compromise the neutrality that the orientation promise depends on (block 1). This is a collection of texts, not legal advice: Belgian rules not researched (TODO).

**Safer alternatives (each still to be checked by counsel in each country):**
| Alternative | How it works | Residual risk |
|---|---|---|
| Flat SaaS fee to clinics | Clinic pays a fixed monthly fee for a tool that receives parent-shared reports, whatever the number of families | Romania art. 41 f) could still bite if the fee is in substance for attracting patients; keep the fee tied to software functions |
| Neutral directory | Parents see professionals by location and specialty, ordered by neutral criteria; listing free or flat, never ranked by payment | Low, if ordering is neutral and disclosed |
| B2B partnership (insurer, school, employer) | The partner pays per member or per site; parents choose any professional | Low; slower sales |
| Public pathway | Orientation hands off to the public route (GP, school medicine) | No revenue from the referral; credibility gain |

---

## Block 15. Investor Economics

**Official definition.** Glossary: "the gross margin, unit economics, capital requirements, and return potential of the business model" [G15] (P). Full definition: "Investor Economics synthesizes the H-BMC into the metrics investors and program funders use to evaluate fundability: gross margin, contribution margin, customer acquisition cost (CAC), lifetime value (LTV), LTV:CAC ratio, capital required to reach profitability, and projected return multiple. It is the final block in the canvas because it is derived from all upstream assumptions." [G15] (P). 18-block page: "margins, LTV:CAC, and capital needs" [G-hbmc] (P).

**What investors in digital health look for (cited).** "showing utilization of a product is simply table stakes [...] not a business plan, and no longer enough to attract funding"; investors ask "have you changed behavior? Have you produced an outcome that matters?" and "do you have customers who are willing to pay for your product?" (Rock Health, 15 May 2017) [W22] (P). Newer sources found were advisory articles, not surveys (S, not used).

**Value-inflection milestones (PROPOSAL, ordered).**
1. Hackathon prototype with within-child indices and a frozen intended purpose (Option B or C) [R02 2.8].
2. Pilot with the clinical partner (feasibility, usability with parents).
3. Validation study (block 6, study 1): the first claimable performance.
4. CE IIa certificate (notified body).
5. First B2B2C contract or payer pilot (study 2 data).
6. DiGA application (DE) or M3 file (BE) if evidence supports it.
7. AI Act high-risk readiness before 2 August 2028 if the scorer is an AI system [R02 2.5].

**Unit economics.** Gross margin, CAC, LTV, LTV:CAC, capital to break-even: **all TODO**; no sourced input exists yet.

**Order-of-magnitude cost of class IIa certification.** Only per-item notified body fees were found (block 13: EUR 1,080 application, EUR 1,495 per audit day, EUR 245 per hour of class IIa documentation review at NB 1383 [W24]); the number of days and hours is set by each notified body's quote, so the **total is TODO**. Clinical study cost: **TODO**.

---

## Assumptions to validate, ranked by risk (highest first)

| Rank | ID | Assumption | Why it is high risk | How to test |
|---|---|---|---|---|
| 1 | A1 | The game output carries real signal for "assessment advised" in an unselected 6-12 population | No such study exists; best analogues reach Se 0.75-0.78 / Sp 0.70-0.71 in case-control designs [R01 9][R01 10]; real-world QbTest NPV as low as 24% [R01 12] | Study 1 (block 6) |
| 2 | A2 | Class IIa (not IIb) is accepted by the notified body for the orientation purpose | Closest MDCG example is IIb [R02 2.3] | Regulatory advisor opinion; early notified body dialogue |
| 3 | A3 | Missions stay outside Rule 22 (parent or professional chooses, the score never selects) | MDCG Rule 22 example puts automatic selection in class III [R02 2.3] | Design review of the code path; written intended purpose |
| 4 | A4 | A per-referral clinic fee is not used | Prohibited or exposed in FR, DE, RO (block 14.2) | Counsel review; choose a 14.2 alternative |
| 5 | A5 | Parent-targeted marketing can grow without the children's-trend mechanic and without breaching Art. 7 / ANSM | Trend model carries clinical and legislative backlash [W18][W19]; platform age 13 [W17]; DSA Art. 28 [W16] | Small paid test on parent audiences with locked claims |
| 6 | A6 | 5.29% prevalence transfers to EU children aged 6-12 | Pooled to age 18 and worldwide [R01 1] | Look for an EU age-specific estimate (TODO) |
| 7 | A7 | Parents pay for orientation (not only therapy) | Consumer benchmarks found are therapy products [R02 Part 3] | Pricing interviews; landing-page test |
| 8 | A8 | A parent-operated child tool can be a DiGA ("used by the patient") | Not addressed by the BfArM page [W2] | Ask BfArM (DiGA guide) |
| 9 | A9 | Earlier orientation shortens time to an appropriate appointment | Waits may be capacity-bound [R01 web-A] | Study 2 (block 6) |
| 10 | A10 | Browser timing is good enough for within-child indices | Device lag 58-133 ms, constant within device [R03 2] | Timing probe on the demo tablet |

## Open questions for the team (decisions, not research)
1. Which canvas version will the jury score: the 15-block slide or the 18-block GAITS guide?
2. Intended-purpose wording: Option B (HCP-facing) or C (parent-facing) of [R02 2.8]?
3. Launch countries (SAM): FR, DE, BE, RO as proposed, or another set?
4. TAM view: population of 6-12 or prevalence-based?
5. Transaction model and price (block 8 options).
6. Channel mix (block 9.4) and whether any trend mechanic stays.
7. Clinic relationship: which 14.2 alternative.

---

## Sources

**Canvas definitions (GAITS, read 2026-10-19)**
- G0. GAITS, "H-BMC Framework" glossary term. https://www.gaits.org/w/hbmc-framework (P)
- G-glossary. GAITS Glossary (tiers, block one-liners). https://www.gaits.org/glossary (P)
- G-hbmc. GAITS, "The H-BMC Guide" (18 blocks, 8 rows; full guide behind sign-in). https://www.gaits.org/hbmc ; block reference https://gaits.org/hbmc/the-blocks redirected to a sign-in page (P)
- G-qs. GAITS H-BMC Quick Start. https://gaits.org/hbmc/quick-start (P)
- G1 to G15. GAITS glossary pages: https://www.gaits.org/w/value-promise ; /w/users ; /w/economic-buyers ; /w/expert-influencers ; /w/authorities ; /w/value-quantification ; /w/market-size ; /w/transaction-model ; /w/channels-customer-relationships ; /w/key-partners ; /w/key-activities ; /w/key-resources ; /w/cost-structure ; /w/revenue-stream ; /w/investor-economics (all P)
- W-cimit. https://www.cimit.org/web/guest/h-bmc returned the CIMIT home page, no H-BMC content (P)

**Research files (team sources of truth)**
- R01. research/01-literature-unmet-need.md (reference numbers as in that file)
- R02. research/02-competitors-and-regulatory.md (section or reference numbers as in that file)
- R03. research/03-tech-stack.md (section numbers)
- 04-game-design-symptom-mapping.md: not present in the folder on 2026-10-19.

**Web sources**
- W1. Eurostat, Population on 1 January by age and sex, dataset demo_pjan, DOI 10.2908/DEMO_PJAN, data updated 2026-09-25. Queried via API: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?format=JSON&geo=EU27_2020&geo=FR&geo=DE&geo=BE&geo=RO&sex=T&unit=NR&age=Y6..Y12&time=2025 (ages Y6 to Y12 summed in code; flags: EU27 "ep", FR "p", RO "e") (P)
- W2. BfArM, "Digital Health Applications: Interesting facts". https://www.bfarm.de/EN/Medical-devices/Tasks/DiGA-and-DiPA/Digital-Health-Applications/Interesting-facts/_node.html (P)
- W2b. Osborne Clarke (DE) and HÄV FAQ 2026-08-06 on DiGA risk classes after DigiG (S). https://www.osborneclarke.com/de/insights/wie-aus-der-gesundheits-app-eine-vermarktbare-digitale-gesundheitsanwendung-diga-wird-teil-2 ; https://www.haev.de/fileadmin/user_upload/pdf/Digitales/2026_08_06_FAQ_DiGA_in_der_Hausarztpraxis.pdf
- W3. Agence du Numérique en Santé, "Tout comprendre sur la prise en charge anticipée des dispositifs médicaux numériques", 11 Oct 2023. https://esante.gouv.fr/actualites/toutes-les-actualites/tout-comprendre-sur-la-prise-en-charge-anticipee-des-dispositifs-medicaux-numeriques (P)
- W3b. ANS PECAN summary sheet and HAS 2023 webinar (S). https://industriels.esante.gouv.fr/sites/default/files/media/document/innovation/ANS-DEII_Inno-Fiche_synthetique_PECAN.pdf ; https://www.has-sante.fr/upload/docs/application/pdf/2023-09/presentation_webinaire_has_dispositif_medicaux_numeriques_2023.pdf
- W5. Osborne Clarke, "Breakthrough for digital healthcare in Belgium as scheme launches to reimburse mobile health apps", 2 Feb 2021. https://www.osborneclarke.com/insights/breakthrough-digital-healthcare-belgium-scheme-launches-reimburse-mobile-health-apps/ (P)
- W6. MTR Consult news on Belgian Level 3+ listings (S). https://mtrconsult.com/news/belgium
- W7. Insights10, Romania digital health market analysis (S, weak). https://www.insights10.com/report/romania-digital-health-market-analysis/
- W7b. Romanian Chamber of Deputies, written question 3770A/2026 (S, PDF not parsed). https://www.cdep.ro/interpel/2026/i3770A.pdf
- W8. ANSM, "Modalités encadrant les demandes d'autorisation de publicité pour les dispositifs médicaux (DM / DMDIV)". https://ansm.sante.fr/vos-demarches/industriel/modalites-encadrant-les-demandes-dautorisation-de-publicite-pour-les-dispositifs-medicaux-dm-dmdiv (P)
- W8b. ANSM, compte rendu groupe de travail publicité DM, June 2025 (S). https://ansm.sante.fr/uploads/2026/04/08/20250611-cr-ci-dm-reunion-gt-pub.pdf
- W9. Regulation (EU) 2017/745, Article 7 "Claims", text as reproduced by Advisera. https://advisera.com/13485academy/mdr/claims/ (P via reproduction; confirm on EUR-Lex)
- W10. Conseil national de l'Ordre des médecins, Article 23 "Compérage" (R.4127-23 CSP) with commentary. https://www.conseil-national.medecin.fr/code-deontologie/devoirs-generaux-medecins-art-2-31/article-23-comperage (P)
- W11. § 299a StGB. https://www.gesetze-im-internet.de/stgb/__299a.html (P)
- W12. § 299b StGB. https://www.gesetze-im-internet.de/stgb/__299b.html (P)
- W13. § 31 MBO-Ä, as quoted in KKH presentation and Bundesärztekammer documents (S). https://kkh.de/content/dam/kkh/dokumente/abrechnungsbetrug/praesentationen/2022/besprechung-bgh-entscheidung.pdf ; https://www.bundesaerztekammer.de/fileadmin/user_upload/_old-files/downloads/pdf-Ordner/Recht/20161112_Antikorruption_Ufer.pdf
- W14. Colegiul Medicilor din România, Codul de deontologie medicală, updated April 2026 (art. 10(3), 16(11), 41 f). https://www.cmr.ro/wp-content/uploads/2026/04/codul-de-deontologie-medicala-al-colegiului-medicilor-din-romania-actualizat-aprilie-2026.pdf (P, text extracted locally)
- W15. SNITEM, SI-219 "Loi anti-cadeaux" (S). https://www.snitem.fr/wp-content/uploads/2020/10/SI-219-Loi-anti-cadeaux.pdf
- W16. Regulation (EU) 2022/2065 (Digital Services Act), Article 28, as reproduced at https://www.eu-digital-services-act.com/Digital_Services_Act_Article_28.html (P via reproduction; confirm on EUR-Lex, which returned empty content)
- W17. Instagram, "Instagram Community Terms of Use FAQs". https://about.instagram.com/blog/announcements/instagram-community-terms-of-use-faqs (P)
- W18. Hales M, Rigali S, Paller A, Liszewski W, Lagu T. Pediatric Skin Care Regimens on TikTok. Pediatrics 2025;156(1). PMID 40484399. DOI 10.1542/peds.2024-070309. Source: PubMed (P, abstract)
- W19. Cosmetics Design, "California bill banning sale of anti aging skin products to children under 13 fails to advance", 5 June 2024 (S). https://cosmeticsdesign.com/Article/2024/06/05/California-bill-banning-sale-of-anti-aging-skin-products-to-children-under-13-fails-to-advance
- W20. CTV News, "'Sephora kids' skin-care trend draws warnings from dermatologists" (S). https://ctvnews.ca/lifestyle/sephora-kids-skin-care-trend-draws-warnings-from-dermatologists-1.6740753
- W21. Hollis C, et al. The impact of a computerised test of attention and activity (QbTest) on diagnostic decision-making in children and young people with suspected ADHD: single-blind randomised controlled trial. J Child Psychol Psychiatry 2018;59(12):1298-1308. PMID 29700813. DOI 10.1111/jcpp.12921. Source: PubMed (P, abstract)
- W22. Rock Health, "The evidence healthcare startups need to be taken seriously by investors", 15 May 2017. https://rockhealth.com/the-evidence-healthcare-startups-need-to-be-taken-seriously/ (P)
- W24. Czech Metrology Institute, Notified Body No. 1383, "List of standard fees for conformity assessment activities under the MDR (2017/745)", price list 26-001. https://cmi.gov.cz/sites/all/files/public/download/Sluzby_oznameneho_subjektu/MDR/P04B_880-MP-A003_Price%20list%20CMI%20Medical_26-001.pdf (P, text extracted locally)
- W25. Notified body standard fee lists under MDR Article 50, Commission consolidated list (S, via summaries). https://mdrregulator.com/news/european-commission-published-notified-body-list-of-standard-fees-for-mdr-and-ivdr-related-services ; https://casusconsulting.com/eu-commission-notified-body-list-fees-estimate-ce-marking-cost/
- W26. Loi n° 2023-451 du 9 juin 2023 (influence commerciale), JO 10 June 2023 (S; content on medical devices not verified). https://www.dalloz-actualite.fr/document/loi-n-2023-451-9-juin-2023-jo-10-juin

**Not researched or not found (TODO):** official per-block guiding questions (gated); CIMIT authorship and the "2026" version; Romania reimbursement route; Belgian and Romanian rules on medical-device advertising and on referral fees in Belgium; German HWG; DiGA price levels; class IIa certification total cost; clinical study cost; CAC, LTV, conversion, retention; share of parents with an attention concern; EU age-specific ADHD prevalence for 6-12; Sephora sales effect of the trend.
