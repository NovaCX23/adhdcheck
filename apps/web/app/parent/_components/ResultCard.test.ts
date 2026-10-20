import { describe, expect, it } from "vitest";
import { scoreSession } from "@adhdcheck/scoring";
import { validSessionMetrics } from "../../../../../packages/contracts/src/fixtures/session-metrics.valid";
import type { SessionMetrics } from "@adhdcheck/contracts";
import { isParentNote } from "./ResultCard";

describe("isParentNote", () => {
  it("hides the placeholder scorer's developer note from parents", () => {
    const notes = scoreSession(validSessionMetrics as SessionMetrics).data_quality.notes;
    expect(notes.length).toBeGreaterThan(0); // the stub really writes one, so this test means something
    expect(notes.filter(isParentNote)).toEqual([]);
  });

  it("keeps every other data-quality note", () => {
    expect(["Few trials were played.", "Taps were often early."].filter(isParentNote)).toHaveLength(2);
  });
});
