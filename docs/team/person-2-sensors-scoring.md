# Person 2: Sensors and scoring

You own the data. The contracts between the game, the backend and the dashboard. The camera and microphone features computed on the device. The scoring rules that turn a session into one of the two results.

## Read first (30 minutes)

1. `docs/04-work-split.md`: the team, the decisions, the milestones.
2. `docs/02-specification-cahier-des-charges.md`, section 7 (contracts `SessionMetrics` v1 and `ScoreResult` v1), section 4.2 (scoring), section 4.1c (camera and microphone), section 10.3 (proposed contract changes PC-01 to PC-04).
3. `research/03-tech-stack.md`, section 4 (scoring) and section 11 (contracts).
4. `research/06-camera-microphone-acquisition.md`, section 6 (design, features, the 8-hour plan).
5. `research/04-game-design-symptom-mapping.md`, section 7 (metric code).

## You own

- Folders: `packages/contracts`, `packages/scoring`, `packages/sensors`.
- Requirements: FR-09, FR-10, FR-20 to FR-26, FR-70 to FR-74.

## Build order

| Step | Task | Done when |
|---|---|---|
| 1 | `packages/contracts`: `SessionMetrics` v1 and `ScoreResult` v1, copied from `docs/02` section 7 (copy, never retype). A valid and an invalid test fixture. | Merged by H+6 (milestone M1). The team agrees on PC-01 to PC-04 before M1, or they wait. |
| 2 | Scoring: server-side indicators (reaction-time variability, omissions, commissions, drift across blocks). Thresholds in `thresholds.v0.json` with `validated: false`. | The same session always gives the same result (deterministic, versioned) |
| 3 | Result bands: "A professional assessment is recommended" or "No specific follow-up indicated by this activity", plus a "not enough data, play again" state | Unit tests cover all three |
| 4 | Camera probe: MediaPipe Face Landmarker (Apache-2.0), model and WASM self-hosted, blendshapes off | Face present or absent prints on the demo tablet; no third-party request in the network log |
| 5 | Microphone: vad-web with Silero VAD, plus a level meter. No audio kept, no transcription. | Speaking during an instruction counts as an onset |
| 6 | `startSensors()` returns aggregates only (counts, ratios, durations) for Person 1 | The payload validator rejects any landmark array, image or audio |

## Rules for you

- Never compute a probability or a severity. Two results plus "not enough data", nothing else.
- The score never picks a mission (decision D-02).
- Camera and microphone signals do not feed the score (proposal, the team confirms).
- Threshold values are illustrative: no child norms exist for this task. Write that in the file.
- Test first on the demo tablet: MediaPipe on iOS Safari is not verified.

## You depend on

- Person 1: the trial data shape in practice.
- Person 3: where the scorer runs (the API route).
- Person 4: the final result wording.
