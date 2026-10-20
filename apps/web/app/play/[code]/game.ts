import type { SessionMetrics } from "@adhdcheck/contracts";
import type { Consent } from "@/lib/play-client";
import { mountWithFallback } from "../mountGuard";
import { PLAY_STRINGS } from "./strings";

// The game whose session is uploaded and scored: Lantern Watch, the go/no-go task (Person 1, FR-04 to
// FR-10), with its calibration block "Wake the fireflies" (FR-03). It mounts in `el` and resolves with
// SessionMetrics v1 when the child finishes. FR-70: it may ask for the camera or microphone (through
// packages/sensors, FR-71/72) only when that flag of `consent` is true; both are false unless the parent
// switched them on before creating the link. Mini-games such as Bridge Wait or Star Path cannot fill this
// slot: their results are not SessionMetrics (the `minigames` block is still a proposal, docs/02 section 10.3).
export type SessionGame = (el: HTMLElement, childId: string, consent: Consent) => Promise<SessionMetrics>;

/**
 * Lantern Watch. `consent` is accepted but no sensor is started: packages/sensors has no capture yet and
 * SessionMetrics v1 has no camera or microphone block (PC-04 proposed), so the camera and microphone are never requested (FR-70).
 * If the 3D game cannot start (no WebGL), the calm "ask your parent" sentence replaces it and the promise never
 * resolves, so nothing is uploaded.
 */
export const sessionGame: SessionGame | null = (el, childId, consent) => {
  void consent;
  return new Promise<SessionMetrics>((resolve) => {
    let handle: { destroy(): void } | undefined;
    const fail = () => {
      handle?.destroy();
      handle = undefined;
      el.replaceChildren();
      el.textContent = PLAY_STRINGS.unavailable;
    };
    // The module is loaded here, in the browser, so three.js never runs during server rendering.
    const mounting = import("@adhdcheck/game").then(({ mountLanternWatch }) =>
      mountLanternWatch(el, {
        childId,
        onComplete: (metrics) => {
          handle?.destroy();
          handle = undefined;
          resolve(metrics);
        },
        onError: fail,
      }),
    );
    mountWithFallback(el, mounting, PLAY_STRINGS.unavailable, (h) => {
      handle = h;
    });
  });
};
