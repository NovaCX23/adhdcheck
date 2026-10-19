# 02. Competitor landscape and regulatory reality check

Prepared 2026-10-19 for the hackathon team (start 2026-10-19). Scope: collect and verify. Nothing in this file decides the strategy; the intended-purpose wordings in Part 2.6 are OPTIONS for the team to decide.

**How to read the evidence column "Ver."**
- **P** = read this session at the primary source (FDA database record or FDA decision summary PDF, PubMed record, ClinicalTrials.gov record, MDCG PDF, HAS PDF, the company's own page).
- **S** = taken from a web-search result that summarised the cited page; the page itself was not re-opened. Treat S facts as leads to confirm before any external use.
- "not found" = searched for and not found in this pass. It does not prove the thing does not exist.

---

## Part 1. Competitors

### 1.1 Core table (the products named in the brief)

| # | Product (company) | What it does | Target age | Regulatory status (ID verbatim) | Pivotal evidence | Business model / price | Company status | Ver. |
|---|---|---|---|---|---|---|---|---|
| 1 | **EndeavorRx** (Akili Interactive Labs, Inc.; now a subsidiary of Virtual Therapeutics) | Therapy: prescription video game "to improve attention function as measured by computer-based testing" in ADHD [1] | 8–12 at De Novo [1]; expanded to 8–17 by K231337 [2] | FDA De Novo **DEN200026**, 2020-06-15, product code QFT (class 2, 21 CFR 882.5803) [3][4]; 510(k) **K231337**, 2023-12-13 [2][3]. CE mark announced June 2020 [5][6]; CE class: not found | STARS-ADHD RCT, **PMID 33334505**, **NCT02674633** [7] | Prescription; "$99 for a 30 day prescription", FSA/HSA eligible (company page, S) [8] | Virtual Therapeutics completed the acquisition on 2 July 2024 at $0.4340 per share; Akili became a wholly owned subsidiary (S) [9] | P (FDA, PubMed) / S (price, deal) |
| 2 | **EndeavorOTC** (Akili) | Therapy: same game, over the counter | "patients 18 and older" [10] (adults, not children) | 510(k) **K233496**, 2024-06-14, QFT [3][10] | not found in this pass | Subscription: $24.99 per month, $99.99 per 6 months, $129.99 per year; money-back offer (company page, S) [11] | as row 1 | P (FDA) / S (price) |
| 3 | **QbTest** (Qbtech AB, Sweden) | Diagnosis aid and treatment evaluation: CPT plus infrared motion tracking, "objective measurements of hyperactivity, impulsivity, and inattention to aid in the clinical assessment of ADHD" (wording of the QbCheck IFU, which names QbTest as predicate) [12] | 6 to 60 years per company legal page (S) [13] | 510(k) **K040894** (2004-06-22), **K122149** (2012-10-17), **K133382** (2014-03-24), product code LQD "Recorder, Attention Task Performance" (class U) [3]. CE marked per company profile (S) [14]; CE class: not found | AQUA single-blind RCT on diagnostic decision-making, **PMID 29700813** [15] | Clinic-facing; price: not found. NICE Medtech Innovation Briefing MIB318, 7 March 2023, per company (S) [16] | Active (company site live) | P (FDA, PubMed) / S (age, CE, NICE) |
| 4 | **QbCheck** (Qbtech AB) | Diagnosis aid, remote: webcam motion tracking plus CPT at home; "results should be interpreted only by qualified health care professionals" [12] | not stated in the 510(k) IFU; 6 to 60 per company (S) [13] | 510(k) **K143468**, 2016-03-22, LQD, predicate QbTest K133382 [3][12] | Reliability and validity study, **PMID 32100383** [17] | price: not found | as row 3 | P |
| 5 | **NeuroCatch Platform** (NeuroCatch Inc., Surrey, BC, Canada) | EEG auditory event-related potentials, six-minute test of cognitive function; the company states it "is not a diagnostic tool for a specific brain health condition" and does not mention ADHD [18] | not stated [18] | "ARTG number 439393 (Australia) Rx only (US)" [18]; Health Canada Class II licence 2019 and a next-generation licence in Sept 2022 (press, S) [19]; FDA 510(k) or De Novo: none found in openFDA for "NeuroCatch" [3] | No ADHD study found. PubMed "NeuroCatch" returns 8 records on brain vital signs in adults and athletes (e.g. PMID 38628971) [20] | "REIMBURSABLE*" claim, price: not found [18] | Active | P |
| 6 | **Nesplora AULA** (Nesplora; reports branded "GIUNTI NESPLORA") | Diagnosis aid: virtual-reality continuous performance test in a classroom with distractors | 6–16 (S) [21] | Company states its tests are CE marked under Directive 93/42/EEC and certified by AEMPS (S) [22]; class: not found; FDA: none found in openFDA [3] | Convergent validity vs Conners CPT **PMID 23638628**; diagnostic efficacy **PMID 26896148**; VR vs traditional CPT **PMID 30487931**; transcultural study **PMID 39708780** [23] | Clinician plans: "Bits" 27€ per use plus 110€ activation; "Essential" 100€ per month (7 uses) or 295€ per quarter (22 uses); "Professional" 160€ per month (50 uses) or 1670€ per year (620 uses; Spanish page says 600) [24] | Active | P (PubMed, plans page) / S (CE) |
| 7 | **Canvas Dx** (Cognoa, Inc.) (autism analogue) | Diagnosis aid for autism: caregiver questionnaire, two home videos and an HCP questionnaire combined by a machine-learning model; outputs positive, negative or "No Result" [25][26] | 18 to 72 months [25] | FDA De Novo **DEN200069**, 2021-06-02 ("Cognoa ASD Diagnosis Aid"), product code QPF "Pediatric Autism Spectrum Disorder Diagnosis Aid" (class 2, 21 CFR 882.1491), prescription only [3][4][25]; 510(k) **K243558** "Canvas Dx", 2025-04-11 [3] | Pivotal cohort, **PMID 35513550**: for the 31.8% with a determinate output, sensitivity 98.4%, specificity 78.9%; "No Result" in 68% [25][26] | Payer model: Highmark commercial coverage (Jan 2024), Wyoming Medicaid (Sept 2024) (S) [27]; price: not found | Active (S) [27] | P (FDA, PubMed) / S (payers) |
| 8 | **EarliPoint** (EarliTec Diagnostics, Inc.) (autism analogue) | Diagnosis aid for autism via eye tracking of social visual engagement | 16 months to 95 months (7 years) in K253442 [28] | 510(k) **K213882** (2022-06-08), **K230337** (2023-06-29), **K243891** (2025-03-26), **K253442** (2026-03-05), all QPF [3] | **PMID 37668621** (JAMA 2023) and **PMID 37669054** (JAMA Netw Open 2023) [29]; K253442 summary reports sensitivity 77.1% and specificity 78.6% vs reference categorical diagnoses [28] | price: not found | Active (most recent clearance March 2026) [3] | P |
| 9 | **Monarch eTNS** (NeuroSigma, Inc.) (physical gadget) | Therapy: external trigeminal nerve stimulation worn during sleep | 7 through 12, monotherapy, not on ADHD medication [30] | FDA De Novo **DEN180041**, 2019-04-19; Gen 2 510(k) **K233293**, 2024-01-16; product code QGL "Transcutaneous Nerve Stimulator For Adhd" class 2, 21 CFR 882.5898 [3][4][30] | Double-blind sham-controlled pilot, **PMID 30768393**; De Novo cites **NCT01388530** and **NCT02155608** [30][31] | Prescription; price: not found; HCPCS codes and a co-pay programme per company (S) [32] | Private; Gen 2 commercial units planned for March 2026 per company release (S) [33] | P (FDA, PubMed) / S (status) |
| 10 | **Cogmed Working Memory Training** (Cogmed Systems AB) | Therapy / training: working-memory training, 5-week programme | not found | FDA: none found in openFDA [3]; CE marking or class: not found | RCT in children with ADHD, **PMID 15689731** [34] | price: not found | Bought by Pearson in 2010 (S) [35]; transfer back to founders in 2019 per a single source (Wikipedia), unverified [36] | P (PubMed) / S |

### 1.2 Other products found (Europe, game-based, 2023–2026 entrants)

| Product (company, country) | What it does | Age | Regulatory status | Evidence / ID | Model / price | Ver. |
|---|---|---|---|---|---|---|
| **Braingaze** (Braingaze; licensed to Tris Pharma for US and Canada, April 2024) | Diagnosis aid: computerised game plus eye tracking to assess attention; gives clinicians "probability and severity scores" (S) | children and adults (S) | CE marked as a medical device, 2016 per University of Barcelona (S); class: not found; FDA: Tris to run US trials with FDA input (S) | not retrieved in this pass | B2B licence; price: not found | S [37][38] |
| **MOXO d-CPT** (Neurotech Solutions, Israel) | Diagnosis aid: CPT with auditory and visual distractors | from 7 years and adults (S) | CE mark per press (S); FDA: none found in openFDA [3] | not retrieved in this pass | price: not found | S [39] |
| **TALi Detect / TALi Train** (TALi Digital, now Novita Healthcare, Australia) | Game-based attention screening (Detect) and training (Train) for young children | about 3–8 (S) | Company claimed "TGA cleared ... FDA Class II ... CE Mark" in 2021 (S); no 510(k) or De Novo found in openFDA for "TALi" [3] | not retrieved in this pass | Claims US reimbursement under CPT 96146 (S) | S [40] |
| **Prismira** (Lumos Labs, Inc., USA) | Therapy game for ADHD | adults 22–55 [41] | 510(k) **K243729**, 2025-06-13, QFT [3][41] | pivotal study described in the 510(k) summary [41] | price: not found | P |
| **Neurora** (Argus Cognitive, Inc., USA) (autism analogue) | Diagnosis aid for autism from video and audio of a behavioural assessment | 18 months to 12 years (S) | 510(k) **K260064**, 2026-10-02, QPF [3] | not retrieved | price: not found | P (FDA) / S (age) [42] |
| **hiToco** (medigital / Medice, Germany) | Digitally guided parent training (DiGA) for parents of children with ADHD and oppositional behaviour | children 4–11 | Listed by BfArM as a DiGA (status wording differs between sources: "approved" vs provisional) (S); PZN 20081213; class: not found | not retrieved | Statutory health-insurance reimbursed; price: not found | S [43] |
| **Poppins Clinical** (Poppins, France) (dyslexia, not ADHD) | Therapy: rhythmic cognitive training game | 7–11 | "Dispositif médical de classe I au titre de la règle XI de l'annexe VIII" of the MDR; favourable HAS CNEDiMTS opinion for early coverage (PECAN), 23 June 2026 [44] | study POPPINS-02 cited by HAS [44] | Subscription about 30 € per month (S) [45]; company plans extension to ADHD (S) [46] | P (HAS) / S |
| **O-Kidia** (France) | Diagnosis and orientation aid for neurodevelopmental disorders from a 30-minute contactless video | children and adolescents | CE status: not found | not retrieved | not found | S [47] |
| **LUSHA** (France) | ADHD therapeutic game | 7–11 (S) | not found | Feasibility study **NCT07204873**, sponsor University Hospital, Grenoble, not yet recruiting, 80 planned [48] | not found | P (registry) |
| **The Secret Trail of Moon (MOON)** (Spain) | ADHD cognitive-training video game | children and adolescents | not found | **NCT06006871**, Puerta de Hierro University Hospital, completed [48] | not found | P (registry) |
| **MindTension** (startup) | Diagnosis aid: auditory startle response algorithm vs T.O.V.A. | 6–17 | not found | **NCT06728969**, recruiting, 120 planned [49] | not found | P (registry) |
| **BlinkLab** (ASX: BB1) | Smartphone-based biomarkers; ADHD model in development | 6–17 | preparing a US regulatory study (S) | European study, sensitivity 82%, specificity 83% (company announcement 5 Aug 2026, S) | not found | S [50] |

Other FDA-cleared attention-test devices under product code LQD found in the same database query: T.O.V.A. (**K170082**, **K173915**) and DANA (**K141865**) [3]. ADHD stimulators under QGL from Korea: SMILE (**K213629**), BT-1000 (**K232991**), ADDNOX (**K243289**) [3].

### 1.3 What the FDA decision summaries say that matters for the game design (P)

- EndeavorRx is indicated to improve a test score (TOVA) and the label says patients "may not display benefits in typical behavioral symptoms, such as hyperactivity" [1].
- Cognoa returned no diagnostic answer for 68% of children. The authors present the indeterminate output as "a risk control measure"; without it, sensitivity across all completers "would fall to 51.6%" [26].
- Every ADHD assessment device found (QbTest, QbCheck, T.O.V.A., DANA) is HCP-facing. QbCheck's IFU: "results should be interpreted only by qualified health care professionals" [12]. Cognoa, EarliPoint and Monarch are prescription-only [25][28][30].

---

## Part 2. Regulatory reality check (EU MDR 2017/745)

### 2.1 Is it a medical device at all? (qualification)

MDR definition, as quoted in MDCG 2019-11 rev.1, p. 5 [51]:

> "medical device" means any instrument, apparatus, appliance, software, implant, reagent, material or other article intended by the manufacturer to be used, alone or in combination, for human beings for one or more of the following specific medical purposes:
> - diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of disease,

MDCG 2019-11 rev.1, p. 9 [51]:

> software only intended for non-medical purposes (excluding MDR Annex XVI devices), such as invoicing, staff planning, e-mailing, web or voice messaging, data parsing, word processing, and back-up, wellness or fitness apps, do not qualify as MDSW.

MDCG 2019-11 rev.1, p. 7 [51] (claims must match evidence):

> As set out in Article 7 of MDR and IVDR, this also entails that any claims, relating to the intended medical purpose of their MDSW are supported by appropriate level of clinical evidence. If this is not the case, the software would not meet the requirements of the regulations and therefore may not be CE marked as a medical device, nor present said claims.

MDCG 2019-11 rev.1, p. 11, listed among examples of MDSW [51]:

> MDSW intended to assess, monitor, and manage depression. The MDSW provides patients with questionnaires to track their mood, symptoms, and activities.

**Reading (for the team to check):** an output naming ADHD and its likelihood is information for "diagnosis ... prediction" of a disease. The wellness exclusion covers software with no medical purpose; calling the tool a "screening questionnaire" does not remove the medical purpose if the output still refers to ADHD.

### 2.2 Annex VIII Rule 11 (verbatim, as quoted in MDCG 2019-11 rev.1, p. 17) [51]

> Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa, except if such decisions have an impact that may cause:
>
> death or an irreversible deterioration of a person's state of health, in which case it is in class III; or
>
> a serious deterioration of a person's state of health or a surgical intervention, in which case it is classified as class IIb.
>
> Software intended to monitor physiological processes is classified as class IIa, except if it is intended for monitoring of vital physiological parameters, where the nature of variations of those parameters is such that it could result in immediate danger to the patient, in which case it is classified as class IIb.
>
> All other software is classified as class I.

### 2.3 MDCG 2019-11 rev.1 (June 2025) on Rule 11 [51]

The document is "MDCG 2019-11 Rev.1", "October 2019 / June 2025 rev.1"; its change log lists "Addition of clarification to Rule 11 (Subrule a)" and "Annex IV Inclusion of a new Class I example" [51].

Sub-rule 11a, p. 17:

> The wording "intended to provide information which is used to take decisions with diagnosis or therapeutic purposes" describes, in very general terms, the "mode of action" which is characteristic of all MDSW. Therefore, this sub-rule is generally applicable to all MDSW (excluding those MDSW that have no medical purpose).

Pp. 17–18:

> a device intended to prevent the risk of illnesses or pathologies by analysing physiological parameters (e.g. placement of the dorsal vertebrae, analysis of arterial stiffness, etc.) can be considered as a device providing information which is used to take decisions with diagnosis purpose (potential detection of pathologies) and in this case is in class IIa.

Sub-rule 11c, p. 18:

> Sub-rule 11c) implies that all other MDSW is classified as class I.

