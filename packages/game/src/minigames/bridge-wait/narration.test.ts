import { describe, expect, it } from "vitest";
import { STRINGS } from "./strings";
import { narrationFor } from "./strings";

describe("narrationFor", () => {
  it("is the same text on every trial when the stop signal is enabled, so it never reveals a stop trial", () => {
    const text = narrationFor(true);
    expect(text).toBe(`${STRINGS.narration} ${STRINGS.crowHint}`);
    expect(narrationFor(true)).toBe(text);
  });
  it("is the narration alone when the stop signal is disabled", () => {
    expect(narrationFor(false)).toBe(STRINGS.narration);
  });
});
