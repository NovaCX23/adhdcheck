// Browser only. three.js touches the DOM, so the 3D scene module is imported inside mountTreasureChoice and never
// at module load: pages that import @adhdcheck/game for other games do not pull three.
import type { TreasureChoiceResult } from "./types";

export { BETWEEN_MS, CHEST_MS, PRACTICE_INTRO_MS, RESULT_VERSION } from "./runner";

export interface TreasureChoiceOptions {
  seed?: number;
  /** Number of scored choices. Default 10 (research/04). Other values are for dev runs only. */
  choices?: number;
  /** URL prefix of the self-hosted sound samples. Default "/games/bridge-wait" (shared with Bridge Wait, as Star Path does). */
  assetBase?: string;
  onComplete?: (result: TreasureChoiceResult) => void;
}
export interface TreasureChoiceHandle {
  destroy: () => void;
}

export async function mountTreasureChoice(parent: HTMLElement, opts: TreasureChoiceOptions = {}): Promise<TreasureChoiceHandle> {
  const { createTreasureChoiceScene } = await import("./scene");
  return createTreasureChoiceScene(parent, {
    seed: opts.seed ?? Date.now() & 0x7fffffff,
    choices: opts.choices,
    assetBase: opts.assetBase ?? "/games/bridge-wait",
    onComplete: opts.onComplete,
  });
}