Annex III (p. 33), illustrative table, IMDRF significance x healthcare situation: "Non-serious" situation with "Informs clinical management" maps to Class IIa (Category I.i); "Serious" situation with "Treat or diagnose" maps to Class IIb (Category III.ii). The note states: "This table does not take into account MDSW which is Class I." [51]

Annex IV classification examples, p. 34 [51]:

> Diagnostic MDSW intended for scoring depression based on inputted data on a patient's symptoms (e.g. mood, anxiety) should be classified as class IIb under Rule 11(a), - (IMDRF Risk Category III.ii) as the healthcare situation (depression) is serious and the significance of the information is "diagnosis").

> Cognitive therapy MDSW that includes a diagnostic function which is intended to feed back to the software to determine follow-up therapy, e.g. software adapts treatment of depression based on diagnostic feedback, should be in class III per Rule 22. When a specialist determines the necessary cognitive therapy based on the outcome provided by the MDSW, the MDSW would be classified as class IIa per Rule 11(a).

The two class I examples of rev.1, p. 35 [51]: a fertility app "classified as class I per Rule 11c", and an app assisting persons with a communication disorder (including autism) to "talk by converting a set of selected symbols into spoken language ... class I per Rule 11c". Neither provides information for a diagnostic decision.

Lay users, p. 11, footnote 22: "Where MDSW is intended to be used by a lay person, the manufacturer shall apply safety and performance requirements outlined in MDR Annex I. 22 and 23.4 (w)" [51].

