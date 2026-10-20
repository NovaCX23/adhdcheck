// Browser only. three.js touches the DOM, so the 3D scene module is imported inside mountLanternWatch and never
// at module load: pages that import @adhdcheck/game for other games do not pull three.
import type { SessionMetrics } from "@adhdcheck/contracts";
import { ANTICIPATION_MS, DEFAULT_TASK, type TaskConfig } from "./logic";

export interface LanternWatchOptions {
  /** Pseudonymous child id (UUID) written into SessionMetrics.child_id (NFR-02). */
  childId: string;
  seed?: number;
  /** Dev runs only: fewer blocks or trials per block. The task block of the payload always matches what ran. */
  blocks?: number;
  trialsPerBlock?: number;
  /** URL prefix of the self-hosted sound samples. Default "/games/bridge-wait" (shared with Bridge Wait). */
  assetBase?: string;
  onComplete?: (metrics: SessionMetrics) => void;
  /** The payload could not be built (should not happen: it means a contract violation). */
  onError?: (err: unknown) => void;
}
export interface LanternWatchHandle {
  destroy: () => void;
}

export function taskFor(opts: Pick<LanternWatchOptions, "blocks" | "trialsPerBlock">): TaskConfig {
  const pos = (v: number | undefined, d: number) => (v !== undefined && Number.isInteger(v) && v > 0 ? v : d);
  return { ...DEFAULT_TASK, blocks: pos(opts.blocks, DEFAULT_TASK.blocks), trialsPerBlock: pos(opts.trialsPerBlock, DEFAULT_TASK.trialsPerBlock) };
}

export async function mountLanternWatch(parent: HTMLElement, opts: LanternWatchOptions): Promise<LanternWatchHandle> {
  const { createLanternWatchScene } = await import("./scene");
  return createLanternWatchScene(parent, {
    seed: opts.seed ?? Date.now() & 0x7fffffff,
    task: taskFor(opts),
    childId: opts.childId,
    anticipationMs: ANTICIPATION_MS,
    assetBase: opts.assetBase ?? "/games/bridge-wait",
    onComplete: opts.onComplete,
    onError: opts.onError,
  });
}
