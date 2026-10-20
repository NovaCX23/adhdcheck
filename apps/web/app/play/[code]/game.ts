import type { SessionMetrics } from "@adhdcheck/contracts";

// The game whose session is uploaded and scored: Lantern Watch, the go/no-go task (Person 1, FR-04 to
// FR-10). It mounts in `el` and resolves with SessionMetrics v1 when the child finishes. Mini-games such as
// Bridge Wait or Star Path cannot fill this slot: their results are not SessionMetrics (the `minigames`
// block is still a proposal, docs/02 section 10.3).
export type SessionGame = (el: HTMLElement, childId: string) => Promise<SessionMetrics>;

// null until Lantern Watch exists: the page then shows the "not ready" screen and records nothing.
export const sessionGame: SessionGame | null = null;