### 2.4 Verdict on "medical device class I"

**Plainly: class I does not hold for a game that gives parents an "ADHD probability".**

1. The output is information used to take a decision with a diagnosis purpose, which is sub-rule 11a: "is classified as class IIa" as the floor [51].
2. MDCG says 11a "is generally applicable to all MDSW (excluding those MDSW that have no medical purpose)" and leaves class I to "all other MDSW" (11c) [51]. The class I examples in rev.1 have no diagnostic output [51].
3. The closest Annex IV example (symptom-based scoring of a condition, "significance ... diagnosis") is class IIb [51]. Whether ADHD is judged "serious" (IIb) or "non-serious" (IIa) is not settled by any text found; that call belongs to the team and its regulatory advisor. The floor is IIa either way.
4. **Additional flag for the team's design:** gameplay metrics that produce an indication and then automatically select follow-up "missions" match the MDCG example of therapy software whose diagnostic function feeds back to determine follow-up therapy, which MDCG places in "class III per Rule 22" [51]. If a specialist decides the follow-up instead, the same example lands in IIa [51].
5. What class I can cover, for reference: Poppins Clinical, a training game for dyslexia with no diagnostic output, is CE marked "classe I au titre de la règle XI" [44]. That supports class I only for a module with no diagnostic or monitoring claim.

