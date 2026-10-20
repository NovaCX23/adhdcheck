import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SCORE_DISCLAIMER } from "@adhdcheck/contracts";
import { sessionResult } from "../../lib/report-test-helpers";
import { ResultCard } from "./_components/ResultCard";
import { BAND_TEXT, S } from "./strings";

// D-05 (DECIDED, Hatem, 2026-10-20): everything is free for parents except downloading the report.

function values(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (o && typeof o === "object") return Object.values(o).flatMap(values);
  return [];
}

describe("free for every parent (D-05, FR-48)", () => {
  it("an unpaid parent sees the full result card and next step, with the download button and no paywall yet", () => {
    // ResultCard takes no subscription input at all: what it shows cannot depend on payment.
    const html = renderToStaticMarkup(createElement(ResultCard, { result: sessionResult("follow_up_suggested") }));
    expect(html).toContain(BAND_TEXT.follow_up_suggested.headline);
    expect(html).toContain(SCORE_DISCLAIMER);
    expect(html).toContain(S.result.indicators);
    expect(html).toContain(S.indicator.omission_rate);
    expect(html).toContain(S.result.nextStep);
    expect(html).toContain(S.result.nextStepText);
    expect(html).toContain(S.report.download);
    expect(html).not.toContain(S.report.paywall);
  });

  it("missions, progress, the child page and the result card never read the subscription", () => {
    for (const f of ["_components/Missions.tsx", "_components/ProgressChart.tsx", "_components/ResultCard.tsx", "[childId]/ChildView.tsx"]) {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src, f).not.toMatch(/getSubscriptionStatus|from\("subscriptions"\)|isPaidStatus/);
    }
  });

  it("no parent text says missions or progress need the plan", () => {
    const offending = values(S).filter((t) => /(missions|progress)[^.]*(plan|subscri)/i.test(t));
    expect(offending).toEqual([]);
  });

  it("the wording check can fail", () => {
    expect(/(missions|progress)[^.]*(plan|subscri)/i.test("Missions and progress tracking come with the family plan.")).toBe(true);
  });
});
