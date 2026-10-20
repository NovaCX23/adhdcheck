// Browser only. three.js touches the DOM, so the 3D scene module is imported inside mountStarPath and never at
// module load: pages that import @adhdcheck/game for other games do not pull three.
import type { StarPathResult } from "./types";

export { FEEDBACK_MS, LEAD_MS, RECALL_TIMEOUT_MS, RESULT_VERSION, STAR_ON_MS } from "./runner";

export interface StarPathOptions {
  seed?: number;
  /** Longest sequence. Default: all nine stars. Other values are for dev runs only. */
  maxLength?: number;
  /** URL prefix of the self-hosted sound samples. Default "/games/bridge-wait" (shared with Bridge Wait). */
  assetBase?: string;
  onComplete?: (result: StarPathResult) => void;
}
export interface StarPathHandle {
  destroy: () => void;
}

export async function mountStarPath(parent: HTMLElement, opts: StarPathOptions = {}): Promise<StarPathHandle> {
  const { createStarPathScene } = await import("./scene");
  return createStarPathScene(parent, {
    seed: opts.seed ?? Date.now() & 0x7fffffff,
    maxLength: opts.maxLength,
    assetBase: opts.assetBase ?? "/games/bridge-wait",
    onComplete: opts.onComplete,
  });
}