Consequence: class IIa or above needs a notified body (conformity assessment beyond self-declaration), clinical evidence for the diagnostic performance claimed (MDCG p. 7 quote above), and, as an AI-based class IIa+ device, the AI Act high-risk regime (2.5).

### 2.5 EU AI Act (Regulation (EU) 2024/1689)

Article 6(1) (text from the AI Act Explorer consolidated version, definition tooltips removed) [52]:

> Irrespective of whether an AI system is placed on the market or put into service independently of the products referred to in points (a) and (b), that AI system shall be considered to be high-risk where both of the following conditions are fulfilled:
> (a) the AI system is intended to be used as a safety component of a product, or the AI system is itself a product, covered by the Union harmonisation legislation listed in Annex I;
> (b) the product whose safety component pursuant to point (a) is the AI system, or the AI system itself as a product, is required to undergo a third-party conformity assessment, with a view to the placing on the market or the putting into service of that product pursuant to the Union harmonisation legislation listed in Annex I.

Annex I, Section A lists "Regulation (EU) 2017/745 of the European Parliament and of the Council of 5 April 2017 on medical devices" [53].

**Dates of application.** Article 113 as amended now reads that Article 6(1) obligations apply from "2 August 2028 as regards AI systems classified as high-risk pursuant to Article 6 (1) and Annex I", and from "2 December 2027" for Annex III systems [54]. The amending act is the Digital Omnibus on AI, Regulation (EU) 2026/1744, published in the Official Journal on 24 July 2026 and in force on 27 July 2026 (S, secondary source; check the OJ text before relying on it) [55]. The original Article 6(1) date was 2 August 2027 [54]. Chapters I and II (AI literacy, prohibitions) have applied since 2 February 2025 [54].

