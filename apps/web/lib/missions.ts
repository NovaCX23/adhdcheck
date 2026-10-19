// Mission catalogue (FR-37): general wellbeing activities a parent may choose for a child.
// Missions are never chosen from a score (NFR-52); nothing here reads a ScoreResult.
// The database stores only `key` (missions.mission_key). Catalogue content is TODO in docs/02 FR-37:
// the titles below are placeholders until the texts owner supplies them (shared-texts-claims-pitch.md).
// Keep the keys: the demo seed (seed_demo) uses wellbeing_01 to wellbeing_06.

export type Mission = { key: string; title: string };

export const MISSIONS: readonly Mission[] = [
  { key: "wellbeing_01", title: "TODO (texts owner): mission 1" },
  { key: "wellbeing_02", title: "TODO (texts owner): mission 2" },
  { key: "wellbeing_03", title: "TODO (texts owner): mission 3" },
  { key: "wellbeing_04", title: "TODO (texts owner): mission 4" },
  { key: "wellbeing_05", title: "TODO (texts owner): mission 5" },
  { key: "wellbeing_06", title: "TODO (texts owner): mission 6" },
];

export function isMissionKey(key: unknown): key is string {
  return typeof key === "string" && MISSIONS.some((m) => m.key === key);
}
