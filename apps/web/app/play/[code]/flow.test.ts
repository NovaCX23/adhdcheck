import { describe, expect, it } from "vitest";
import { ScoreResultSchema, type SessionMetrics } from "@adhdcheck/contracts";
import { validScoreResult } from "../../../../../packages/contracts/src/fixtures/score-result.valid";
import { validSessionMetrics } from "../../../../../packages/contracts/src/fixtures/session-metrics.valid";
import type { UploadResult } from "../../../lib/play-client";
import { runPlayFlow, type FlowDeps, type Screen } from "./flow";

const CHILD = "7d9e0a1b-2c3d-4e5f-8a9b-0c1d2e3f4a5b";
const metrics = validSessionMetrics as SessionMetrics;
const saved: UploadResult = { status: "saved", score: ScoreResultSchema.parse(validScoreResult) };

function setup(over: Partial<FlowDeps> & { uploads?: UploadResult[] } = {}) {
  const screens: Screen["kind"][] = [];
  const calls = { upload: 0, play: 0, network: 0 };
  const uploads = over.uploads ?? [saved];
  const deps: FlowDeps = {
    resolve: async () => ({ child_id: CHILD }),
    play: async (childId) => {
      calls.play += 1;
      expect(childId).toBe(CHILD);
      return metrics;
    },
    waitForStart: async () => {},
    upload: async (code, m) => {
      expect(code).toBe("code-1");
      expect(m).toBe(metrics);
      return uploads[Math.min(calls.upload++, uploads.length - 1)] as UploadResult;
    },
    waitForNetwork: async () => {
      calls.network += 1;
    },
    show: (s) => screens.push(s.kind),
    ...over,
  };
  return { deps, screens, calls };
}

describe("runPlayFlow", () => {
  it("checks the link, waits for the start tap, plays, uploads and ends on a calm screen", async () => {
    const { deps, screens, calls } = setup();
    await runPlayFlow("code-1", deps);
    expect(screens).toEqual(["checking", "ready", "playing", "saving", "done"]);
    expect(calls.upload).toBe(1);
  });

  it("shows the neutral invalid screen and records nothing for an unknown or used link", async () => {
    const { deps, screens, calls } = setup({ resolve: async () => null });
    await runPlayFlow("code-1", deps);
    expect(screens).toEqual(["checking", "invalid"]);
    expect(calls.play + calls.upload).toBe(0);
  });

  it("treats a lookup that throws (no network) like an invalid link", async () => {
    const { deps, screens } = setup({ resolve: async () => Promise.reject(new Error("offline")) });
    await runPlayFlow("code-1", deps);
    expect(screens).toEqual(["checking", "invalid"]);
  });

  it("says the game is not ready when no session game exists, without playing or uploading", async () => {
    const { deps, screens, calls } = setup({ play: null });
    await runPlayFlow("code-1", deps);
    expect(screens).toEqual(["checking", "unavailable"]);
    expect(calls.upload).toBe(0);
  });

  it("keeps the session and uploads it again once the network is back (FR-12)", async () => {
    const { deps, screens, calls } = setup({ uploads: [{ status: "failed" }, { status: "failed" }, saved] });
    await runPlayFlow("code-1", deps);
    expect(screens).toEqual(["checking", "ready", "playing", "saving", "offline", "saving", "offline", "saving", "done"]);
    expect(calls.upload).toBe(3);
    expect(calls.network).toBe(2);
    expect(calls.play).toBe(1);
  });

  it("ends calmly without retrying when the server refuses the session", async () => {
    const { deps, screens, calls } = setup({ uploads: [{ status: "refused", error: "invalid_play_link" }] });
    await runPlayFlow("code-1", deps);
    expect(screens.at(-1)).toBe("done");
    expect(calls.upload).toBe(1);
  });
});