**Reading:** an AI-based ADHD indication that is a class IIa or higher device needs a notified body, so it meets both conditions of Article 6(1) and is a high-risk AI system from 2 August 2028. A class I device without notified-body involvement would not meet condition (b). Whether the team's scoring model is an "AI system" under Article 3(1) (it "infers, from the input it receives, how to generate outputs such as predictions") depends on how the model is built; that is a team question [52].

### 2.6 GDPR for children's health data (Regulation (EU) 2016/679)

Article 9(1) [56]:

> Processing of personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, or trade union membership, and the processing of genetic data, biometric data for the purpose of uniquely identifying a natural person, data concerning health or data concerning a natural person's sex life or sexual orientation shall be prohibited.

Article 9(2)(a), one of the exceptions [56]:

> the data subject has given explicit consent to the processing of those personal data for one or more specified purposes, except where Union or Member State law provide that the prohibition referred to in paragraph 1 may not be lifted by the data subject;

Article 9(4): "Member States may maintain or introduce further conditions, including limitations, with regard to the processing of genetic data, biometric data or data concerning health." [56]

Article 8(1) [57]:

> Where point (a) of Article 6(1) applies, in relation to the offer of information society services directly to a child, the processing of the personal data of a child shall be lawful where the child is at least 16 years old. Where the child is below the age of 16 years, such processing shall be lawful only if and to the extent that consent is given or authorised by the holder of parental responsibility over the child.
> Member States may provide by law for a lower age for those purposes provided that such lower age is not below 13 years.

Article 8(2): "The controller shall make reasonable efforts to verify in such cases that consent is given or authorised by the holder of parental responsibility over the child, taking into consideration available technology." [57]

France: the threshold is 15 under Article 45 of the Loi Informatique et Libertés; below 15, the minor and the holder(s) of parental authority consent jointly (CNIL, S) [58].

**Reading:** gameplay telemetry that is turned into an ADHD indication is, on its face, "data concerning health" of a child; the team should confirm this with its DPO. A product for children of primary-school age will rely on explicit parental consent for Article 9 and verifiable parental consent for Article 8, and a DPIA is the usual expectation for this type of processing (DPIA requirement not quoted here; to confirm).

### 2.7 Wellness or "screening questionnaire" positioning vs a diagnostic claim

| Positioning | What the text says | Consequence |
|---|---|---|
| Wellness / focus game, no disease named | "wellness or fitness apps, do not qualify as MDSW" (MDCG p. 9) [51] | Not a medical device, so no notified body; but the product cannot name ADHD, give a probability, or imply it in marketing, because claims about a medical purpose need clinical evidence and a CE mark (MDCG p. 7) [51] |
| "Screening questionnaire" that names ADHD | The definition covers "diagnosis, prevention, monitoring, prediction" (p. 5); MDCG lists a depression questionnaire app as MDSW (p. 11) and a depression scoring tool as IIb (p. 34) [51] | Still MDSW; the word "screening" does not change the qualification |
| Diagnosis aid for an HCP | Rule 11a and the "specialist determines" example (IIa) [51] | IIa or IIb, notified body, clinical performance evidence |

### 2.8 Intended-purpose wordings: OPTIONS for the team to decide

These are drafts to discuss, not recommendations. "X–Y" ages are placeholders for the team.

**Option A. Wellness game (not a medical device)**
> "[Name] is a game for children aged X–Y that trains and tracks focus and self-regulation skills through play. It does not detect, diagnose, screen for or monitor any medical condition and does not replace professional advice."
- Likely status: not MDSW (MDCG p. 9) [51].
- Trade-off: fastest, no notified body, no clinical investigation; but no ADHD claim anywhere (app, site, ads, gadget), no probability output, and a weak story for paid follow-up. Marketing drift toward ADHD would re-qualify it (MDCG p. 7) [51].

