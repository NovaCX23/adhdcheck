# 04 - Game design science: what to measure, how, and why (symptom-to-game mapping)

Researched 2026-10-19 for the hackathon team. Collects and proposes; **the team decides**. Compatible with `SessionMetrics` v1 and `ScoreResult` v1 in `03-tech-stack.md` section 11 (mini-game 1 emits v1 unchanged; everything else is an additive, optional proposal).

Evidence rules used here: every evidence claim carries a PMID, DOI or URL. PubMed records were retrieved and checked with the PubMed metadata tool (title, journal, DOI, abstract) during this research; only abstracts were read unless stated. "No evidence found" means none was found in this research, not that none exists. Every timing, trial count or cut-off that is not sourced is labelled **design choice** or **TODO: norms needed**.

## 0. Team decision applied in this document (2026-10-19)

- The product is **orientation, not diagnosis** (class IIa maximum).
- The only two parent-facing outcomes are: **"A professional assessment is recommended"** or **"No specific follow-up indicated by this activity"**. A third, technical state ("not enough data, please play again") is needed when data quality fails; it is not an outcome about the child.
- Never shown to parents: an ADHD probability, a severity, a subtype, a percentile framed as risk, or the word "diagnosis" except in "this is not a diagnosis".
- Missions are general wellbeing and attention activities **chosen by the parent or a professional**, never auto-prescribed from the score. Consequence for the contract: `ScoreResult.recommendations` (03, section 11.2) must not carry score-driven mission ids. Proposal: rename to `next_step_text` and fill it only with the fixed outcome sentence.
- Mapping to the existing `ScoreResult.band`: `follow_up_suggested` displays "A professional assessment is recommended"; `no_flag` displays "No specific follow-up indicated by this activity"; `insufficient_data` displays "Not enough data, please play again".

## Summary

