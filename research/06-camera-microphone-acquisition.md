# 06 - Camera and microphone acquisition during play (web first)

Researched 2026-10-19 for the hackathon team. Collects and proposes; **the team decides**. Context: team decision 2026-10-19, the web game will use the device camera and microphone during play; native app later. Positioning (from `04-game-design-symptom-mapping.md` section 0): orientation, not diagnosis, class IIa maximum.

Evidence rules: every claim carries a URL or PMID/DOI. PubMed items below were retrieved with the PubMed tools and NCBI E-utilities during this research (abstracts read, not full texts). Anything not confirmed is marked **unverified**. Thresholds and timings that are not sourced are marked **design choice** or **TODO**. "No evidence found" means none was found in this research, not that none exists.

## Summary

1. **Camera library: `@mediapipe/tasks-vision` Face Landmarker, Apache-2.0** (licence field read from the npm registry and the repo LICENSE file). On-device WASM/WebGL, outputs 478 landmarks, optional blendshapes and a facial transformation matrix (head pose). We would use landmarks plus the transformation matrix only, with blendshapes left off.
2. **Do not use WebGazer.js**: its licence is GPL-3.0-or-later (package.json and LICENSE.md), which blocks copying it into a non-GPL repo, and its gaze accuracy in published checks is too coarse and needs a calibration a 6-year-old will not do.
3. **Microphone: `@ricky0123/vad-web` (ISC) running Silero VAD (MIT) on-device**, plus a local RMS level meter for ambient noise. Features only, never audio.
4. **Evidence is weak.** Lab eye-trackers and head/body video separate ADHD groups in children in small single studies; no study was found that uses a consumer webcam or microphone inside a child's game to measure ADHD symptoms. For the microphone, no child-ADHD study of VAD-type measures was found. Both channels should be labelled **exploratory, not scored** in the hackathon build.
5. **Privacy design: on-device processing, aggregate numbers only, parent consent first, fully optional.** Details in section 5.
6. A **proposed optional `camera` / `microphone` extension** of `SessionMetrics` is in section 6; the existing v1 contract is unchanged.

## 1. Camera: in-browser options compared

Licence checks done 2026-10-19 by fetching LICENSE / package.json from the repos and the npm registry (`registry.npmjs.org/<pkg>/latest`).

