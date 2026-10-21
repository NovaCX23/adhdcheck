// Only the primary pointer counts as a response: a second finger or a palm would otherwise inflate tap counts.
export function isPrimaryPointer(e: { isPrimary: boolean }): boolean {
  return e.isPrimary;
}

/** True when the point is inside the rectangle (CSS pixels, as getBoundingClientRect gives them). */
export function insideRect(x: number, y: number, r: { left: number; top: number; right: number; bottom: number }): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/**
 * How long an instruction must have been on screen before its Start button accepts a tap. It stops the second tap of
 * a double tap on "Tap to start" (the Start button appears in the same place) from passing the instruction. The
 * button is drawn visibly disabled until then. The instructions have no spoken narration to wait for (only a babble
 * sound effect), so this is one shared value. TODO: design choice, no source (research/03 and 04 give none).
 */
export const START_ENABLE_MS = 1000;
