import type { CSSProperties } from "react";

// Fixed positions (no Math.random) so server and client render the same markup.
const FLIES = [
  [8, 18, 0, 9, 3.1], [18, 62, 1.2, 11, 4.2], [27, 30, 2.4, 8, 3.6], [36, 78, 0.6, 10, 2.9],
  [44, 12, 1.8, 12, 3.8], [52, 50, 3, 9, 4.4], [61, 24, 0.3, 11, 3.2], [69, 70, 2.1, 8, 3.9],
  [77, 38, 1.5, 10, 2.8], [85, 14, 2.7, 12, 4.1], [91, 58, 0.9, 9, 3.4], [13, 88, 3.3, 11, 3.7],
  [57, 90, 1.1, 10, 4.3], [95, 84, 2.2, 8, 3],
] as const;

export function Fireflies({ count = FLIES.length }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FLIES.slice(0, count).map(([x, y, delay, d, b], i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              "--delay": `${delay}s`,
              "--d": `${d}s`,
              "--b": `${b}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
