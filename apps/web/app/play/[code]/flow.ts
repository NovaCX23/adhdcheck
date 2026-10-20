import type { SessionMetrics } from "@adhdcheck/contracts";
import type { UploadResult } from "../../../lib/play-client";

// The play page's sequence (FR-01, FR-11, FR-12, FR-15), kept apart from React so it can be tested:
// check the link, wait for the start tap, play, upload, then a calm end screen. The child never sees
// the score: the upload result only decides which neutral screen comes next.

export type Screen =
  | { kind: "checking" }
  | { kind: "invalid" } // unknown, used or expired link: "ask your parent", nothing recorded
  | { kind: "unavailable" } // no game that records a session is built yet
  | { kind: "ready" }
  | { kind: "playing" }
  | { kind: "saving" }
  | { kind: "offline" } // waiting for the network, the session is kept in memory
  | { kind: "done" };

export type FlowDeps = {
  resolve(code: string): Promise<{ child_id: string } | null>;
  /** null when no session game exists yet. */
  play: ((childId: string) => Promise<SessionMetrics>) | null;
  waitForStart(): Promise<void>;
  upload(code: string, metrics: SessionMetrics): Promise<UploadResult>;
  waitForNetwork(): Promise<void>;
  show(screen: Screen): void;
};

export async function runPlayFlow(code: string, deps: FlowDeps): Promise<void> {
  deps.show({ kind: "checking" });
  const link = await deps.resolve(code).catch(() => null);
  if (!link) return deps.show({ kind: "invalid" });
  if (!deps.play) return deps.show({ kind: "unavailable" });

  deps.show({ kind: "ready" });
  await deps.waitForStart();
  deps.show({ kind: "playing" });
  const metrics = await deps.play(link.child_id);

  deps.show({ kind: "saving" });
  for (;;) {
    const result = await deps.upload(code, metrics);
    // A refused upload (link expired during the game) still ends calmly for the child; the parent
    // starts a new session from their screen.
    if (result.status !== "failed") return deps.show({ kind: "done" });
    deps.show({ kind: "offline" });
    await deps.waitForNetwork();
    deps.show({ kind: "saving" });
  }
}