**Option B. Information for a clinician (HCP-facing diagnosis aid)**
> "[Name] is software intended to collect gameplay-derived measures of attention and activity in children aged X–Y and to provide a qualified healthcare professional with information that aids in the clinical assessment of ADHD. It is not intended as a stand-alone diagnosis; results are interpreted by the healthcare professional together with other clinical information."
- Likely class: IIa under Rule 11a, possibly IIb if the team judges ADHD diagnosis a "serious" situation (Annex III table, depression example) [51]. High-risk AI system from 2 August 2028 if AI-based [52][54].
- Trade-off: matches every cleared ADHD assessment device found (QbTest, QbCheck: HCP-interpreted) [12]; credible for reimbursement; parents receive a "talk to your doctor" prompt rather than a probability; needs a notified body and a clinical performance study.

**Option C. Parent-facing likelihood indication (closest to the current concept)**
> "[Name] is software intended to provide parents of children aged X–Y with an indication of the likelihood of ADHD-related attention difficulties, based on gameplay measures, to support the decision to seek a clinical assessment."
- Likely class: at least IIa (Rule 11a), arguably IIb by analogy with the depression-scoring example [51]; lay-user requirements of Annex I 22 and 23.4(w) apply [51]; high-risk AI from 2 August 2028 if AI-based [52][54]. If the indication also drives the follow-up missions automatically, MDCG's Rule 22 example puts that combination in class III [51].
- Trade-off: the most differentiated (no parent-facing ADHD probability product was found, Part 3) and the heaviest burden: lay-user usability, false reassurance and false alarm risk, the highest evidence bar, and the GDPR child-health-data load.

**Option D (structural, combinable with A, B or C).** MDCG 2019-11 rev.1, p. 7, on modular MDSW (detailed in its section 7): "Each module must independently meet regulatory standards, and the collective functionality of all components should align with the declared intended purpose." [51] Splitting a non-medical game and mission module from a medical assessment module is a design option for the team to assess with its regulatory advisor; it does not by itself lower the class of the assessment module.

---

## Part 3. Differentiation gap (evidence-backed only)

Each gap below is stated as "not found in this collection", with the rows it rests on.

1. **No product found that combines game-based screening, ongoing monitoring and a parent-paid subscription for children in the EU.** The game-based or CPT assessment tools found (QbTest, QbCheck, Nesplora AULA, MOXO, Braingaze, NeuroCatch) are sold to clinicians, per use or by clinic plan (Nesplora: 27€ per use to 1670€ per year) [12][18][24][37][39]. The consumer subscriptions found are therapy-only: EndeavorOTC for adults in the US ($24.99 per month) [10][11], Poppins for dyslexia in France (about 30 € per month) [44][45]. hiToco is parent training paid by German statutory insurance, not screening [43].
2. **No cleared or CE-marked ADHD assessment found that reports to parents (lay users).** All ADHD assessment devices found are interpreted by HCPs [12]; the autism analogues (Cognoa, EarliPoint, Neurora) are prescription aids for clinicians [25][28][42]. This is a white space and a regulatory burden at the same time (Option C).
3. **No EU-marketed paediatric ADHD game therapy with reimbursement found.** EndeavorRx received a CE mark in June 2020, with the company's near-term focus on the US (S) [5][6]; the European ADHD games found (LUSHA, MOON) are at feasibility or trial stage [48]; the reimbursed French game precedent (Poppins, class I) is for dyslexia [44].
4. Related design lesson rather than a gap: the only AI diagnosis aid with published pivotal data for a neurodevelopmental condition in children (Cognoa) withheld an answer in 68% of cases as a risk control [26]. A probability shown to parents for every child would go the other way; the team should decide this knowingly.

Not established by this collection (do not claim): that no such product exists anywhere; EU device classes for QbTest, AULA, Braingaze, MOXO, EndeavorRx, Cogmed (all "not found"); any price for Cognoa, EarliPoint, Monarch, Cogmed, QbTest.

---

## Sources