| Option | Licence (verified how) | Where it runs | What it gives | Maintenance signal (GitHub API `pushed_at`) | Verdict |
|---|---|---|---|---|---|
| **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision` 1.1.1 on npm) | Apache-2.0: npm registry field, and repo LICENSE begins "Apache License Version 2.0" ([repo](https://github.com/google-ai-edge/mediapipe)). **Model asset licence (face_landmarker.task) not verified: TODO** | In the browser (WASM + WebGL), no server | 478 3D landmarks (iris included), 52 blendshapes (off by default), facial transformation matrix (off by default); VIDEO and LIVE_STREAM modes ([Google doc](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker), [web guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js)) | repo pushed 2026-10-16 | **Recommended** |
| MediaPipe Pose (same package) | Apache-2.0 (same package) | Browser | Body keypoints; used in one child ADHD study (section 2) | same | Optional, heavier; not needed for a seated child with a tablet. Only the upper body is probably in frame (unverified) |
| **WebGazer.js** 3.5.3 | **GPL-3.0-or-later** (package.json) and LICENSE.md text "GNU General Public License ... either version 3"; README: "Licensed under GPLv3. Companies have the option to license WebGazer.js under LGPLv3 while their valuation is under $1,000,000" ([README](https://github.com/brownhci/WebGazer)) | Browser | Screen-coordinate gaze after calibration | repo pushed 2026-02-24 | **Rejected**: GPL blocks copying into the repo; the LGPL option is conditional on company valuation |
| **human** (vladmandic) 3.3.6 | MIT for the repo (package.json, LICENSE). Per-model licences "not stated" on the README page; it points to a wiki "List of Models and Credits" that was not read: **TODO** ([repo](https://github.com/vladmandic/human)) | Browser or Node (not explicitly stated as on-device) | Iris/gaze, face, emotion, age, gender modules | repo pushed 2025-12-13 | Not chosen: bundles emotion/age/gender modules we must switch off (AI Act risk, section 4), per-model licences unverified, single maintainer |
| TensorFlow.js `face-landmarks-detection` | Apache-2.0 (tfjs-models LICENSE) ([README](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection)) | Browser | One model: MediaPipeFaceMesh, 478 keypoints, runtime `mediapipe` or `tfjs` | not checked | Redundant with Face Landmarker; no head-pose matrix mentioned on the page |

**Accuracy figures found (gaze).** None for MediaPipe: a search for a measured gaze-angle error of MediaPipe iris/blendshapes against on-screen targets returned no validation study (web search 2026-10-19). Treat any "looking at the screen" output from MediaPipe as **unvalidated**; we therefore propose a coarse head-pose-based on/off-screen flag rather than a gaze point. For WebGazer (not to be used, shown for comparison): about 4.17 degrees mean error in the original 2016 evaluation and about 100 to 200 screen pixels ([Brown press summary](https://www.brown.edu/news/2016-06-01/eyetracker), [paper PDF](https://cs.brown.edu/people/apapouts/papers/ijcai2016webgazer.pdf); figures as relayed by a search summary, **primary PDF not read: unverified**); in early childhood about 3.94 degrees in lab and about 207 px online ([ResearchGate listing](https://www.researchgate.net/publication/367367012_Validation_of_an_Open_Source_Remote_Web-based_Eye-tracking_Method_WebGazer_for_Research_in_Early_Childhood), venue not confirmed); a child-language study found WebGazer noisier than video annotation, offset about 38 % of screen size ([J Child Lang](https://www.cambridge.org/core/journals/journal-of-child-language/article/assessing-two-methods-of-webcambased-eyetracking-for-child-language-research/F28BD05F1D529D3ADE04F2E28A5EE4CB)); a 2025 evaluation of 20 participants found about 10 to 14 degrees ([MDPI](https://www.mdpi.com/1995-8692/19/5/99)); a 2025 scoping review gives about 4 degrees average spatial sensitivity ([ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2772766125000655)). Message: consumer-webcam gaze is accurate to several degrees at best, so only coarse "toward / away from screen" is defensible.

**Performance on tablets.** No latency figure is published on the Google page (it states none). `detect()` and `detectForVideo()` "run synchronously and block the user interface thread" per the web guide, so run it in a Web Worker or at a low frame rate. We found no measured frame rate on a child-grade tablet: **unverified, measure on the demo tablet** (proposal: 10 Hz, design choice).

**iOS Safari.**
- `getUserMedia` needs a secure context (HTTPS or localhost) and always asks the user; the returned promise may never resolve if the user ignores the prompt; browsers must show an in-use indicator ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). Top-level documents only, or an iframe with `allow="camera; microphone"`; the `Permissions-Policy` directives are `camera` and `microphone` (same MDN page). This matters because the Phaser game and the Next.js app may sit in different frames.
- Traps found: Safari re-prompting on iOS in single-page apps ([Apple forum thread](https://developer.apple.com/forums/thread/788518)); a WebKit engineer stated in 2018 that Safari asks once per execution context ([W3C list](https://lists.w3.org/Archives/Public/public-webapps-github/2018Jul/0183.html), possibly outdated); permission not remembered from inside an iframe ([WebKit bug 220416](https://bugs.webkit.org/show_bug.cgi?id=220416)); a WebKit GPU-process crash reported on iOS 27 beta 5 with MediaPipe PoseLandmarker 0.10.32 on the GPU delegate ([WebKit bug 321693](https://bugs.webkit.org/show_bug.cgi?id=321693), beta only, Pose not Face); WebGPU video import rotated about 90 degrees on iOS 26 and iPadOS 26.5 while WebGL was correct ([tfjs issue 8733](https://github.com/tensorflow/tfjs/issues/8733)). Mitigations: ask for permission once, from the top document, in a user gesture; prefer the WebGL/CPU delegate over WebGPU; test on the real tablet.
- MediaPipe tasks-vision on iOS Safari: no official support statement was found on the Google pages fetched. **Unverified; test.**

**Privacy trap in the library itself.** The Google guide loads the WASM and the model from `cdn.jsdelivr.net` and `storage.googleapis.com`. Self-host the WASM files and the `.task` model so that a child's browser makes no third-party request when it opens the camera (design choice; also removes a dependency during the demo).

## 2. Evidence: do camera-derived measures relate to ADHD symptoms in children?

Separated by what the sensor was. None of the studies below used a consumer webcam inside a game with children.

| Evidence | Sensor | Population | Finding | Source |
|---|---|---|---|---|
| Eye and head movements while watching a classroom video | Lab eye tracker plus video (head position estimated from video) | Children with ADHD vs controls (sizes not in the abstract) | ADHD: lower proportion of fixation on the relevant area, more saccades, more head movements, larger angular change of head on the x-axis | PMID 38214185, [DOI](https://doi.org/10.1177/10870547231221746) |
| Oculomotor inhibition meta-analysis | Lab eye trackers, laboratory tasks | k = 31 studies, N = 1,567 (age span not stated in the abstract) | Saccades during prolonged fixation g = 1.11 (95 % CI 0.56 to 1.65, k = 6, I2 79.1 %); antisaccade direction errors g = 0.57 (k = 18); anticipatory saccades g = 0.86 (k = 11) | PMID 34052459, Chamorro 2022, Biol Psychiatry Cogn Neurosci Neuroimaging |
| Oculomotor deficits systematic review and meta-analysis | Lab eye trackers | children, medicated excluded per the search summary | Authors judged evidence insufficient for firm conclusions (from a search snippet; abstract not read) | PMID 36280758, Sherigar 2023, Eye |
| Body movement from researcher-worn POV video, MediaPipe Pose | Consumer-grade video processed with MediaPipe Pose | 37 children with ADHD, 29 typically developing, aged 7 to 11, structured 5-minute interaction | Global activity index higher in ADHD (p = 0.003), head movement among regions that differed; correlation with parent-rated hyperactivity r = 0.28 (p = 0.025); AdaBoost accuracy 81.82 %, ROC-AUC 0.85 (single cross-sectional study, camera worn by a researcher, not a fixed screen webcam) | PMID 41924709, [DOI](https://doi.org/10.3389/fpsyt.2026.1785988) |
| Pose estimation of sitting video | OpenPose on 1-minute sitting videos | small, 12 videos | Agreement with human annotation AUC above 0.79 for legs, arms, feet but **0.65 for the head** | PMID 32971358, [DOI](https://doi.org/10.1016/j.jpsychires.2020.08.033) |
| Action recognition during TOVA | Camera keypoints (body and face) | ADHD children, 3,801 video samples | 90.6 % top-1 accuracy across six action categories: recognises behaviours, does **not** diagnose | PMID 39768028, [DOI](https://doi.org/10.3390/bioengineering11121210) |
| QbCheck (webcam activity during an online test) | Built-in webcam, home | 142 adolescents/adults (69 ADHD, 73 controls) | Sensitivity 82.6, specificity 79.5; **not children** | PMID 32100383 |
| Objective hyperactivity measures review | Actigraph, QbTest motion tracking | children | Good discriminant validity vs controls and sensitivity to stimulants, but "poor ability to distinguish ADHD from other disorders, or among the three types" | PMID 35038458 |
| QbTest systematic review | Infrared motion tracker, QbCheck webcam | 10 studies, mostly UK children | Evidence of clinician-confidence and time-to-decision benefits; RCT and before-after studies at high or serious risk of bias | PMID 40246562, [DOI](https://doi.org/10.1136/bmjopen-2024-095479) |

**Reading.** (a) Lab eye-tracking and motion tracking differ between groups in children, but the lab devices are not consumer webcams and group differences do not give individual classification (same caution as `04` section 2, PMID 37004919). (b) The only consumer-camera paediatric result found (PMID 41924709) is one cross-sectional study with a researcher-worn camera. (c) Head tracking was the weakest region in an OpenPose check (AUC 0.65, PMID 32971358). (d) The head and face landmarks MediaPipe gives are a different technology from those studies. **Strength of evidence: weak, exploratory. No camera measure should enter `ScoreResult.band` in the hackathon build.**

## 3. Microphone: what could be observed, how, and the evidence

**What it could observe, honestly.** Whether a voice is present (not whose), how much and when, relative to game events (instruction audio, cue, stimulus), and the ambient noise level. It cannot tell the child from a parent or a sibling, and it will not know whether the child spoke because the game asked (for example a story prompt).

| Candidate symptom | Proposed feature | Evidence in children with ADHD |
|---|---|---|
| HI6 talks excessively | `speech_ratio` (share of session with voice) | In a classroom study of 55 children with ADHD and 34 typically developing children aged 6 to 12, observers coded verbal hyperactivity (talking, other vocalizations); it rose during transitions in both groups and there was no group x setting interaction; the group was more off-task overall (PMID 37039105, human observers, not a microphone). A small preschool study (4 to 5 year old boys, 10 ADHD, 10 controls, 30 minutes of free play) is reported to have found **reduced** verbal output in ADHD ([ResearchGate listing](https://www.researchgate.net/publication/315378780_Verbal_Output_Profile_in_Children_with_Attention_Deficit_Hyperactivity_Disorder); PMID not retrieved, **unverified**) |
| HI7 blurts out answers | `speech_onsets_during_instruction` (voice starting while the game is speaking) | **No evidence found** |
| HI4 cannot play quietly | `speech_ratio`, `vocal_burst_count` | **No evidence found** for a microphone measure |
| Confound control | `ambient_noise_dbfs_median`, `loud_burst_count` | Not ADHD evidence: a data-quality covariate (noise lowers VAD accuracy and distracts, effect on children not researched here) |

A search for LENA-type child-worn recorder studies in ADHD returned nothing ADHD-specific (web search 2026-10-19); existing automated vocalization work found is in preschoolers, autism and language groups (for example PMID 34592032, PMID 35249682), not ADHD. **Strength of evidence for microphone features: none to very weak.** They are exploratory context features.

**How, on-device.**

| Option | Licence (verified how) | Notes |
|---|---|---|
| **`@ricky0123/vad-web` 0.0.31** | **ISC** (npm registry field and repo LICENSE "ISC License, Copyright (c) 2022-present ricky0123") ([repo](https://github.com/ricky0123/vad)) | Runs Silero VAD through ONNX Runtime Web in the browser; callbacks deliver segments (16 kHz Float32Array); the README does not state that nothing leaves the device, so we **never use the audio callback payload and ship no upload path**; configuration doc at docs.vad.ricky0123.com not read. It ships `silero_vad_legacy`, `v5` and `v6` ONNX files; which is default is not stated on the page. Its quick start pins onnxruntime-web 1.22.0 while npm latest is 1.30.0 (MIT): **version compatibility TODO**, self-host the pinned versions |
| **Silero VAD** model | **MIT** (LICENSE "MIT License, Copyright (c) 2020-present Silero Team") ([repo](https://github.com/snakers4/silero-vad)) | About 2 MB JIT model; 8 kHz or 16 kHz; chunks of 30 ms or more; README claims under 1 ms per chunk on one CPU thread (vendor claim, desktop x86, **not measured on a tablet**). The README gives "excellent results" and a link to a quality wiki but **no AUC or children figures**; it says nothing about children's voices. **Accuracy for 6 to 12 year olds: unverified.** The training corpus is described as over 6000 languages |
| WebRTC VAD (WASM ports) | Not evaluated in this research | **Unverified**; no licence read, no accuracy figure |
| Local RMS meter in an AudioWorklet | Web standard, no library | Computes level in dBFS per 100 ms frame; keep only aggregates. Browser `autoGainControl`, `noiseSuppression` and `echoCancellation` constraints change absolute levels; propose disabling them for the level meter and checking on the device (design choice, **unverified**) |

**Hard rule from the team brief: never record or upload raw audio or video.** Implementation consequence: no `MediaRecorder`, no storing `Float32Array` chunks beyond the 30 ms working buffer, no speech-to-text, no speaker identification, no voiceprint (a voiceprint used to identify would be biometric data under GDPR Art. 4(14), section 4).

## 4. Privacy and regulation (texts quoted from the sources fetched)

**GDPR, biometric data and special categories.**
- Art. 4(14), as fetched: biometric data is "personal data resulting from specific technical processing relating to the physical" (and behavioural) characteristics of a person, which allows or confirms unique identification ([gdpr-info Art. 4](https://gdpr-info.eu/art-4-gdpr/); the page extract was truncated, read the full text before citing in a regulatory file).
- Recital 51: "The processing of photographs should not systematically be considered to be processing of special categories of personal data as they are covered by the definition of biometric data only when processed through a specific technical means allowing the unique identification or authentication of a natural person" ([Recital 51](https://gdpr-info.eu/recitals/no-51/)). The EDPB repeats this in footnote 16 of Guidelines 3/2019 ([EDPB PDF](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_201903_video_devices_en_0.pdf)).
- Consequence: head pose, face presence and voice activity computed to describe behaviour, not to identify or authenticate, are **not** biometric data in the Art. 9 sense on this reading. But they are personal data, and they are **data concerning health** (Art. 4(15): "personal data related to the physical or mental health of a natural person") the moment they feed an attention or ADHD orientation output. Art. 9(1) prohibits processing of health data unless an Art. 9(2) condition applies; (a) is "explicit consent ... for one or more specified purposes" ([Art. 9](https://gdpr-info.eu/art-9-gdpr/)). So explicit parental consent is needed for the product anyway.
- EDPB Guidelines 3/2019 concern video devices (surveillance); the data minimisation text (para 24: "adequate, relevant and limited to what is necessary", Art. 5(1)(c)) is general, but the guidelines were **not written for a consumer game camera**. The document has no hits for "children". Treat as analogy only.
- Do not generate face templates or voiceprints, do not run face recognition, do not enrol the child. Keep that in the Privacy design record.

**GDPR, children.**
- Art. 8(1): where consent is the basis for an information society service offered directly to a child, processing is lawful where the child is at least 16; below that only "if and to the extent that consent is given or authorised by the holder of parental responsibility"; Member States may lower to 13, and the controller "shall make reasonable efforts to verify" the authorisation (Art. 8(2)) ([Art. 8](https://gdpr-info.eu/art-8-gdpr/)). Our users are 6 to 12, so parental consent is required in every Member State.
- France: CNIL states Art. 45 of the Informatique et Libertés law sets 15, and under 15 requires the parent(s) jointly with the child (relayed by a search summary of CNIL pages, [CNIL recommendation 4](https://cnil.fr/fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans)); current Légifrance text not fetched (the URL tried returned 404): **verify before citing**.
- A DPIA (GDPR Art. 35) is very probably expected for a child-targeted health-screening tool with new technology; **not verified in this research, ask the DPO/legal**.

**EU AI Act.**
- Art. 5(1)(f) prohibits "the use of AI systems to infer emotions of a natural person in the areas of workplace and education institutions", **except** "where the use of the AI system is intended to be put in place or into the market for medical or safety reasons" ([Art. 5](https://artificialintelligenceact.eu/article/5/)). A home game is not a workplace; a school deployment would be an education institution. Our medical-orientation purpose may fall under the exception, but that is a legal question: **verify with counsel**. The simplest protection: **infer no emotions at all** (blendshapes off, no expression classes).
- Art. 3(39), as fetched: an emotion recognition system identifies or infers "emotions or intentions of natural persons on the basis of their biometric data" ([Art. 3](https://artificialintelligenceact.eu/article/3/)). Recital 18 says the notion "does not include physical states, such as pain or fatigue" and "does also not include the mere detection of readily apparent expressions, gestures or movements," adding "unless they are used for identifying or inferring emotions" ([Recital 18](https://artificialintelligenceact.eu/recital/18/)). Head movement and voice activity counts are movements and sounds, not inferred emotions, provided we never call them "frustration", "boredom" or "anger".
- Art. 5(1)(g) covers biometric categorisation inferring race, political opinions, trade union membership, religious or philosophical beliefs, sex life or sexual orientation, with no workplace/education limiter in the text fetched; we do none of that.
- Art. 50(3): deployers of emotion recognition or biometric categorisation systems "shall inform the natural persons exposed thereto" ([Art. 50](https://artificialintelligenceact.eu/article/50/)). Not triggered if no emotion inference, but the consent text should describe the camera anyway.
- The AI Act high-risk status of an ADHD scoring model was already flagged in `04` section 6 (Article 6(1)); camera and microphone features do not remove that, and **do not add scoring**.

**Data minimisation design (recommended).** Frames and audio are never stored or sent; only the aggregate numbers in section 6 leave the device; the `child_id` stays pseudonymous as in v1; processing stops at the end of each mini-game (camera track stopped, indicator off).

## 5. Child-safe permission experience (proposal)

1. **Parent screen first** (adult-facing, before the child sees the game): plain-language explanation of what is measured, that no picture or sound is saved or sent, that it is optional, and what the game does without it. Two **separate** toggles, camera and microphone, both off by default (design choice).
2. Permission is requested **by the parent**, in a user gesture, from the top-level document, once, before the first mission; then reused for the session (iOS traps above).
3. The browser shows the in-use indicator by itself (MDN); do not hide it, and add an in-game neutral icon the parent can tap to stop sensing at any time. No self-view of the child's face on screen (design choice: reduces self-consciousness and avoids a child staring at themselves).
4. **Denied, dismissed, not found, ignored:** the game must run identically. The promise can stay pending (MDN), so start the game after a 3 second timeout (design choice) and mark `permission: "no_response"`.
5. Stop the tracks on page hide, on pause and at the end.
6. Withdrawal: parent can delete derived data in the parent app (Supabase side, already in the spec scope; exact FR number **TODO** from `docs/02-specification-cahier-des-charges.md`).

## 6. Proposed design

### 6.1 Which signals in which mini-game (names from `04` section 5)

| Mission | Camera features | Microphone features | Why here (validity note) |
|---|---|---|---|
| 0 Wake the fireflies (30 s calibration) | Per-child baseline of head yaw/pitch at rest, baseline head motion, light check | Ambient noise level with the child silent (ask the child to "stay quiet" is not required; just record the level) | A per-child baseline is needed before any threshold is applied: no norms exist for these features (TODO) |
| 1 Lantern Watch (go/no-go) | `head_off_screen` flag at each stimulus onset (joined to omissions in the parent-side scoring as a *data-quality covariate*), face presence over time, head motion RMS per third of the block | `speech_ratio`, noise | Distinguishes "did not see it" from "did not respond"; vigilance decrement in presence would be an IA2/IA4 context, weak |
| 2 Storm Watch (distractor block) | Off-screen head fraction in block B vs block A | Noise events during thunder (confound) | IA8 context (distractor cost), moderate task-level evidence in `04` but none for camera |
| 3 Star Path | Head motion RMS during encoding vs baseline | none | Parallel to the device-motion HI1 idea in `04` (Rapport WM-load design, PMID 19083090) |
| 4 Bridge Wait | none | `speech_onsets_during_instruction` while Luma talks (parent prompts are a confound) | HI7/HI9 context; no evidence found for the measure |
| 5 Treasure Choice | none | none | Keep sensing minimal |
| all | `face_absent_*` (leaves frame = proxy for HI2 "leaves seat", **no evidence found**), `multiple_faces_ms` (an adult helping) | `loud_burst_count` | Context and quality only |

### 6.2 Feature list

Everything below is computed on-device. All thresholds are **design choice, TODO calibrate** after the calibration mission.

| Feature | Unit | How computed |
|---|---|---|
| `sampling_hz` | Hz | Actual processed frames per second, measured, not nominal (target 10, design choice) |
| `frames_total`, `frames_face` | count | Frames processed, frames with exactly one face detected |
| `face_present_ratio` | 0 to 1 | `frames_face / frames_total` |
| `face_absent_episodes` | count | Runs of at least 2000 ms (design choice) without a face |
| `face_absent_ms_total` | ms | Sum of those runs |
| `multiple_faces_ms` | ms | Time with 2 or more faces (needs `numFaces` of 2; note smoothing applies only at `numFaces` = 1 per the Google doc) |
| `head_pose_rest` | degrees | Median yaw and pitch from the facial transformation matrix during mission 0 |
| `head_off_screen_ratio` | 0 to 1 | Share of face-present frames with yaw or pitch deviation from `head_pose_rest` above a threshold (design choice, starting guess to be set from calibration) |
| `head_motion_rms_deg_s` | degrees per second | RMS of the frame-to-frame angular change of yaw, pitch, roll (matrix), divided by the time step, per mini-game |
| `face_center_motion_rms` | image widths per second | RMS velocity of the normalised face-box centre (a seat-shift proxy, **no evidence found**) |
| `low_light_flag` | boolean | Mean luminance of a downscaled frame below a threshold (design choice); frames are discarded after the number is taken |
| `trial_head_off` | boolean per trial | `head_off_screen` at stimulus onset plus or minus 300 ms (design choice) |
| `speech_ms_total`, `n_speech_segments`, `speech_ratio` | ms, count, 0 to 1 | From VAD start/end callbacks (timestamps only; the audio payload is discarded) |
| `speech_onsets_during_instruction` | count | VAD segment starts that fall inside game-narration windows (known from game events) |
| `ambient_noise_dbfs_median` | dBFS | Median RMS level of non-speech frames |
| `loud_burst_count` | count | RMS frames above threshold relative to `ambient_noise_dbfs_median` (design choice) |

### 6.3 Optional contract extension (does not change `SessionMetrics` v1)

Both blocks are optional; absent block means "not requested". `schema_version` stays "1.0"; the zod schema allows the keys to be missing. Proposed as additive, for the interface owner (interfaces freeze at hour 6 per `03` section 11).

```json
"camera": {
  "feature_set_version": "0.1.0",
  "permission": "granted | denied | no_response | unavailable | not_requested",
  "library": { "name": "@mediapipe/tasks-vision", "version": "1.1.1", "delegate": "CPU | GPU" },
  "sampling_hz": 0,
  "baseline": { "yaw_deg": 0, "pitch_deg": 0, "n_frames": 0 },
  "session": { "frames_total": 0, "frames_face": 0, "face_present_ratio": 0,
               "face_absent_episodes": 0, "face_absent_ms_total": 0, "multiple_faces_ms": 0,
               "head_off_screen_ratio": 0, "head_motion_rms_deg_s": 0, "low_light_flag": false },
  "by_minigame": { "lantern_watch": { "head_off_screen_ratio": 0, "head_motion_rms_deg_s": 0, "face_present_ratio": 0 } },
  "trial_flags": [ { "i": 0, "head_off": false } ]
},
"microphone": {
  "feature_set_version": "0.1.0",
  "permission": "granted | denied | no_response | unavailable | not_requested",
  "library": { "name": "@ricky0123/vad-web", "version": "0.0.31", "model": "silero_vad_v5 | v6 | legacy" },
  "session": { "speech_ms_total": 0, "n_speech_segments": 0, "speech_ratio": 0,
               "speech_onsets_during_instruction": 0, "ambient_noise_dbfs_median": 0, "loud_burst_count": 0 },
  "by_minigame": { "bridge_wait": { "speech_onsets_during_instruction": 0, "speech_ms_total": 0 } }
}
```

Units: times in ms (session-relative, same clock as v1), angles in degrees, ratios 0 to 1, noise in dBFS. **No field may hold an image, a landmark array, an audio sample or a transcript** (add a zod `.strict()` and a size cap on the two blocks, and a unit test that a payload with unknown keys is rejected).

**Fallback when permission is denied.** The game is unchanged; `camera.permission` or `microphone.permission` records the reason; `ScoreResult` ignores both blocks in the hackathon build. Quality note: missing blocks are not a data-quality failure.

**Scoring status.** Recommended: **do not use camera or microphone features in `ScoreResult.band`.** Use them only (a) as data-quality covariates and (b) as stored research features for the later clinical investigation. Reason: weak evidence (section 2 and 3), no norms, and every extra input to the score pushes the regulatory classification and AI Act analysis the wrong way. The team may overrule.

### 6.4 One-day implementation plan, one developer (about 8 hours)

1. **Hour 0 to 1, spike.** Install `@mediapipe/tasks-vision` and `@ricky0123/vad-web` in `packages/game`; self-host WASM, `.task` and `.onnx` files under `public/`; confirm there is no third-party request in the network tab (acceptance: zero requests to jsDelivr/Google storage).
2. **Hour 1 to 3, camera worker.** Web Worker running `FaceLandmarker` in VIDEO mode at 10 Hz, `outputFaceBlendshapes: false`, `outputFacialTransformationMatrixes: true`, `numFaces: 2`; post only small numeric samples to the main thread; discard each frame immediately. Log real `sampling_hz`.
3. **Hour 3 to 4, features.** Pure functions (unit-tested with synthetic sequences) for presence ratio, absent episodes, head-off ratio, head motion RMS, trial flags.
4. **Hour 4 to 5, microphone.** VAD start/end timestamps only; AudioWorklet RMS meter; the two aggregate features; confirm the audio callback payload is never stored.
5. **Hour 5 to 6, consent and permission UX.** Parent screen with two toggles, single permission request, denied/no-response paths, stop tracks on hide and on end.
6. **Hour 6 to 7, contract.** Add optional `camera`/`microphone` to the zod schema (strict), reject unknown keys, round-trip test, Supabase JSON column unchanged.
7. **Hour 7 to 8, real device.** Test on the demo tablet and on iOS Safari: permission denied, ignored, granted; page hidden; second face; low light; measure CPU and frame rate; record numbers in this file.
Tests first: write the schema test and the feature-function tests before the code, see them fail, then pass.

## 7. Open points for the team

- Do we keep camera and microphone out of the score for the hackathon (recommended)?
- Licence of the `face_landmarker.task` model asset and the Silero ONNX files as bundled: verify before copying into the repo (TODO).
- Legal review: GDPR Art. 35 DPIA, French Art. 45 current text, AI Act Art. 5(1)(f) medical exception for a home product.
- Which feature thresholds to use after calibration (no published norms found).
- Whether to try MediaPipe Pose: only one child study used it, with a researcher-worn camera.

## References

PubMed: 38214185, 34052459, 36280758, 41924709, 32971358, 39768028, 32100383, 35038458, 40246562, 37039105, 19083090, 37004919 (cited from `04`), 34592032, 35249682. Retrieved via PubMed tools and NCBI E-utilities 2026-10-19; abstracts only. PMID 36280758 and the preschool verbal-output study were read as search snippets or listings only.

Standards and law as linked in sections 1 to 5: GDPR Art. 4, 8, 9, Recital 51; EDPB Guidelines 3/2019; EU AI Act Art. 3, 5, 50, Recital 18; MDN getUserMedia; CNIL recommendation 4.
