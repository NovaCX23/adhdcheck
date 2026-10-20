import { mulberry32 } from "../bridge-wait/logic";

// Where the stars sit, as fractions of the star field (u left to right, v bottom to top): one star per cell of
// a 3 x 3 grid, jittered with a fixed seed so the sky looks scattered but every child sees the same one, and
// no two stars come closer than a fifth of the field (big, separate touch targets on a phone too).
const JITTER = 0.06;
/** Each row shifts sideways a little, so the columns do not line up into a grid. */
const ROW_SHIFT = [-0.05, 0.06, -0.02];

export function starLayout(): { u: number; v: number }[] {
  const rnd = mulberry32(61);
  const pts: { u: number; v: number }[] = [];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      pts.push({
        u: (col + 0.5) / 3 + (ROW_SHIFT[row] as number) + (rnd() * 2 - 1) * JITTER,
        v: (row + 0.5) / 3 + (rnd() * 2 - 1) * JITTER,
      });
    }
  return pts;
}

/** Index of the star nearest to (x, y) within `radius` screen pixels, or null. */
export function pickStar(screen: { x: number; y: number }[], x: number, y: number, radius: number): number | null {
  let best: number | null = null;
  let bestD = radius;
  for (const [k, p] of screen.entries()) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= bestD) {
      best = k;
      bestD = d;
    }
  }
  return best;
}
