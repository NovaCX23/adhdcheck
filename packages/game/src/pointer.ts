// Only the primary pointer counts as a response: a second finger or a palm would otherwise inflate tap counts.
export function isPrimaryPointer(e: { isPrimary: boolean }): boolean {
  return e.isPrimary;
}

/** True when the point is inside the rectangle (CSS pixels, as getBoundingClientRect gives them). */
export function insideRect(x: number, y: number, r: { left: number; top: number; right: number; bottom: number }): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}
