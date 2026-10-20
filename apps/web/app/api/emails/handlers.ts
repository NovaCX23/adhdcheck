import { z } from "zod";
import { missionAddedEmail, weeklySummaryEmail } from "../../../lib/email/messages";
import type { EmailSender } from "../../../lib/email/sender";

// FR-50 parent emails: "new mission" and "weekly summary". Both go to the logged-in parent's own address,
// carry only the dashboard link (no result, no nickname), and answer 200 with the email outcome even when
// sending fails, so the action that triggered them is never undone. Nothing is logged but error codes.

type Parent = { id: string; email: string };
type Deps = { email: EmailSender; getParent(): Promise<Parent | null>; now?: () => Date };

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

function dashboardUrl(request: Request) {
  return `${new URL(request.url).origin}/parent`;
}

const MissionBody = z.strictObject({ mission_id: z.guid() });

// POST /api/emails/mission { mission_id }, called by the parent page right after a mission is added.
export async function handleMissionEmail(
  request: Request,
  deps: Deps & { missionIsOwn(missionId: string): Promise<boolean> },
): Promise<Response> {
  const parent = await deps.getParent();
  if (!parent) return fail(401, "not_logged_in");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_input");
  }
  const parsed = MissionBody.safeParse(body);
  if (!parsed.success) return fail(400, "invalid_input");
  const missionId = parsed.data.mission_id;

  if (!(await deps.missionIsOwn(missionId))) return fail(404, "unknown_mission");

  const email = await deps.email.send({
    to: parent.email,
    message: missionAddedEmail(dashboardUrl(request)),
    idempotencyKey: `mission-added/${missionId}`,
  });
  return Response.json({ email }, { headers: { "cache-control": "no-store" } });
}

// POST /api/emails/weekly: the weekly summary, sent on request until a scheduler exists (TODO: a weekly
// job). The key holds the ISO week, so a parent gets at most one per week.
export async function handleWeeklySummaryEmail(request: Request, deps: Deps): Promise<Response> {
  const parent = await deps.getParent();
  if (!parent) return fail(401, "not_logged_in");

  const week = isoWeek((deps.now ?? (() => new Date()))());
  const email = await deps.email.send({
    to: parent.email,
    message: weeklySummaryEmail(dashboardUrl(request)),
    idempotencyKey: `weekly-summary/${parent.id}/${week}`,
  });
  return Response.json({ email }, { headers: { "cache-control": "no-store" } });
}

// ISO 8601 week, for example "2026-W43" (weeks start on Monday; week 1 holds the year's first Thursday).
export function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
