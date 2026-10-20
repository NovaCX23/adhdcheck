// Only the primary pointer counts as a response: a second finger or a palm would otherwise inflate tap counts.
export function isPrimaryPointer(e: { isPrimary: boolean }): boolean {
  return e.isPrimary;
}
