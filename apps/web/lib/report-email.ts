import { SCORE_DISCLAIMER } from "@adhdcheck/contracts";
import { content } from "../app/content";
import { BAND_TEXT } from "../app/parent/strings";

// The email that carries the paid report (D-05b, DECIDED, Hatem, 2026-10-20): sent once, to the parent who
// paid, with the PDF attached. Short and kind, in the parent's language when known (RO or EN). The subject
// holds no result data and does not name the condition, because a subject line shows in inbox previews and
// notifications. The body repeats the fixed headline and the disclaimer exactly as the report does.
// No diagnosis, probability, severity or treatment wording (lib/report-email.test.ts runs the landing gate).
//
// English headline: BAND_TEXT (D-03a); English disclaimer: the contract constant SCORE_DISCLAIMER.
// Romanian headline and disclaimer: the Romanian landing texts already on the public page (app/content.ts).
// TODO (Person 4 / texts owner): approve the RO and EN wording of this email, and the RO headline for
// "insufficient_data", which has no Romanian text on the landing page yet.

export type EmailLang = "ro" | "en";
export type ReportBand = keyof typeof BAND_TEXT;

const RO_HEADLINE: Record<ReportBand, string> = {
  follow_up_suggested: content.ro.result.a,
  no_flag: content.ro.result.b,
  insufficient_data: "Nu sunt destule date din această sesiune. Poți juca din nou.",
};

const TEXT = {
  en: {
    subject: "Your detailed report is attached",
    hello: "Hello,",
    thanks: (date: string) => `Thank you. The detailed report for the session of ${date} is attached as a PDF.`,
    resultLabel: "Result for this session:",
    headline: (band: ReportBand) => BAND_TEXT[band].headline,
    disclaimer: SCORE_DISCLAIMER,
    download: "You can also download it at any time from your parent page.",
    signature: "The ADHDCheck team",
    locale: "en-GB",
  },
  ro: {
    subject: "Raportul tău detaliat este atașat",
    hello: "Bună,",
    thanks: (date: string) => `Mulțumim. Raportul detaliat pentru sesiunea din ${date} este atașat, în format PDF.`,
    resultLabel: "Rezultatul acestei sesiuni:",
    headline: (band: ReportBand) => RO_HEADLINE[band],
    disclaimer: content.ro.result.disclaimer,
    download: "Îl poți descărca oricând și din pagina ta de părinte.",
    signature: "Echipa ADHDCheck",
    locale: "ro-RO",
  },
} as const;

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildReportEmail(input: { lang: EmailLang; band: ReportBand; sessionDate: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const t = TEXT[input.lang];
  const date = new Date(input.sessionDate).toLocaleDateString(t.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const paragraphs = [t.hello, t.thanks(date), `${t.resultLabel} ${t.headline(input.band)}`, t.disclaimer, t.download, t.signature];
  return {
    subject: t.subject,
    text: paragraphs.join("\n\n"),
    html: paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n"),
  };
}
