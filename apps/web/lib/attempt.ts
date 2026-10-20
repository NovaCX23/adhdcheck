// Runs a write from a form or a button. A failure becomes a value, so the component can show its error
// note in place instead of the exception leaving the form action with no message.
export async function attempt<T>(action: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await action() };
  } catch {
    return { ok: false };
  }
}
