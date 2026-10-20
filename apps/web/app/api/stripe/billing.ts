import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { buildReport, renderReportPdf } from "../../../lib/report";
import type { EmailLang } from "../../../lib/report-email";
import { SESSION_COLUMNS, toSessionResult } from "../../../lib/data/parent";
import type { Mailer, PaidOutcome } from "./handlers";

// Database and email side of the one-off report purchase (D-05b), with the service-role client
// (report_purchases, auth users) and the Resend client. Server code only: imported by route handlers.

export async function startPurchase(
  admin: SupabaseClient,
  p: { parentId: string; sessionId: string; checkoutId: string; lang: EmailLang },
): Promise<string> {
  const { data, error } = await admin.rpc("start_report_purchase", {
    p_parent_id: p.parentId,
    p_session_id: p.sessionId,
    p_checkout_id: p.checkoutId,
    p_lang: p.lang,
  });
  if (error) throw new Error(`start purchase failed: ${error.message}`);
  return data as string;
}

export async function markPaid(
  admin: SupabaseClient,
  p: { checkoutId: string; parentId: string; sessionId: string; lang: EmailLang },
): Promise<PaidOutcome> {
  const { data, error } = await admin.rpc("mark_report_paid", {
    p_checkout_id: p.checkoutId,
    p_parent_id: p.parentId,
    p_session_id: p.sessionId,
    p_lang: p.lang,
  });
  if (error) throw new Error(`mark paid failed: ${error.message}`);
  const row = (data as { outcome: string; emailed: boolean }[] | null)?.[0];
  if (!row) throw new Error("mark paid failed: no row");
  return { outcome: row.outcome, emailed: row.emailed };
}

export async function markEmailed(admin: SupabaseClient, checkoutId: string): Promise<void> {
  const { error } = await admin.rpc("mark_report_emailed", { p_checkout_id: checkoutId });
  if (error) throw new Error(`mark emailed failed: ${error.message}`);
}

// The address the parent signed up with (Supabase auth), never one from the request or from Stripe.
export async function getParentEmail(admin: SupabaseClient, parentId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(parentId);
  if (error) {
    if (error.status === 404) return null;
    throw new Error(`read parent failed: ${error.message}`);
  }
  return data.user?.email ?? null;
}

// The PDF of one session of one parent. The service role bypasses RLS, so every read is filtered on the
// parent id as well as the session id.
export async function buildPdfFor(admin: SupabaseClient, parentId: string, sessionId: string) {
  const { data: row, error } = await admin
    .from("sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) throw new Error(`read session failed: ${error.message}`);
  if (!row) return null;
  const result = toSessionResult(row as unknown as Parameters<typeof toSessionResult>[0]);
  const { data: child, error: childError } = await admin
    .from("children")
    .select("nickname")
    .eq("id", result.child_id)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (childError) throw new Error(`read child failed: ${childError.message}`);
  if (!child) return null;
  const model = buildReport(result, child.nickname as string);
  if (!model || !result.score) return null;
  return { bytes: await renderReportPdf(model), fileName: model.fileName, band: result.score.band, sessionDate: result.started_at };
}

// Resend: { data, error } on an API answer; a thrown error is a network failure. 4xx except 429 is
// permanent (a 403 means the sender domain is not verified: onboarding@resend.dev only delivers to the
// Resend account owner, https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
export function resendMailer(resend: Resend, from: string): Mailer {
  return {
    async send(mail) {
      try {
        const { error } = await resend.emails.send(
          {
            from,
            to: [mail.to],
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
            attachments: [{ filename: mail.attachment.filename, content: Buffer.from(mail.attachment.content) }],
          },
          { idempotencyKey: mail.idempotencyKey },
        );
        if (!error) return { ok: true };
        const status = error.statusCode ?? 0;
        return { ok: false, permanent: status >= 400 && status < 500 && status !== 429 };
      } catch {
        return { ok: false, permanent: false };
      }
    },
  };
}
