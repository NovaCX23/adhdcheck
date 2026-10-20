import { describe, expect, it } from "vitest";
import { isPrimaryPointer } from "./pointer";

describe("isPrimaryPointer", () => {
  it("accepts the primary pointer and rejects a second finger", () => {
    expect(isPrimaryPointer({ isPrimary: true })).toBe(true);
    expect(isPrimaryPointer({ isPrimary: false })).toBe(false);
  });
});
