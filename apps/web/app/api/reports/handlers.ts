import type { SessionResult } from "../../../lib/data/parent";
import { buildReport, isPaidStatus, type ReportModel } from "../../../lib/report";
import { isUuid } from "../../../lib/uuid";

// GET /api/reports/<sessionId> (D-05, DECIDED, Hatem, 2026-10-20; FR-48): the parent report as a PDF, the
// only paid feature. The check is here, on the server: the page only shows the paywall when this answers
// 402. Reads use the logged-in parent's own client, so RLS hides every other parent's session (404, even
// with a paid plan). The file is built only after payment is confirmed. Errors are logged by code only.

export type ReportDeps = {
  getParentId(): Promise<string | null>;
  // The session with its score and the child's nickname, or null when RLS shows no such session.
  getReport(sessionId: string): Promise<{ result: SessionResult; nickname: string } | null>;
  // The logged-in parent's own Stripe subscription status (subscriptions, RLS), or null.
  getSubscriptionStatus(): Promise<string | null>;
  renderPdf(model: ReportModel): Promise<Uint8Array>;
};

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function handleReportDownload(sessionId: string, deps: ReportDeps): Promise<Response> {
  if (!(await deps.getParentId())) return fail(401, "not_logged_in");
  if (!isUuid(sessionId)) return fail(404, "unknown_session");

  let model: ReportModel | null;
  let status: string | null;
  try {
    const report = await deps.getReport(sessionId);
    if (!report) return fail(404, "unknown_session");
    model = buildReport(report.result, report.nickname);
    if (!model) return fail(404, "not_scored");
    status = await deps.getSubscriptionStatus();
  } catch {
    console.error("[reports] failed", { error: "storage_unavailable" });
    return fail(503, "storage_unavailable");
  }
  if (!isPaidStatus(status)) return fail(402, "payment_required");

  const bytes = await deps.renderPdf(model);
  return new Response(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${model.fileName}"`,
      "cache-control": "private, no-store",
    },
  });
}
