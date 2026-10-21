import { describe, expect, it } from "vitest";
import { insideRect, isPrimaryPointer } from "./pointer";

describe("isPrimaryPointer", () => {
  it("accepts the primary pointer and rejects a second finger", () => {
    expect(isPrimaryPointer({ isPrimary: true })).toBe(true);
    expect(isPrimaryPointer({ isPrimary: false })).toBe(false);
  });
});

describe("insideRect", () => {
  const r = { left: 10, top: 20, right: 110, bottom: 70 };
  it("is true inside and on the edge, false outside", () => {
    expect(insideRect(60, 40, r)).toBe(true);
    expect(insideRect(10, 20, r)).toBe(true);
    expect(insideRect(9, 40, r)).toBe(false);
    expect(insideRect(60, 71, r)).toBe(false);
  });
});
