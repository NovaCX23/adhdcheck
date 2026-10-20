import { describe, expect, it } from "vitest";
import { SCORE_DISCLAIMER } from "@adhdcheck/contracts";
import { findBannedWording, findUnnegated } from "../app/landing-copy";
import { BAND_TEXT } from "../app/parent/strings";
import { buildReportEmail } from "./report-email";

// D-05b (DECIDED, Hatem, 2026-10-20): the paid report is sent by email to the parent who paid. The email is
// short and kind, in the parent's language when known, carries the fixed headline and disclaimer in the
// body, no result data in the subject, and no diagnosis, probability, severity or treatment wording.

const BANDS = ["follow_up_suggested", "no_flag", "insufficient_data"] as const;
const DATE = "2026-10-12T16:30:00.000Z";

describe("report email (D-05b)", () => {
  for (const lang of ["en", "ro"] as const) {
    for (const band of BANDS) {
      it(`${lang}, ${band}: subject carries no result, body carries the headline and the disclaimer, wording gate clean`, () => {
        const m = buildReportEmail({ lang, band, sessionDate: DATE });
        for (const b of BANDS) {
          expect(m.subject).not.toContain(BAND_TEXT[b].headline);
        }
        expect(m.subject).not.toMatch(/adhd|assessment|evaluare|follow-up|urmărire|recommend|recomand/i);
        expect(m.text.length).toBeLessThan(900);
        for (const t of [m.subject, m.text, m.html]) {
          expect(findBannedWording([t])).toEqual([]);
          expect(findUnnegated([t.replace(/<[^>]+>/g, " ")])).toEqual([]);
        }
        expect(m.html).not.toMatch(/<script|<img|https?:\/\//i);
      });
    }
  }

  it("English uses the decided headline and the contract disclaimer word for word", () => {
    for (const band of BANDS) {
      const m = buildReportEmail({ lang: "en", band, sessionDate: DATE });
      expect(m.text).toContain(BAND_TEXT[band].headline);
      expect(m.text).toContain(SCORE_DISCLAIMER);
      expect(m.html).toContain(BAND_TEXT[band].headline);
    }
  });

  it("Romanian is Romanian (not the English text)", () => {
    const m = buildReportEmail({ lang: "ro", band: "follow_up_suggested", sessionDate: DATE });
    expect(m.text).toContain("Se recomandă o evaluare de specialitate.");
    expect(m.text).toContain("Acesta nu este un diagnostic");
    expect(m.text).not.toContain(BAND_TEXT.follow_up_suggested.headline);
  });

  it("escapes HTML so no text can inject markup", () => {
    const m = buildReportEmail({ lang: "en", band: "no_flag", sessionDate: "<b>x</b>" as string });
    expect(m.html).not.toContain("<b>x</b>");
  });

  it("the wording gate used here can fail", () => {
    expect(findBannedWording(["Your child likely has ADHD."])).not.toEqual([]);
    expect(findUnnegated(["Here is the diagnosis."])).not.toEqual([]);
  });
});
