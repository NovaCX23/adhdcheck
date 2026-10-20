// Browser only: the view touches the DOM, so it is imported inside mountRoutePlanner and never at module load.
import type { RoutePlannerResult } from "./types";

export { BETWEEN_MS, IDLE_TIMEOUT_MS, PRACTICE_INTRO_MS, RESULT_VERSION } from "./runner";

export interface RoutePlannerOptions {
  onComplete?: (result: RoutePlannerResult) => void;
}
export interface RoutePlannerHandle {
  destroy: () => void;
}

export async function mountRoutePlanner(parent: HTMLElement, opts: RoutePlannerOptions = {}): Promise<RoutePlannerHandle> {
  const { createRoutePlannerView } = await import("./view");
  return createRoutePlannerView(parent, { onComplete: opts.onComplete });
}
