import { describe, expect, it } from "vitest";
import { MISSIONS, isMissionKey } from "./missions";

describe("mission catalogue (FR-37)", () => {
  it("has unique keys that fit the database format", () => {
    const keys = MISSIONS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z0-9_]{1,64}$/);
  });

  it("contains the six keys the demo seed uses", () => {
    for (let i = 1; i <= 6; i++) expect(isMissionKey(`wellbeing_0${i}`)).toBe(true);
    expect(isMissionKey("unknown_key")).toBe(false);
  });
});
