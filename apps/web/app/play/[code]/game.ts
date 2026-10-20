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
//
// destroy() stops the game (render loop, WebGL, audio, listeners) and is what the page calls when it is left
// (R3-L1); after it the promise never settles, so nothing is uploaded.
export type SessionGameRun = { promise: Promise<SessionMetrics>; destroy(): void };
export type SessionGame = (el: HTMLElement, childId: string, consent: Consent) => SessionGameRun;

type Handle = { destroy(): void };
type MountOptions = {
  childId: string;
  autoStart: boolean;
  onComplete: (metrics: SessionMetrics) => void;
  onError: () => void;
};
export type MountLanternWatch = (el: HTMLElement, opts: MountOptions) => Promise<Handle>;

/**
 * Lantern Watch. `consent` is accepted but no sensor is started: packages/sensors has no capture yet and
 * SessionMetrics v1 has no camera or microphone block (PC-04 proposed), so the camera and microphone are never requested (FR-70).
 * If the 3D game cannot start (no WebGL), the calm "ask your parent" sentence replaces it and the promise never
 * resolves, so nothing is uploaded. The play page already took the child's start tap, so the game starts by itself.
 */
export function createSessionGame(loadMount: () => Promise<MountLanternWatch>): SessionGame {
  return (el, childId, consent) => {
    void consent;
    let handle: Handle | undefined;
    let cancel: (() => void) | undefined;
    let destroyed = false;
    const stop = () => {
      destroyed = true;
      cancel?.();
      handle?.destroy();
      handle = undefined;
    };
    const promise = new Promise<SessionMetrics>((resolve) => {
      const fail = () => {
        handle?.destroy();
        handle = undefined;
        el.replaceChildren();
        el.textContent = PLAY_STRINGS.unavailable;
      };
      // The module is loaded here, in the browser, so three.js never runs during server rendering.
      const mounting = loadMount().then((mount) =>
        mount(el, {
          childId,
          autoStart: true,
          onComplete: (metrics) => {
            handle?.destroy();
            handle = undefined;
            if (!destroyed) resolve(metrics);
          },
          onError: fail,
        }),
      );
      cancel = mountWithFallback(el, mounting, PLAY_STRINGS.unavailable, (h) => {
        handle = h;
      });
    });
    return { promise, destroy: stop };
  };
}

export const sessionGame: SessionGame | null = createSessionGame(() => import("@adhdcheck/game").then((m) => m.mountLanternWatch));
