import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SCORE_DISCLAIMER, ScoreResultSchema } from "@adhdcheck/contracts";
import { validScoreResult } from "../../../../../packages/contracts/src/fixtures/score-result.valid";
import { BandHeadline } from "./BandHeadline";
import { ResultCard } from "./ResultCard";

const TAMPERED = "Tampered text stored in the database.";
const score = ScoreResultSchema.parse({ ...structuredClone(validScoreResult), band: "follow_up_suggested", reasons: ["Reason one."], disclaimer: TAMPERED });
const result = { session_id: score.session_id, started_at: "2026-10-01T10:00:00Z", score } as never;

describe("disclaimer on the result card (FR-33)", () => {
  const html = renderToStaticMarkup(createElement(ResultCard, { result }));

  it("shows the fixed disclaimer before the reasons, not the stored one", () => {
    expect(html).toContain(SCORE_DISCLAIMER);
    expect(html.indexOf(SCORE_DISCLAIMER)).toBeLessThan(html.indexOf("Reason one."));
    expect(html).not.toContain(TAMPERED);
  });

  it("shows the disclaimer once, directly after the headline", () => {
    expect(html.split(SCORE_DISCLAIMER)).toHaveLength(2);
    expect(html.indexOf("</h3>")).toBeLessThan(html.indexOf(SCORE_DISCLAIMER));
  });
});

describe("disclaimer next to a band headline in lists", () => {
  it("renders the headline and the fixed disclaimer", () => {
    const html = renderToStaticMarkup(createElement(BandHeadline, { band: "no_flag" }));
    expect(html).toContain("No specific follow-up indicated by this activity");
    expect(html).toContain(SCORE_DISCLAIMER);
  });
});