1. FDA De Novo decision summary DEN200026 (EndeavorRx). https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200026.pdf
2. FDA 510(k) summary K231337 (EndeavorRx, 8–17). https://www.accessdata.fda.gov/cdrh_docs/pdf23/K231337.pdf
3. openFDA device 510(k) and De Novo records, queried 2026-10-19 by applicant, device name and product code (LQD, QFT, QPF, QGL). https://api.fda.gov/device/510k.json
4. openFDA device classification (QFT 882.5803, QPF 882.1491, QGL 882.5898, LQD class U). https://api.fda.gov/device/classification.json
5. Business Wire, "Akili Announces CE Mark Approval EndeavorRx", 22 June 2020 (S). https://www.businesswire.com/news/home/20200622005733/en/Akili-Announces-CE-Mark-Approval-EndeavorRxTM-Digital/
6. CHADD, "Akili's ADHD digital therapy approved in Europe", 25 June 2020. https://chadd.org/?p=20011
7. Kollins SH et al. STARS-ADHD. Lancet Digit Health 2020. PMID 33334505. doi:10.1016/S2589-7500(20)30017-0. NCT02674633.
8. EndeavorRx, "Getting a prescription" (S). https://www.endeavorrx.com/getting-a-prescription
9. Business Wire, 1 July 2024, completion of tender offer (S); MassDevice and Investing.com coverage. https://www.businesswire.com/news/home/20240701029834/en ; https://investing.com/news/company-news/virtual-therapeutics-completes-akili-acquisition-93CH-3505722
10. FDA 510(k) summary K233496 (EndeavorOTC). https://www.accessdata.fda.gov/cdrh_docs/pdf23/K233496.pdf
11. EndeavorOTC pricing pages (S). https://www.endeavorotc.com/?p=3313 ; https://endeavorotc.com/?p=3310
12. FDA 510(k) summary K143468 (QbCheck). https://www.accessdata.fda.gov/cdrh_docs/pdf14/K143468.pdf
13. Qbtech legal page (S; the URL now redirects to https://trust.qbtech.com/, content not readable on 2026-10-19). https://qbtech.com/legal
14. Health Innovation Network, "Meet the innovator: Jo Barosa, Qbtech" (S). https://thehealthinnovationnetwork.co.uk/blogs/meet-the-innovator-jo-barosa-qbtech
15. Hollis C et al. AQUA trial. J Child Psychol Psychiatry 2018. PMID 29700813. doi:10.1111/jcpp.12921.
16. Qbtech, "NICE appraises QbTest" (S). https://qbtech.com/blog/nice-appraises-qbtest
17. Ulberstad F et al. QbCheck reliability and validity. Int J Methods Psychiatr Res 2020. PMID 32100383. doi:10.1002/mpr.1822.
18. NeuroCatch home page, read 2026-10-19. https://neurocatch.com/
19. Canadian Healthcare Technology, 28 Sept 2022 (S). https://www.canhealth.com/2022/09/28/health-canada-approves-portable-brain-scanner/
20. PubMed search "NeuroCatch", 8 records, e.g. Jones et al. Front Hum Neurosci 2024, PMID 38628971, doi:10.3389/fnhum.2024.1358551.
21. Wikipedia, "Nesplora Aula (test)" (S). https://en.wikipedia.org/wiki/Nesplora_Aula_(test)
22. Nesplora site statements on CE marking (S). https://nesplora.com/en/home
23. Díaz-Orueta U et al. Child Neuropsychol 2013, PMID 23638628; Areces D et al. J Atten Disord 2016, PMID 26896148; Rodríguez C et al. Int J Clin Health Psychol 2018, PMID 30487931; Areces D et al. Res Dev Disabil 2024, PMID 39708780.
24. Nesplora plans page, read 2026-10-19. https://nesplora.com/en/plans
25. FDA De Novo decision summary DEN200069 (Cognoa ASD Diagnosis Aid). https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN200069.pdf
26. Megerian JT et al. npj Digit Med 2022. PMID 35513550. doi:10.1038/s41746-022-00598-6.
27. Fierce Healthcare (Highmark); Behavioral Health Business (Wyoming Medicaid, 30 Sept 2024) (S). https://www.fiercehealthcare.com/payers/cognoas-autism-diagnostic-tool-now-network-highmark-members ; https://bhbusiness.com/2024/09/30/setting-a-precedent-cognoa-earns-medicaid-coverage-for-early-autism-diagnosis-tool/
28. FDA 510(k) summary K253442 (EarliPoint Assessment). https://www.accessdata.fda.gov/cdrh_docs/pdf25/K253442.pdf
29. Jones W et al. JAMA 2023, PMID 37668621, doi:10.1001/jama.2023.13295; Jones W et al. JAMA Netw Open 2023, PMID 37669054, doi:10.1001/jamanetworkopen.2023.30145.
30. FDA De Novo decision summary DEN180041 (Monarch eTNS); 510(k) K233293. https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN180041.pdf ; https://www.accessdata.fda.gov/cdrh_docs/pdf23/K233293.pdf
31. McGough JJ et al. J Am Acad Child Adolesc Psychiatry 2019. PMID 30768393. doi:10.1016/j.jaac.2018.11.013.
32. BioSpace, NeuroSigma HCPCS codes (S). https://www.biospace.com/neurosigma-announces-receipt-of-permanent-hcpcs-codes-from-cms-for-monarch-etns-system
33. Santelog, NeuroSigma manufacturing line (S). https://www.santelog.com/actualites-sante-nasdaq/neurosigma-completes-1-million-investment-high-volume-manufacturing-line
34. Klingberg T et al. J Am Acad Child Adolesc Psychiatry 2005. PMID 15689731. doi:10.1097/00004583-200502000-00010.
35. Karolinska Institutet, "From clinical tool to increased learning in schools" (S). https://ki.se/en/collaboration/from-clinical-tool-to-increased-learning-in-schools
36. Wikipedia, "Cogmed" (S, single source). https://en.wikipedia.com/wiki/Cogmed
37. Business Wire, Tris Pharma launches digital health business, 16 April 2024 (S). https://www.businesswire.com/news/home/20240416876276/en/Tris-Pharma-Launches-Digital-Health-Business-to-Develop-and-Commercialize-Digital-Products-for-ADHD
38. University of Barcelona (FBG) on Braingaze (S); Caplight profile (S). https://www.fbg.ub.edu/en/?p=18534 ; https://www.caplight.com/company/braingaze
39. ISRAEL21c, "Customizing ADHD evaluation" (S). https://archive.israel21c.org/customizing-adhd-evaluation/
40. Small Caps, Novita Healthcare TALi (S); Finance News Network 2021 presentation (S). https://smallcaps.com.au/article/novita-healthcare-tali-qualifies-medical-reimbursement-us-clinical-market ; https://finnewsnetwork.com.au/archives/finance_news_network349528.html
41. FDA 510(k) summary K243729 (Prismira). https://www.accessdata.fda.gov/cdrh_docs/pdf24/K243729.pdf
42. Medical Device Network on Argus Cognitive Neurora (S). https://www.medicaldevice-network.com/?p=245752
43. Medice press release on hiToco; Pharmazeutische Zeitung (S). https://medice.com/en-de/from-the-company/medice-the-health-family-first-digital-health-application-for-children-with-adhd-in-germany-approved-by-bfarm ; https://www.pharmazeutische-zeitung.de/digitale-hilfe-fuer-erwachsene-mit-adhs-158166/
44. HAS, CNEDiMTS opinion POPPINS CLINICAL (PECAN), 23 June 2026, read 2026-10-19. https://www.has-sante.fr/upload/docs/application/pdf/2026-06/dir3/poppins_clinical_pecan-18_avis_de_la_cnedimts_du_23_06_2026.pdf
45. Gameblog (S). https://www.gameblog.fr/trends/jeu-video-assurance-maladie-718771
46. FrenchWeb, Poppins 5 M€ raise (S). https://www.frenchweb.fr/poppins-un-jeu-video-medical-pour-les-enfants-dyslexiques-soutenu-par-une-levee-de-5-millions-deuros/453798
47. Motherbase profile, O-Kidia (S). https://my.motherbase.ai/startup/153415-o-kidia/?page=3
48. ClinicalTrials.gov records NCT07204873 (LUSHA) and NCT06006871 (MOON), retrieved 2026-10-19 via the registry API. https://clinicaltrials.gov/study/NCT07204873 ; https://clinicaltrials.gov/study/NCT06006871
49. ClinicalTrials.gov NCT06728969 (MindTension). https://clinicaltrials.gov/study/NCT06728969
50. BlinkLab ASX announcement, 5 Aug 2026 (S). https://announcements.asx.com.au/asxpdf/20260805/pdf/072fn74wkd9cqh.pdf
51. MDCG 2019-11 Rev.1, "Guidance on Qualification and Classification of Software in Regulation (EU) 2017/745 – MDR and Regulation (EU) 2017/746 – IVDR", October 2019, June 2025 rev.1, read in full text 2026-10-19 (page numbers as printed). https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf
52. AI Act Explorer, Article 6 (consolidated, shows Digital Omnibus amendments). https://artificialintelligenceact.eu/article/6/
53. AI Act Explorer, Annex I. https://artificialintelligenceact.eu/annex/1/
54. AI Act Explorer, Article 113 (amended dates shown). https://artificialintelligenceact.eu/article/113/
55. Law and Technology, "Digital Omnibus on AI in the Official Journal: Regulation (EU) 2026/1744 is published" (S, secondary). https://lawandtechnology.eu/en/digital-omnibus-on-ai-official-journal-regulation-2026-1744/ ; ELI data.europa.eu/eli/reg/2026/1744/oj
56. GDPR Article 9 (text via gdpr-info.eu). https://gdpr-info.eu/art-9-gdpr/
57. GDPR Article 8 (text via gdpr-info.eu). https://gdpr-info.eu/art-8-gdpr/
58. CNIL, minors' digital rights consultation and recommendations (S). https://www.cnil.fr/fr/la-cnil-lance-une-consultation-publique-sur-les-droits-des-mineurs-dans-lenvironnement-numerique

**Open items to confirm before any external use:** EU class of each CE-marked competitor (EUDAMED or certificate); the OJ text of Regulation (EU) 2026/1744; EndeavorRx and EndeavorOTC current availability after the 2024 acquisition; Cogmed ownership; MDR Article 2(1) and Annex VIII quoted from EUR-Lex directly (EUR-Lex refused automated download on 2026-10-19; the texts above are as reproduced in MDCG 2019-11 rev.1).