1. **18 DSM symptoms, game-observability honestly rated:** 0 strong, 5 moderate, 6 weak, 7 none / not observable in a game. No symptom earns "strong" because even the best task metrics separate ADHD from non-ADHD groups only modestly at the individual level (CPT pooled sensitivity 0.75 and specificity 0.71 for the total score, 19 studies in children and adolescents, PMID 37004919) and are not specific to ADHD (PMID 24731074, PMID 23872284).
2. **Best-supported in-game metrics** (group differences in children, from meta-analyses): reaction-time variability (Hedges' g = 0.76 vs typically developing children, 319 studies, PMID 23872284), CPT perceptual sensitivity d' (PMID 22428793), working memory (large effects, PMID 22917740), stop-signal reaction time (g = 0.62, PMID 20719043), choice impulsivity (g = 0.47, PMID 26602954).
3. **Five mini-games plus a 30 s calibration, about 14 minutes**, one story (a firefly keeper in a night forest), one character, five missions. Mini-game 1 is the `go_nogo` task already specified in the v1 contract.
4. **Parent questionnaire for the 7 non-observable items:** NICHQ Vanderbilt Assessment Scale, Parent, 1st edition (2002), free to download from NICHQ with credit; commercial use is not addressed on the NICHQ page, so written permission is needed before a paid product. ADHD-RS-5 is not usable (publisher licence for the purchaser's own clients). SNAP-IV is free of charge but its licence is unstated.
5. **AI:** hackathon = transparent rules with `validated: false`; an LLM only for story text and for wording the parent report around a fixed, pre-approved outcome sentence, behind an output guard. After the hackathon: collect labelled data under a clinical investigation plan, then consider a simple, explainable ML model, accepting that an ML score inside a class IIa device very likely makes it a high-risk AI system under the EU AI Act (Article 6(1)).
6. **The biggest validity threat is the game itself:** gamification raises motivation, and strong incentives normalised task persistence in children with ADHD (PMID 22187093); children with ADHD showed no inhibition deficit inside a commercial-style videogame (PMID 12403149). A game that is too fun can hide exactly what it is meant to see.

## 1. The questions: DSM symptom domains and free rating scales

### 1.1 The 18 symptoms (paraphrased)

The DSM text is copyrighted, so the items below are short paraphrases in our own words, in the order used by DSM-based parent scales (the Vanderbilt parent form numbers inattention as items 1 to 9 and hyperactivity/impulsivity as items 10 to 18; read from the form at https://ramp.luriechildrens.org/globalassets/media/pages/specialties--conditions/programs/mood-anxiety-adhd-collaborative-care-maacc-program/measures/nichq-vanderbilt-parent.pdf). DSM-5 kept the 18-symptom A-criteria and added descriptors for older ages (PMID 24626330, DOI 10.1177/1087054714526040). Whether DSM-5-TR (2022) changed any item wording: **TODO, verify in the DSM-5-TR text** (not read in this research).

| ID | Domain | Paraphrase |
|---|---|---|
| IA1 | Inattention | Misses details, makes careless errors |
| IA2 | Inattention | Struggles to keep attention on tasks or play |
| IA3 | Inattention | Seems not to listen when addressed directly |
| IA4 | Inattention | Does not follow instructions through, leaves tasks unfinished |
| IA5 | Inattention | Struggles to organise tasks and activities |
| IA6 | Inattention | Avoids or dislikes tasks needing sustained mental effort |
| IA7 | Inattention | Loses things needed for tasks |
| IA8 | Inattention | Easily distracted by outside stimuli |
| IA9 | Inattention | Forgetful in daily activities |
| HI1 | Hyperactivity | Fidgets, taps hands or feet, squirms |
| HI2 | Hyperactivity | Leaves seat when staying seated is expected |
| HI3 | Hyperactivity | Runs or climbs where it is inappropriate |
| HI4 | Hyperactivity | Cannot play or do leisure activities quietly |
| HI5 | Hyperactivity | Constantly "on the go", as if driven by a motor |
| HI6 | Hyperactivity | Talks excessively |
| HI7 | Impulsivity | Blurts out answers before the question is finished |
| HI8 | Impulsivity | Has difficulty waiting for a turn |
| HI9 | Impulsivity | Interrupts or intrudes on others |

The Vanderbilt scoring instructions print the DSM-IV symptom rule used by the scale: a positive item is a rating of 2 or 3 ("often", "very often"); 6 or more positives out of 9 in a domain, plus at least one performance item rated 4 or 5, and "These scales should NOT be used alone to make any diagnosis" (https://uwhatc.uw.edu/PDF/Temp%20TF-%20CBT/pages/3%20Assessment/ADHD%20Measures%20from%20SMH/07ScoringInstructions.pdf, read via pdftotext). That rule is a criterion count, not a statistically derived cut-off for our population.

### 1.2 Free rating scales and licences

| Scale | Items | What we verified | Licence status | Usable in a commercial product? |
|---|---|---|---|---|
| NICHQ Vanderbilt Assessment Scale, Parent, 1st ed. (2002) | 18 DSM symptom items (0 to 3: Never, Occasionally, Often, Very Often), 22 ODD/CD/anxiety-depression screen items, 8 performance items (1 to 5) | NICHQ page: the first edition is free to download; cite NICHQ when referencing it; 2nd (2011) and 3rd (2019) editions are sold by the AAP (https://nichq.org/resource/nichq-vanderbilt-assessment-scales). Form footer: "Copyright 2002 American Academy of Pediatrics and National Initiative for Children's Healthcare Quality". Psychometrics of the parent form in a referred population: acceptable internal consistency and DSM-consistent factor structure, N = 243 (PMID 14602846, DOI 10.1093/jpepsy/jsg046). Teacher form: sensitivity .69, specificity .84, PPV .32, NPV .96 for predicting later case definition (community sample, PMID 23363973, DOI 10.1097/DBP.0b013e31827d55c3) | Free download of 1st edition; commercial use **not addressed** on the NICHQ page | Hackathon demo with credit: within the stated free download. Paid product: **written permission from NICHQ/AAP needed** (TODO). Using a subset of items or modifying wording: same permission question (a clinic copy notes the AAP does not review or endorse modifications, search snippet, unverified) |
| SNAP-IV (Swanson, Nolan and Pelham) | 18 ADHD items (26 with ODD) rated 0 to 3 | Psychometrics and school-district normative ratings: parent N = 1,613, teacher N = 1,205; parent scores above 1.2 increased probability of concern (LR > 10), above 1.8 of ADHD diagnosis (LR > 3), mean item score, US elementary school sample (PMID 18310593, DOI 10.1177/1073191107313888) | Widely distributed free of charge, credited to James M. Swanson; **no licence statement found** (search results, https://novopsych.com/alternative/conners-alternatives-child-adhd/) | Unknown: contact the author before any product use |
| SWAN | 18 items, 7-point strengths-to-weaknesses scale | Described as free by NovoPsych; NITRC page cites adhd.net as the source (https://fcon_1000.projects.nitrc.org/indi/enhanced/assessments/swan.html) | No licence statement found | Unknown |
| ADHD Rating Scale-5 (DuPaul et al.) | 18 DSM-5 items | Guilford sells it with a limited duplication licence for the purchaser's own clients (https://www.guilford.com/books/ADHD-Rating-Scale-5-for-Children-and-Adolescents/DuPaul-Power-Anastopoulos-Reid/9781462524877) | Copyrighted, restricted | **No** without publisher permission |

Note for the builder: the parent form read for this research numbers performance items 41 to 48, while the scoring instructions refer to parent performance items 48 to 55. The two documents are different printings; key on item content, never on item numbers.

## 2. Symptom-to-game mapping table (core deliverable)

Confidence scale (definition used here): **strong** = meta-analytic evidence that the metric differs in children with ADHD AND evidence that it tracks this specific symptom at the individual level; **moderate** = meta-analytic or large-sample group difference in children for a construct close to the symptom; **weak** = single studies, adult or indirect evidence, or a clear construct gap between metric and symptom; **none** = no evidence found or not observable. Group differences do not equal individual classification (PMID 37004919).

| ID | In-game behaviour that can observe it | Mechanic (mini-game) | Metric | Evidence (PMID / DOI / URL) | Confidence |
|---|---|---|---|---|---|
| IA1 careless errors | Taps a moth (no-go) or misses a firefly (go) on easy discriminations | M1 Lantern Watch (go/no-go) | Commission rate, omission rate, d' | CPT deficits in children with ADHD are explained by lower perceptual sensitivity d' and slower drift rate, 47 studies (PMID 22428793, DOI 10.1037/a0027205); commission errors index withholding, omissions index sustained attention, 318 studies across 11 disorders, not specific (PMID 24731074, DOI 10.1037/a0036295) | moderate |
| IA2 difficulty sustaining attention | Responses become slower, more erratic and more often missed as the watch goes on | M1 (3 blocks), M2 | RT SD, RT CV, ex-Gaussian tau, omission rate, vigilance decrement (last third vs first third) | RT variability: children/adolescents with ADHD g = 0.76 vs TD, but only g = 0.25 vs clinical controls; stimulants reduce it (g = -0.74) (PMID 23872284, DOI 10.1016/j.cpr.2013.06.001). Ex-Gaussian tail (tau) larger in ADHD boys, small sample n = 17 (PMID 10900704, DOI 10.1016/s0001-6918(00)00019-6). Performance over time: only small to moderate effects, few studies (PMID 22428793) | moderate |
| IA3 does not seem to listen | Misses a spoken cue ("when the owl hoots, tap!") while watching the screen | M2 Storm Watch, auditory-cue trials | Omission rate and RT on auditory-cued trials vs visual trials | AULA virtual classroom CPT: ADHD presentations separated only when visual and auditory modalities were analysed separately, N = 117 (PMID 26896148, DOI 10.1177/1087054716629711). Construct gap: "not listening when spoken to" is social, the task is auditory vigilance | weak |
| IA4 does not follow through, leaves tasks unfinished | Abandons a mission, pauses, stops responding for long stretches | All missions | Mission completion, idle time, quit attempts, within-session decline | Children with ADHD showed a performance decrease over time under feedback only; strong incentives (10 euros, gaming) normalised persistence (PMID 22187093, DOI 10.1007/s10802-011-9601-8). Means a fun game can hide this symptom | weak |
| IA5 difficulty organising | Plans an inefficient route to collect items | Optional M6 Route Planner (not in the 15 min core) | Moves above minimum, planning time | Planning is among the strongest and most consistent EF effects, medium range (.46 to .69 across EF measures), 83 studies (PMID 15950006, DOI 10.1016/j.biopsych.2005.02.006). Construct gap: a lab planning puzzle is not daily organisation | weak |
| IA6 avoids effortful tasks | Chooses the easy optional task over the hard one | (Optional choice screen) | Proportion of easy choices | No evidence found for an in-game effort-avoidance choice as an ADHD marker | none: parent questionnaire needed |
| IA7 loses things | Not observable in a game | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| IA8 easily distracted | Performance drops when birds fly across or thunder sounds | M2 Storm Watch (distractor vs no-distractor blocks) | Distractor cost: change in omission rate, RT SD between blocks | MOXO d-CPT with visual and auditory distractors, 798 children aged 7 to 12: ADHD lower on attention, timing, hyperactivity, impulsivity indices; impulsivity index poor at discrimination (PMID 28122767, DOI 10.1093/arclin/acw101). Group differences largest under high working-memory and distractor load in videogame and zoo tasks (PMID 12403149, DOI 10.1023/a:1019812829706) | moderate |
| IA9 forgetful in daily activities | Fails to recall a sequence of stars | M3 Star Path (spatial span) | Span length, sequence errors | Large WM deficits in children with ADHD, phonological and visuospatial (PMID 22917740, DOI 10.1016/j.cpr.2012.07.001). Construct gap: WM span is not daily forgetfulness | weak |
| HI1 fidgets, squirms | Device shakes or tilts, extra taps outside targets | All missions (passive) | Device-motion RMS from `DeviceMotionEvent`, off-target tap rate | Actigraph activity higher in boys with ADHD and rises with central-executive WM load, n = 23 (PMID 19083090, DOI 10.1007/s10802-008-9287-8). Review: actigraphs and camera motion tracking (QbTest) discriminate ADHD vs controls but poorly vs other disorders (PMID 35038458, DOI 10.1016/j.jneumeth.2022.109479). Webcam-based activity in QbCheck, adolescents/adults (PMID 32100383). **No evidence found** for tablet accelerometer data during a game in children | weak |
| HI2 leaves seat | Not observable without a camera; camera use is excluded for privacy | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| HI3 runs or climbs | Not observable | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| HI4 cannot play quietly | Not observable without a microphone; microphone excluded | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| HI5 "on the go" | A 15-minute seated session cannot observe this | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| HI6 talks excessively | Not observable | n/a | n/a | n/a | none: not observable in game, parent questionnaire needed |
| HI7 blurts out answers | Taps before the fox finishes the instruction, or before the stimulus appears; fails to stop when a crow appears | M4 Bridge Wait (premature taps, stop trials), M1 anticipations and commissions | Premature-tap rate, anticipation rate, commission rate, stop-signal reaction time (optional) | SSRT deficit in ADHD g = 0.62 (PMID 20719043, DOI 10.1017/S1355617710000895); fast event rates increase commission effect sizes in Go/No-Go (PMID 23062355, DOI 10.1016/j.biopsych.2012.08.023); MOXO hyperactivity and impulsivity indices (PMID 28122767) | moderate |
| HI8 difficulty waiting turn | Takes 1 gem now instead of 2 gems after watching the boat arrive | M5 Treasure Choice (simple choice-delay) | Proportion of immediate choices | Choice impulsivity g = 0.47, 28 tasks, 4,320 children and adolescents (PMID 26602954, DOI 10.1016/j.cpr.2015.11.001); simple choice paradigm preferred, real rewards almost doubled the odds ratio (PMID 29806533, DOI 10.1177/1087054718772138); effect sizes depend on age window (PMID 25956255); sex differences (PMID 30596297) | moderate |
| HI9 interrupts, intrudes | Taps on the fox while it is talking | M4 Bridge Wait (taps during narration) | Intrusion taps during speech | No evidence found that in-game intrusions during narration relate to this symptom; construct-adjacent to response inhibition only (PMID 24731074) | weak |

**Counts (18 symptoms):** strong 0; moderate 5 (IA1, IA2, IA8, HI7, HI8); weak 6 (IA3, IA4, IA5, IA9, HI1, HI9); none 7 (IA6, IA7, HI2, HI3, HI4, HI5, HI6). The 7 "none" items go to the parent questionnaire, and the weak ones should also be read from it.

Not used, with reason: task switching cost. A controlled study of 77 children found no disproportionate shift cost in ADHD once non-shifting processes were controlled (PMID 30945912, DOI 10.1037/neu0000546). No game mechanic is proposed for it.

## 3. Parent questionnaire (free scale) for non-observable items

**Proposal:** the NICHQ Vanderbilt Assessment Scale, Parent, 1st edition (2002), shown in-app after the child's session, completed by the parent alone (about 5 minutes: design estimate, not measured).

- Administer **all 18 symptom items and the 8 performance items** as printed, with the printed anchors. Reason: the scale's published rule needs the full 9 items per domain, and a shortened or reworded scale is a modified instrument with unknown psychometrics.
- The 22 ODD/conduct/anxiety-depression items: team decision. Leaving them out is a modification (permission question, section 1.2); keeping them adds screens for conditions the product does not address.
- Show the NICHQ credit line and the instruction to rate behaviour over the past 6 months, as printed on the form.
- Licence actions before go-live: (1) hackathon: download the 1st edition from https://nichq.org/resource/nichq-vanderbilt-assessment-scales and credit NICHQ; (2) any paid product: written permission from NICHQ/AAP, TODO.
- How the questionnaire and the game combine into the two parent outcomes is a clinical and methodological decision for the team. Options to put to the clinical lead: (a) questionnaire rule alone decides, game shown as an activity profile; (b) either source flags means "assessment recommended"; (c) both must flag. Each changes sensitivity and specificity in a direction nobody has measured for this product: **TODO: validation data needed**. The scale itself says it must not be used alone for diagnosis (scoring instructions, section 1.1).

Items that map to the game-unobservable symptoms (for the report layout): IA6, IA7 (inattention items 6 and 7), HI2 to HI6 (hyperactivity items 11 to 15 on the form).

## 4. Method literature: what makes a game measurement valid

### 4.1 Evidence-centred design (ECD) and stealth assessment

- ECD (Mislevy, Steinberg and Almond 2003, "On the structure of educational assessments", Measurement: Interdisciplinary Research and Perspectives 1(1); CRESST report version https://cresst.org/publication/on-the-structure-of-educational-assessments/) separates: a **competency model** (what we want to know), an **evidence model** (which observable behaviours count as evidence and how they are scored), a **task model** (situations that elicit the behaviour), and an **assembly model** (how many tasks of which difficulty). Shute's stealth assessment embeds these models in gameplay so evidence is gathered while the player plays, often with Bayesian networks as the evidence model; Shute and Rahimi argue that without ECD stealth assessment becomes opportunistic data mining (summaries in https://myweb.fsu.edu/vshute/pdf/sa.pdf and https://myweb.fsu.edu/vshute/pdf/saecdpreprint.pdf; read via search excerpts only).
- **Applied here:** competency model = the 18 symptoms of section 1.1 (not "ADHD"); evidence model = the metric column of section 2; task model = the mini-games of section 5; assembly model = trial counts per mini-game. The mapping table is the ECD evidence model, and each "none" row is an explicit statement that the game has no evidence for that competency variable.

### 4.2 Gamified and game-based attention measures

| Tool | What it is | Key finding | Source |
|---|---|---|---|
| Groundskeeper (CogCubed) | Tangible cube game: strike gophers, ignore distractors | AUC 0.79 vs Conners parent inattention 0.76 and CPT II percent correct 0.62; all three combined AUC 0.87; 113 clinically referred youth, K-SADS diagnosis; correlations among measures small | PMID 27105181, DOI 10.1089/cap.2015.0174. A ClinicalTrials.gov record surfaced by search reportedly states the company no longer exists (unverified, record not opened) |
| MOXO d-CPT | CPT with visual and auditory distractors | 798 children aged 7 to 12; 4 indices; impulsivity index poor; total score best (PMID 28122767). ML on MOXO data, 458 children aged 6 to 12: accuracy 87 %, sensitivity 89 %, specificity 84 % using total score plus age, gender, day of week and time of day (PMID 33093829, DOI 10.3389/fnhum.2020.560021) | as cited |
| AULA Nesplora | VR classroom CPT with distractors, head-movement measure | Correlations with Conners CPT on omissions, commissions, RT, RT variability in 57 children with ADHD aged 6 to 16 (PMID 23638628, DOI 10.1080/09297049.2013.792332); presentation-level differences only when modalities analysed separately (PMID 26896148) | as cited |
| EndeavorRx (AKL-T01) | Treatment, not assessment: navigate an avatar while responding to targets (multitasking interference design rooted in NeuroRacer, PMID 24005416, DOI 10.1038/nature12486) | STARS-ADHD RCT, 348 children aged 8 to 12: TOVA API change 0.88 (95 % CI 0.24 to 1.49) vs control; compliance 83 of 100 sessions; frustration in 3 %, headache in 2 % (PMID 33334505, DOI 10.1016/S2589-7500(20)30017-0). FDA De Novo DEN200026, 2020 (press and database pages, https://www.regdatalab.com/510k/DEN200026) | lesson for us: children tolerate daily game sessions; frustration is a real adverse event to design against |
| Plan-It Commander | Treatment serious game (time management, planning, social skills) | RCT, 170 children aged 8 to 12: better parent-reported time management after 10 weeks (PMID 26883052, DOI 10.2196/jmir.5173); girls benefited most on planning (PMID 29543891) | lesson: missions and a story world sustain engagement over weeks; it is not an assessment tool |
| Gamification review | 33 studies, 31 gamified tasks | Gamified tests typically validated successfully, but mixed-domain measurement was a problem; gamification boosts engagement with mixed effects on performance (PMID 27421244, DOI 10.2196/games.5888) | design rule: one mini-game, one construct |

### 4.3 Validity requirements (what a measurement game must handle)

- **Motivation confound.** Rewards improved WM in ADHD but did not normalise it; gaming and 10 euros normalised persistence (PMID 22187093). Boys with ADHD showed no inhibition deficit inside an adventure videogame, while deficits appeared in other contexts (PMID 12403149). Consequence: keep reward and feedback identical for every child, constant across blocks, and never adaptive to performance in measurement blocks.
- **Event rate.** Slow event rates disproportionately slow RT in ADHD; fast rates enlarge commission effects; RT variability was not affected by event rate (PMID 23062355). Consequence: hold ISI fixed per block and record it; never compare blocks with different ISIs as if equal.
- **Test-retest reliability.** Classic inhibition tasks including go/no-go and stop-signal showed reliabilities from 0 to .82, low for most tasks, because between-person variance is low (PMID 28726177, DOI 10.3758/s13428-017-0935-1). Consequence: measure our own retest reliability before any individual-level claim (TODO).
- **Practice effects.** No pediatric CPT practice-effect estimate was found in this research: **no evidence found**. Consequence: score only the first full session as the orientation result; later sessions are "missions" and are not rescored as new assessments until retest data exist.
- **Age norms.** Effect sizes depend on developmental time windows (PMID 25956255); younger typically developing boys differed from ADHD boys in the leading edge of the RT distribution, age-matched ones in the tail (PMID 10900704). Consequence: age bands are mandatory (proposal: 6 to 7, 8 to 9, 10 to 12, design choice) and every band's thresholds are **TODO: norms needed**.
- **Specificity.** RT variability barely separates ADHD from clinical controls (g = 0.25, PMID 23872284); commission errors are insufficiently specific to be diagnostic biomarkers (PMID 24731074); objective hyperactivity measures discriminate poorly vs other disorders (PMID 35038458). This is why the output is "assessment recommended", never an ADHD statement.
- **Medication and sex.** Stimulants reduce RT variability (PMID 23872284): the session record should carry a parent-entered "currently on ADHD medication" flag. Sex differences in delay choices in ADHD samples (PMID 30596297).
- **Device timing.** Browser and touch latency is 58 to 133 ms and constant within a device (03, section 2): use within-child indices and a calibration block.
- **Task length.** Reference CPTs are long: TOVA 21.6 minutes (TOVA 8 manual, https://files.tovatest.com/documentation/archive/8.2-202/html/manual.html); Conners CPT 3, 360 trials over 14 minutes with 1, 2 and 4 s intervals (search snippet of the MHS storefront, https://storefront.mhs.com/collections/cpt-online-suite, unverified on the publisher page). Our 4-minute watch will show weaker time-on-task effects; vigilance decrement effects are already small to moderate in long CPTs (PMID 22428793).

## 5. Mini-game designs (one story, one character, five missions)

Story: **Luma the firefly keeper** protects the night forest. Each mission restores one part of the forest; the child sees stars filling a map. Feedback is a short, identical chime for every correct action and no penalty sound (design choice, section 4.3 motivation rule). No timer is shown. All timings below are **design choices** unless a source is given; trial counts are sized to the time budget.

| # | Mission | Duration | Targets | Mechanic | Trials and timing | Metrics emitted |
|---|---|---|---|---|---|---|
| 0 | Wake the fireflies (calibration) | about 0.5 min | device floor | Tap each firefly that lights up, no no-go | 10 trials (`calibration_trials: 10`, contract v1) | `calibration.median_rt_ms`, `n` |
| 1 | Lantern Watch | about 4.1 min | IA1, IA2, HI7 | Go/no-go: tap fireflies (go), never tap moths (no-go) | Contract v1 exactly: 3 blocks x 48 trials = 144; `go_probability: 0.8` (38 go, 10 no-go per block, fixed counts, shuffled with a seeded PRNG); `stimulus_ms: 500`; ISI uniform 900 to 1500 ms; mean trial 1.7 s | omission rate, commission rate, anticipation rate, d', mean RT, RT SD, RT CV, ex-Gaussian mu/sigma/tau, vigilance decrement by block and by thirds, off-target taps |
| 2 | Storm Watch | about 2.3 min | IA8, IA3 | Same go/no-go; block A no distractors, block B with crossing birds and thunder (MOXO/AULA-style); 25 % of go trials cued by an owl hoot instead of a light | 2 blocks x 40 trials; same timings as M1; block order counterbalanced by seed | distractor cost (block B minus A) on omission rate and RT SD; auditory-cue omission rate vs visual |
| 3 | Star Path | about 2.5 min | IA9, HI1 | Corsi-style: stars light up in sequence, child repeats the sequence | Start length 2; +1 after a correct sequence; stop after 2 failures at one length; 1 star per 1000 ms (design choice) | span, errors, device-motion RMS during encoding vs during M0 baseline (Rapport WM-load design, PMID 19083090) |
| 4 | Bridge Wait | about 2 min | HI7, HI9 | Luma explains, then a chime means "cross"; tapping before the chime or while Luma talks counts; optional: on 25 % of trials a crow appears after the chime and the child must not tap (stop-signal) | 24 trials; wait 1.5 to 4 s jittered; stop-signal delay staircase (TODO: parameters, design choice) | premature-tap rate, intrusion taps during speech, optional SSRT |
| 5 | Treasure Choice | about 2 min | HI8 | Simple choice-delay: 1 gem now or 2 gems after watching the boat arrive | 10 choices; delay values **TODO** (design choice, keep total mission time constant whichever option is chosen so that waiting does not shorten play) | proportion of immediate choices |
| all | passive | | HI1, IA4 | | | off-target taps, idle periods, quit/pause attempts, device-motion RMS |
| 6 | Route Planner (optional, outside the 15 min core) | 2 min | IA5 | Plan a path to collect 4 seeds in fewest moves | 4 puzzles | extra moves, planning time |

Total core: about 13.4 minutes of play plus transitions, under 15 minutes. Device permissions: `DeviceMotionEvent` on iOS Safari may require an explicit permission prompt (unverified in this research, test on the demo tablet). No camera, no microphone.

Contract fit: mission 1 emits `SessionMetrics` v1 with `task.type: "go_nogo"` unchanged. Missions 0 and 2 to 5 need an additive field; proposal for the interface owner (frozen at hour 6, so the owner decides):

```json
"minigames": [
  { "id": "storm_watch", "version": "0.1.0", "params": { "blocks": 2, "trials_per_block": 40, "distractor_block": 1 },
    "trials": [ { "i": 0, "block": 0, "type": "go | nogo | go_audio", "stimulus_onset_ms": 0, "responded": true, "rt_ms": 0, "outcome": "hit" } ] },
  { "id": "star_path",      "version": "0.1.0", "results": { "span": 0, "errors": 0 } },
  { "id": "bridge_wait",    "version": "0.1.0", "results": { "premature_taps": 0, "intrusion_taps": 0, "n_trials": 24 } },
  { "id": "treasure_choice","version": "0.1.0", "results": { "immediate_choices": 0, "n_choices": 10 } }
],
"motion": { "rms_ms2_by_minigame": { "lantern_watch": 0 } },
"context": { "on_adhd_medication": "yes | no | unknown", "age_band": "6-7 | 8-9 | 10-12" }
```

Units: as in v1, times in ms; motion in m/s^2 as delivered by `DeviceMotionEvent.acceleration` (spec unit, verify on device).

## 6. AI choice

| Option | What it does | Strengths | Risks | Sources |
|---|---|---|---|---|
| (a) Transparent rules with age bands | Within-child indices compared with per-age-band thresholds in `thresholds.v0.json`, `validated: false` | Explainable line by line, testable, no training data needed | Thresholds are **TODO: norms needed**; without norms the bands are illustrative only | 03 section 4 |
| (b) Classic ML (logistic regression, gradient boosting) | Learns a mapping from indices to a clinician-confirmed outcome | Can combine indices; one MOXO study reached 87 % accuracy in 458 children (PMID 33093829) | Needs labelled pediatric data we do not have (HYPERAKTIV is adult and restricted, 03 section 0); overfitting; an ML scorer inside a device needing notified-body assessment meets EU AI Act Article 6(1) high-risk conditions | AI Act Article 6(1) text: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6 |
| (c) LLM (for example Claude via the Anthropic API) | Story text, plain-language report wording around a fixed outcome | Warm, adaptive language for children and parents | Must never compute or alter the score; can invent clinical claims; output must be guarded | design reasoning |

EU AI Act, Article 6(1) (verbatim conditions from the Commission AI Act Service Desk page): an AI system is high-risk where it "is intended to be used as a safety component of a product, or the AI system is itself a product, covered by the Union harmonisation legislation listed in Annex I" and that product "is required to undergo a third-party conformity assessment". The MDR is listed in Annex I per a secondary source (https://meddeviceguide.com/blog/eu-ai-act-high-risk-classification-guidelines-medical-device-guide; Annex I text not read, TODO verify), and class IIa needs notified-body involvement. Two open points for the regulatory role: whether a purely rule-based scorer is an "AI system" under the Act's definition (not researched, TODO), and the application date for Annex I systems, where secondary sources conflict (https://www.pureglobal.com/news/eu-ai-act-omnibus-high-risk-dates-2028 vs https://presencis.com/questions/ai-act-mdr-overlap/; Official Journal text controls, TODO).

**Recommendation for the hackathon demo:** (a) rules, `scoring_method: "rules_v0"`, `validated: false`, plus (c) an LLM used only for (1) mission story lines generated ahead of time and reviewed by a human, and (2) a short parent report that wraps the pre-approved outcome sentence, with the guard in section 7.4. The LLM receives the band and the plain-language reason lines, never raw trials, never the child's name.

**Recommendation after the hackathon:** keep (a) as the released scorer; run a clinical investigation that collects game data, the parent questionnaire and an independent clinical assessment per child, by age band; derive norms and test-retest reliability; only then evaluate (b) against (a) on held-out data, with an explainable model (logistic regression first) and a written AI Act and MDR analysis before any change of scorer. The LLM stays out of every path that decides the outcome.

## 7. Scripts (code)

Short TypeScript sketches for `packages/game` and `packages/scoring`. They compile in principle but are untested: write unit tests on synthetic sessions first (03, section 12). Timing assumptions to verify on the demo tablet (03, section 2.3): `PointerEvent.timeStamp` and the `requestAnimationFrame` timestamp share the page time origin, and our rAF callback runs in the same frame in which Phaser draws the stimulus (Phaser 4 loop internals not verified).

### 7.1 Trial schedule and loop (game side)

```ts
// packages/game/src/engine/goNoGo.ts
export type TrialType = 'go' | 'nogo' | 'calibration';
export type Outcome = 'hit' | 'omission' | 'correct_reject' | 'commission' | 'anticipation';

export interface TrialRecord {
  i: number; block: number; type: TrialType;
  stimulus_onset_ms: number;      // session-relative, ms
  responded: boolean; rt_ms: number | null;
  outcome: Outcome; x: number; y: number;
}
export interface OffTargetTap { t_ms: number; during: 'isi' | 'stimulus'; }
export interface TaskConfig {
  blocks: number; trialsPerBlock: number; goProbability: number;
  stimulusMs: number; isiMsMin: number; isiMsMax: number;
  anticipationMs: number;         // from thresholds.v0.json, validated:false, TODO norms
  seed: number;
}
export interface ScheduledTrial { type: 'go' | 'nogo'; block: number; isiMs: number; }

// Seeded PRNG so every schedule can be replayed exactly from the session record.
export function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed number of no-go trials per block (not Bernoulli), shuffled: every child gets the same counts.
export function buildSchedule(cfg: TaskConfig): ScheduledTrial[] {
  const rnd = mulberry32(cfg.seed);
  const out: ScheduledTrial[] = [];
  for (let b = 0; b < cfg.blocks; b++) {
    const nGo = Math.round(cfg.trialsPerBlock * cfg.goProbability);
    const types: Array<'go' | 'nogo'> = Array.from({ length: cfg.trialsPerBlock }, (_, k) => (k < nGo ? 'go' : 'nogo'));
    for (let k = types.length - 1; k > 0; k--) {           // Fisher-Yates
      const j = Math.floor(rnd() * (k + 1));
      [types[k], types[j]] = [types[j], types[k]];
    }
    for (const type of types) out.push({ type, block: b, isiMs: cfg.isiMsMin + rnd() * (cfg.isiMsMax - cfg.isiMsMin) });
  }
  return out;
}

export function classify(type: 'go' | 'nogo', responded: boolean, rt: number | null, anticipationMs: number): Outcome {
  if (responded && rt !== null && rt < anticipationMs) return 'anticipation';
  if (type === 'go') return responded ? 'hit' : 'omission';
  return responded ? 'commission' : 'correct_reject';
}

export class TrialRunner {
  private trials: TrialRecord[] = [];
  private offTarget: OffTargetTap[] = [];
  private cur: { idx: number; onset: number | null; responded: boolean; rt: number | null; x: number; y: number } | null = null;
  private visible = false;
  private t0 = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private schedule: ScheduledTrial[],
    private cfg: TaskConfig,
    private show: (t: ScheduledTrial) => void,     // Phaser: make sprite visible (drawn next frame)
    private hide: () => void,
    private isOnTarget: (x: number, y: number) => boolean,
  ) {}

  run(): Promise<{ trials: TrialRecord[]; off_target_taps: OffTargetTap[] }> {
    this.t0 = performance.now();
    // Native listener on the canvas: Phaser's input queue is not needed for timing.
    this.canvas.addEventListener('pointerdown', this.onPointer);
    return new Promise(resolve => this.step(0, resolve));
  }

  private onPointer = (e: PointerEvent): void => {
    const t = e.timeStamp;                           // event creation time, page time origin
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const c = this.cur;
    if (c && c.onset !== null && !c.responded && this.isOnTarget(x, y)) {
      c.responded = true; c.rt = t - c.onset; c.x = x; c.y = y;
      return;
    }
    this.offTarget.push({ t_ms: t - this.t0, during: this.visible ? 'stimulus' : 'isi' });
  };

  private step(idx: number, done: (r: { trials: TrialRecord[]; off_target_taps: OffTargetTap[] }) => void): void {
    if (idx >= this.schedule.length) {
      this.canvas.removeEventListener('pointerdown', this.onPointer);
      done({ trials: this.trials, off_target_taps: this.offTarget });
      return;
    }
    const s = this.schedule[idx];
    this.cur = { idx, onset: null, responded: false, rt: null, x: 0, y: 0 };
    this.show(s);
    requestAnimationFrame(ts => {                    // timestamp of the frame that draws the stimulus
      if (this.cur && this.cur.idx === idx) { this.cur.onset = ts; this.visible = true; }
      setTimeout(() => { this.hide(); this.visible = false; }, this.cfg.stimulusMs);
      // Response window = stimulus + ISI, so late go responses still count for this trial.
      setTimeout(() => { this.close(s, idx); this.step(idx + 1, done); }, this.cfg.stimulusMs + s.isiMs);
    });
  }

  private close(s: ScheduledTrial, idx: number): void {
    const c = this.cur!;
    this.trials.push({
      i: idx, block: s.block, type: s.type,
      stimulus_onset_ms: (c.onset ?? NaN) - this.t0,
      responded: c.responded, rt_ms: c.responded ? c.rt : null,
      outcome: classify(s.type, c.responded, c.rt, this.cfg.anticipationMs),
      x: c.x, y: c.y,
    });
  }
}
```

Notes: `setTimeout` only paces the task (durations are not measured), onsets come from rAF and responses from `event.timeStamp`. Any tap before the onset frame is logged as an off-target ISI tap.

### 7.2 Metrics (scoring side, recomputed server-side from raw trials)

```ts
// packages/scoring/src/metrics.ts
import type { TrialRecord } from '@adhdcheck/contracts';

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

// erf: Abramowitz and Stegun formula 7.1.26 coefficients, as implemented by J. D. Cook
// (https://www.johndcook.com/python_erf.html). Loses relative accuracy far in the lower tail.
function erf(x: number): number {
  const s = Math.sign(x), ax = Math.abs(x), t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return s * y;
}
const normCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
// Inverse by bisection on normCdf: slow but exact to the precision of normCdf.
function probit(p: number): number {
  let lo = -8, hi = 8;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (normCdf(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// d' with the log-linear correction (add 0.5 to counts, 1 to totals; Hautus 1995,
// Behav Res Methods Instrum Comput 27:46-51, DOI not verified) so 0 % or 100 % rates stay finite.
export function dPrime(hits: number, nGo: number, fas: number, nNogo: number): number {
  const H = (hits + 0.5) / (nGo + 1), F = (fas + 0.5) / (nNogo + 1);
  return probit(H) - probit(F);
}

// Ex-Gaussian log density: (1/tau) exp((mu-x)/tau + sigma^2/(2 tau^2)) Phi((x-mu)/sigma - sigma/tau)
function exGaussLogPdf(x: number, mu: number, sigma: number, tau: number): number {
  const phi = Math.max(normCdf((x - mu) / sigma - sigma / tau), 1e-300);
  return -Math.log(tau) + (mu - x) / tau + (sigma * sigma) / (2 * tau * tau) + Math.log(phi);
}

function nelderMead(f: (p: number[]) => number, x0: number[], iters = 2000): number[] {
  const n = x0.length;
  let S = [x0, ...x0.map((_, i) => x0.map((v, j) => (i === j ? v + (Math.abs(v) > 1e-6 ? 0.1 * Math.abs(v) : 0.1) : v)))];
  let F = S.map(f);
  for (let k = 0; k < iters; k++) {
    const ord = F.map((_, i) => i).sort((a, b) => F[a] - F[b]);
    S = ord.map(i => S[i]); F = ord.map(i => F[i]);
    if (Math.abs(F[n] - F[0]) < 1e-8) break;
    const c = Array.from({ length: n }, (_, j) => S.slice(0, n).reduce((s, p) => s + p[j], 0) / n);
    const at = (t: number) => c.map((cj, j) => cj + t * (S[n][j] - cj));
    const xr = at(-1), fr = f(xr);
    if (fr < F[0]) { const xe = at(-2), fe = f(xe); if (fe < fr) { S[n] = xe; F[n] = fe; } else { S[n] = xr; F[n] = fr; } }
    else if (fr < F[n - 1]) { S[n] = xr; F[n] = fr; }
    else {
      const xc = at(fr < F[n] ? -0.5 : 0.5), fc = f(xc);
      if (fc < Math.min(fr, F[n])) { S[n] = xc; F[n] = fc; }
      else for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = f(S[i]); }
    }
  }
  return S[F.indexOf(Math.min(...F))];
}

// Maximum-likelihood ex-Gaussian fit. Start values follow Lacouture and Cousineau 2008
// (TQMP 4(1):35-45, DOI 10.20982/tqmp.04.1.p035): tau = 0.8 SD; mean = mu + tau; SD^2 = sigma^2 + tau^2.
// Minimum number of RTs for a stable fit: TODO (their Monte Carlo covers n = 10 to 5000; read Fig. 6 before choosing).
export function fitExGaussian(rts: number[]) {
  const m = mean(rts), s = sd(rts);
  const tau0 = 0.8 * s, mu0 = m - tau0, sig0 = Math.sqrt(s * s - tau0 * tau0);
  const nll = ([mu, ls, lt]: number[]) => {
    const sigma = Math.exp(ls), tau = Math.exp(lt);
    let sum = 0; for (const x of rts) sum -= exGaussLogPdf(x, mu, sigma, tau);
    return Number.isFinite(sum) ? sum : 1e12;
  };
  const [mu, ls, lt] = nelderMead(nll, [mu0, Math.log(sig0), Math.log(tau0)]);
  return { mu, sigma: Math.exp(ls), tau: Math.exp(lt) };
}

export function indicators(trials: TrialRecord[]) {
  const go = trials.filter(t => t.type === 'go'), nogo = trials.filter(t => t.type === 'nogo');
  const hits = go.filter(t => t.outcome === 'hit');
  const rts = hits.map(t => t.rt_ms as number);
  const count = (a: TrialRecord[], o: string) => a.filter(t => t.outcome === o).length;

  // Vigilance: first third vs last third of go trials in presentation order.
  const third = Math.floor(go.length / 3);
  const early = go.slice(0, third), late = go.slice(go.length - third);
  const rtOf = (a: TrialRecord[]) => a.filter(t => t.outcome === 'hit').map(t => t.rt_ms as number);

  return {
    omission_rate: count(go, 'omission') / go.length,
    commission_rate: count(nogo, 'commission') / nogo.length,
    anticipation_rate: count(trials, 'anticipation') / trials.length,
    d_prime: dPrime(hits.length, go.length, count(nogo, 'commission'), nogo.length),
    rt_mean_ms: mean(rts),
    rt_sd_ms: sd(rts),
    rt_cv: sd(rts) / mean(rts),
    ex_gaussian: fitExGaussian(rts),
    vigilance: {
      omission_change: count(late, 'omission') / late.length - count(early, 'omission') / early.length,
      rt_sd_change_ms: sd(rtOf(late)) - sd(rtOf(early)),
    },
  };
}
```

Contract fit: `rt_mean_ms`, `rt_sd_ms`, `rt_cv`, `omission_rate`, `commission_rate` map one to one onto `ScoreResult.indicators`. `vigilance_change` in v1 is one number: proposal `vigilance.omission_change` (design choice, the scoring owner decides). `d_prime`, `anticipation_rate` and `ex_gaussian` are additive. Data-quality gate before any band: minimum hits for RT metrics and for the ex-Gaussian fit, maximum anticipation share: **TODO, set in `thresholds.v0.json`**.

### 7.3 Rules with age bands (demo scorer)

```ts
// packages/scoring/src/rules.ts  (thresholds are illustrative: validated:false, TODO norms needed)
type Band = 'no_flag' | 'follow_up_suggested' | 'insufficient_data';
interface Thresholds { validated: false; byAgeBand: Record<string, { rt_cv_max: number; commission_rate_max: number; omission_rate_max: number }>; minHits: number; }

export function band(ind: ReturnType<typeof import('./metrics').indicators>, ageBand: string, th: Thresholds, nHits: number): { band: Band; reasons: string[] } {
  if (nHits < th.minHits || !(ageBand in th.byAgeBand)) return { band: 'insufficient_data', reasons: [] };
  const t = th.byAgeBand[ageBand], reasons: string[] = [];
  if (ind.rt_cv > t.rt_cv_max) reasons.push('Response speed varied more than expected during the watch.');
  if (ind.commission_rate > t.commission_rate_max) reasons.push('Tapped often when the game asked to wait.');
  if (ind.omission_rate > t.omission_rate_max) reasons.push('Missed many fireflies.');
  return { band: reasons.length ? 'follow_up_suggested' : 'no_flag', reasons };
}
```

### 7.4 Parent-report wording guard (LLM never decides)

```ts
// apps/web/lib/parentReport.ts
const OUTCOME_TEXT = {
  follow_up_suggested: 'A professional assessment is recommended.',
  no_flag: 'No specific follow-up indicated by this activity.',
  insufficient_data: 'Not enough data, please play again.',
} as const;
const BANNED = [/adhd/i, /diagnos(?!is\.)/i, /probab/i, /severity|severe/i, /\d+\s?%/, /disorder/i, /risk/i];

export function guardReport(band: keyof typeof OUTCOME_TEXT, llmText: string): string {
  const required = OUTCOME_TEXT[band];
  const ok = llmText.includes(required) && !BANNED.some(re => re.test(llmText.replace(required, '')));
  // Fallback is a fixed, human-approved template: the LLM text is optional decoration, never required.
  return ok ? llmText : `${required} This activity is a game, not a diagnosis. Talk to your doctor if you have questions.`;
}
```

The LLM prompt gives the band's fixed sentence and the reason lines as data and asks for at most three short sentences that include the sentence verbatim. The banned-pattern list is a starting point (design choice); test it against a set of known-bad outputs before the demo, and show both counts (rejected bad, accepted good).

## 8. Validity risks

| Risk | Why it matters | Mitigation proposed | Source |
|---|---|---|---|
| Gamification masks the deficit | Strong incentives normalised persistence; no inhibition deficit in an adventure videogame | Constant, modest feedback; no adaptive difficulty in measurement blocks; story between missions, not inside measurement blocks | PMID 22187093, PMID 12403149 |
| Mixed-domain measurement | Gamified tests often measured more than one construct | One construct per mission; distractors only in M2 | PMID 27421244 |
| Low reliability of inhibition tasks | Go/no-go and stop-signal reliabilities can be low | Measure retest reliability before individual claims | PMID 28726177 |
| Practice effects | No pediatric estimate found | Only the first full session produces the orientation outcome | no evidence found |
| No norms | Thresholds cannot be justified | `validated: false`; age bands; norms study | PMID 25956255, 03 section 4 |
| Low specificity | Metrics also differ in other conditions | Output limited to "assessment recommended" | PMID 23872284, 24731074, 35038458 |
| Modest diagnostic accuracy of CPTs | Sensitivity 0.75, specificity 0.71 at best | Combine with parent questionnaire; never stand-alone | PMID 37004919 |
| Event-rate effects | Slow vs fast ISIs change which errors appear | Fixed ISI ranges, logged per block | PMID 23062355 |
| Device latency | 58 to 133 ms constant offset | Within-child indices, calibration, one demo device | 03 section 2 |
| Medication | Stimulants reduce RT variability | Parent-entered medication flag; interpret with care | PMID 23872284 |
| Short task | Time-on-task effects need long tasks | Report vigilance change as descriptive only | PMID 22428793, TOVA manual |
| Frustration | Observed adverse event in a game therapeutic | No failure sounds, pause button, short missions | PMID 33334505 |
| Regulatory drift through wording | "ADHD likely" is a diagnostic claim | Fixed outcome sentences and the guard in 7.4 | team decision 2026-10-19, 03 section 8 |

## 9. References

PubMed records retrieved and checked via the PubMed metadata tool on 2026-10-19 (abstracts read, full texts not read unless stated).

1. Arrondo G, et al. Clinical utility of continuous performance tests for the identification of ADHD: systematic review and meta-analysis. J Am Acad Child Adolesc Psychiatry 2024;63(2):154-171. PMID 37004919. https://doi.org/10.1016/j.jaac.2023.03.011
2. Kofler MJ, et al. Reaction time variability in ADHD: a meta-analytic review of 319 studies. Clin Psychol Rev 2013;33(6):795-811. PMID 23872284. https://doi.org/10.1016/j.cpr.2013.06.001
3. Huang-Pollock CL, et al. Evaluating vigilance deficits in ADHD: a meta-analysis of CPT performance. J Abnorm Psychol 2012;121(2):360-71. PMID 22428793. https://doi.org/10.1037/a0027205
4. Wright L, et al. Response inhibition and psychopathology: a meta-analysis of go/no-go task performance. J Abnorm Psychol 2014;123(2):429-39. PMID 24731074. https://doi.org/10.1037/a0036295
5. Lipszyc J, Schachar R. Inhibitory control and psychopathology: a meta-analysis of studies using the stop signal task. J Int Neuropsychol Soc 2010;16(6):1064-76. PMID 20719043. https://doi.org/10.1017/S1355617710000895
6. Kasper LJ, Alderson RM, Hudec KL. Moderators of working memory deficits in children with ADHD: a meta-analytic review. Clin Psychol Rev 2012;32(7):605-17. PMID 22917740. https://doi.org/10.1016/j.cpr.2012.07.001
7. Rapport MD, et al. Hyperactivity in boys with ADHD: a ubiquitous core symptom or manifestation of working memory deficits? J Abnorm Child Psychol 2009;37(4):521-34. PMID 19083090. https://doi.org/10.1007/s10802-008-9287-8
8. Patros CHG, et al. Choice-impulsivity in children and adolescents with ADHD: a meta-analytic review. Clin Psychol Rev 2016;43:162-74. PMID 26602954. https://doi.org/10.1016/j.cpr.2015.11.001
9. Marx I, et al. ADHD and the choice of small immediate over larger delayed rewards: a comparative meta-analysis. J Atten Disord 2021;25(2):171-187. PMID 29806533. https://doi.org/10.1177/1087054718772138
10. Doidge JL, Flora DB, Toplak ME. Sex differences on delay of gratification and temporal discounting tasks in ADHD and TD samples. J Atten Disord 2021;25(4):540-561. PMID 30596297. https://doi.org/10.1177/1087054718815588
11. Pauli-Pott U, Becker K. Time windows matter in ADHD-related developing neuropsychological basic deficits. Neurosci Biobehav Rev 2015;55:165-72. PMID 25956255. https://doi.org/10.1016/j.neubiorev.2015.04.011
12. Willcutt EG, et al. Validity of the executive function theory of ADHD: a meta-analytic review. Biol Psychiatry 2005;57(11):1336-46. PMID 15950006. https://doi.org/10.1016/j.biopsych.2005.02.006
13. Metin B, et al. A meta-analytic study of event rate effects on Go/No-Go performance in ADHD. Biol Psychiatry 2012;72(12):990-6. PMID 23062355. https://doi.org/10.1016/j.biopsych.2012.08.023
14. Leth-Steensen C, Elbaz ZK, Douglas VI. Mean response times, variability, and skew in the responding of ADHD children. Acta Psychol 2000;104(2):167-90. PMID 10900704. https://doi.org/10.1016/s0001-6918(00)00019-6
15. Irwin LN, et al. Do children with ADHD have set shifting deficits? Neuropsychology 2019;33(4):470-481. PMID 30945912. https://doi.org/10.1037/neu0000546
16. Lawrence V, et al. ADHD outside the laboratory: boys' executive function performance on tasks in videogame play and on a visit to the zoo. J Abnorm Child Psychol 2002;30(5):447-62. PMID 12403149. https://doi.org/10.1023/a:1019812829706
17. Dovis S, et al. Can motivation normalize working memory and task persistence in children with ADHD? J Abnorm Child Psychol 2012;40(5):669-81. PMID 22187093. https://doi.org/10.1007/s10802-011-9601-8
18. Lumsden J, et al. Gamification of cognitive assessment and cognitive training: a systematic review. JMIR Serious Games 2016;4(2):e11. PMID 27421244. https://doi.org/10.2196/games.5888
19. Faraone SV, et al. The Groundskeeper gaming platform as a diagnostic tool for ADHD. J Child Adolesc Psychopharmacol 2016;26(8):672-685. PMID 27105181. https://doi.org/10.1089/cap.2015.0174
20. Berger I, Slobodin O, Cassuto H. Usefulness and validity of continuous performance tests in the diagnosis of ADHD children. Arch Clin Neuropsychol 2017;32(1):81-93. PMID 28122767. https://doi.org/10.1093/arclin/acw101
21. Slobodin O, Yahav I, Berger I. A machine-based prediction model of ADHD using CPT data. Front Hum Neurosci 2020;14:560021. PMID 33093829. https://doi.org/10.3389/fnhum.2020.560021
22. Díaz-Orueta U, et al. AULA virtual reality test as an attention measure: convergent validity with Conners' CPT. Child Neuropsychol 2014;20(3):328-42. PMID 23638628. https://doi.org/10.1080/09297049.2013.792332
23. Areces D, et al. Efficacy of a CPT based on virtual reality in the diagnosis of ADHD and its clinical presentations. J Atten Disord 2018;22(11):1081-1091. PMID 26896148. https://doi.org/10.1177/1087054716629711
24. Kollins SH, et al. A novel digital intervention for actively reducing severity of paediatric ADHD (STARS-ADHD): a randomised controlled trial. Lancet Digit Health 2020;2(4):e168-e178. PMID 33334505. https://doi.org/10.1016/S2589-7500(20)30017-0
25. Anguera JA, et al. Video game training enhances cognitive control in older adults. Nature 2013;501(7465):97-101. PMID 24005416. https://doi.org/10.1038/nature12486
26. Bul KCM, et al. Behavioral outcome effects of serious gaming as an adjunct to treatment for children with ADHD: RCT. J Med Internet Res 2016;18(2):e26. PMID 26883052. https://doi.org/10.2196/jmir.5173
27. Bul KCM, et al. A serious game for children with ADHD: who benefits the most? PLoS One 2018;13(3):e0193681. PMID 29543891. https://doi.org/10.1371/journal.pone.0193681
28. Wang XQ, et al. A review of objective assessments for hyperactivity in ADHD. J Neurosci Methods 2022;370:109479. PMID 35038458. https://doi.org/10.1016/j.jneumeth.2022.109479
29. Ulberstad F, et al. Objective measurement of ADHD symptoms outside the clinic using the QbCheck. Int J Methods Psychiatr Res 2020;29(2):e1822. PMID 32100383. https://doi.org/10.1002/mpr.1822
30. Hedge C, Powell G, Sumner P. The reliability paradox. Behav Res Methods 2018;50(3):1166-1186. PMID 28726177. https://doi.org/10.3758/s13428-017-0935-1
31. Wolraich ML, et al. Psychometric properties of the Vanderbilt ADHD diagnostic parent rating scale in a referred population. J Pediatr Psychol 2003;28(8):559-67. PMID 14602846. https://doi.org/10.1093/jpepsy/jsg046
32. Wolraich ML, et al. Psychometric properties of the Vanderbilt ADHD diagnostic teacher rating scale in a community population. J Dev Behav Pediatr 2013;34(2):83-93. PMID 23363973. https://doi.org/10.1097/DBP.0b013e31827d55c3
33. Bussing R, et al. Parent and teacher SNAP-IV ratings of ADHD symptoms: psychometric properties and normative ratings. Assessment 2008;15(3):317-28. PMID 18310593. https://doi.org/10.1177/1073191107313888
34. Sibley MH, Yeguez CE. The impact of DSM-5 A-criteria changes on parent ratings of ADHD in adolescents. J Atten Disord 2018;22(1):83-91. PMID 24626330. https://doi.org/10.1177/1087054714526040
35. Nejati V, Yazdani S. Time perception in children with ADHD: does task matter? A meta-analysis. Child Neuropsychol 2020;26(7):900-916. PMID 32757699. https://doi.org/10.1080/09297049.2020.1712347 (read, not used in the mapping: no in-game mechanic proposed)
36. Lacouture Y, Cousineau D. How to use MATLAB to fit the ex-Gaussian and other probability functions to a distribution of response times. Tutor Quant Methods Psychol 2008;4(1):35-45. https://doi.org/10.20982/tqmp.04.1.p035 (full text read via pdftotext for the start-value heuristic)
37. Hautus MJ. Corrections for extreme proportions and their biasing effects on estimated values of d'. Behav Res Methods Instrum Comput 1995;27:46-51 (citation confirmed via a reference list; DOI not verified).
38. Mislevy RJ, Steinberg LS, Almond RG. On the structure of educational assessments. Measurement 2003;1(1); CRESST CSE Report 597. https://cresst.org/publication/on-the-structure-of-educational-assessments/ (DOI not verified)
39. Shute VJ, stealth assessment papers: https://myweb.fsu.edu/vshute/pdf/sa.pdf , https://myweb.fsu.edu/vshute/pdf/saecdpreprint.pdf (read via search excerpts)
40. NICHQ Vanderbilt Assessment Scales page: https://nichq.org/resource/nichq-vanderbilt-assessment-scales ; parent form copy: https://ramp.luriechildrens.org/globalassets/media/pages/specialties--conditions/programs/mood-anxiety-adhd-collaborative-care-maacc-program/measures/nichq-vanderbilt-parent.pdf ; scoring instructions: https://uwhatc.uw.edu/PDF/Temp%20TF-%20CBT/pages/3%20Assessment/ADHD%20Measures%20from%20SMH/07ScoringInstructions.pdf
41. Guilford Press, ADHD Rating Scale-5 listing: https://www.guilford.com/books/ADHD-Rating-Scale-5-for-Children-and-Adolescents/DuPaul-Power-Anastopoulos-Reid/9781462524877
42. EU AI Act Article 6, AI Act Service Desk: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6
43. T.O.V.A. 8 User's Manual: https://files.tovatest.com/documentation/archive/8.2-202/html/manual.html
44. J. D. Cook, stand-alone erf implementation (A&S 7.1.26 coefficients): https://www.johndcook.com/python_erf.html
45. FDA De Novo DEN200026 (EndeavorRx) database record: https://www.regdatalab.com/510k/DEN200026
