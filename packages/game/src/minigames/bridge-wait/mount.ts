// Browser only. three.js touches the DOM, so the 3D scene module is imported inside mountBridgeWait and
// never at module load: pages that import @adhdcheck/game for other games do not pull three.
import type { BridgeWaitResult } from "./types";

export {
  CROW_DELAY_MS,
  GO_WINDOW_MS,
  ITI_MS,
  NARRATION_MS,
  RESULT_VERSION,
} from "./runner";

export interface BridgeWaitOptions {
  seed?: number;
  /** Number of scored trials. Default 24 (research/04). Other values are for dev runs only. */
  trials?: number;
  stopSignal?: boolean;
  /** URL prefix of the self-hosted assets (audio). Default "/games/bridge-wait". */
  assetBase?: string;
  onComplete?: (result: BridgeWaitResult) => void;
}
export interface BridgeWaitHandle {
  destroy: () => void;
}

export async function mountBridgeWait(parent: HTMLElement, opts: BridgeWaitOptions = {}): Promise<BridgeWaitHandle> {
  const { createBridgeWaitScene } = await import("./scene");
  return createBridgeWaitScene(parent, {
    seed: opts.seed ?? Date.now() & 0x7fffffff,
    trials: opts.trials,
    stopSignal: opts.stopSignal ?? false,
    assetBase: opts.assetBase ?? "/games/bridge-wait",
    onComplete: opts.onComplete,
  });
}
