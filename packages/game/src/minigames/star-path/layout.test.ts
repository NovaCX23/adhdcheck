import { describe, expect, it } from "vitest";
import { pickStar, starLayout } from "./layout";

describe("starLayout", () => {
  it("places nine stars inside the unit square, one per cell of a 3 x 3 grid", () => {
    const pts = starLayout();
    expect(pts).toHaveLength(9);
    for (const [k, p] of pts.entries()) {
      expect(p.u).toBeGreaterThan(0);
      expect(p.u).toBeLessThan(1);
      expect(Math.floor(p.u * 3) + 3 * Math.floor(p.v * 3)).toBe(k);
    }
  });

  it("keeps stars apart: at least 0.2 of the field between any two", () => {
    const pts = starLayout();
    for (let a = 0; a < pts.length; a++)
      for (let b = a + 1; b < pts.length; b++) {
        const pa = pts[a] as { u: number; v: number };
        const pb = pts[b] as { u: number; v: number };
        expect(Math.max(Math.abs(pa.u - pb.u), Math.abs(pa.v - pb.v))).toBeGreaterThanOrEqual(0.2);
      }
  });

  it("is the same every time, so every child sees the same sky", () => {
    expect(starLayout()).toEqual(starLayout());
  });
});

describe("pickStar", () => {
  const screen = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 100, y: 300 },
  ];

  it("returns the star under the finger", () => {
    expect(pickStar(screen, 104, 96, 50)).toBe(0);
    expect(pickStar(screen, 190, 110, 50)).toBe(1);
  });

  it("returns the nearest star when two are within reach", () => {
    expect(pickStar(screen, 160, 100, 70)).toBe(1);
  });

  it("returns null for a tap on no star", () => {
    expect(pickStar(screen, 400, 400, 50)).toBeNull();
    expect(pickStar(screen, 100, 160, 50)).toBeNull();
  });
});
