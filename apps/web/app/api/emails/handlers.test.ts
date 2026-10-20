import { afterEach, describe, expect, it, vi } from "vitest";
import { missionAddedEmail, weeklySummaryEmail } from "../../../lib/email/messages";
import type { EmailSender } from "../../../lib/email/sender";
import { handleMissionEmail, handleWeeklySummaryEmail, isoWeek } from "./handlers";

const PARENT = { id: "00000000-0000-4000-8000-00000000000a", email: "parent.synthetic@example.test" };
const MISSION = "00000000-0000-4000-8000-0000000000aa";
const DASHBOARD = "http://localhost/parent";

function request(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deps({ parent = PARENT as typeof PARENT | null, owns = true, result = "sent" } = {}) {
  const email = { send: vi.fn().mockResolvedValue(result) } satisfies EmailSender;
  const missionIsOwn = vi.fn().mockResolvedValue(owns);
  return { email, missionIsOwn, getParent: async () => parent, now: () => new Date("2026-10-20T12:00:00Z") };
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/emails/mission (FR-50 new mission)", () => {
  it("emails the logged-in parent a link to the dashboard, once per mission", async () => {
    const d = deps();
    const res = await handleMissionEmail(request("/api/emails/mission", { mission_id: MISSION }), d);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "sent" });
    expect(d.missionIsOwn).toHaveBeenCalledWith(MISSION);
    expect(d.email.send).toHaveBeenCalledWith({
      to: PARENT.email,
      message: missionAddedEmail(DASHBOARD),
      idempotencyKey: `mission-added/${MISSION}`,
    });
  });

  it("answers 401 without a logged-in parent and sends nothing", async () => {
    const d = deps({ parent: null });
    const res = await handleMissionEmail(request("/api/emails/mission", { mission_id: MISSION }), d);
    expect(res.status).toBe(401);
    expect(d.email.send).not.toHaveBeenCalled();
  });

  it("answers 404 for a mission that is not the parent's and sends nothing", async () => {
    const d = deps({ owns: false });
    const res = await handleMissionEmail(request("/api/emails/mission", { mission_id: MISSION }), d);
    expect(res.status).toBe(404);
    expect(d.email.send).not.toHaveBeenCalled();
  });

  it.each([[{}], [{ mission_id: "nope" }], [{ mission_id: MISSION, extra: 1 }]])("answers 400 for %j", async (body) => {
    const d = deps();
    expect((await handleMissionEmail(request("/api/emails/mission", body), d)).status).toBe(400);
    expect(d.email.send).not.toHaveBeenCalled();
  });

  it("answers 200 with the email outcome when sending fails, so the mission itself stays added", async () => {
    const res = await handleMissionEmail(request("/api/emails/mission", { mission_id: MISSION }), deps({ result: "failed" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: "failed" });
  });
});

describe("POST /api/emails/weekly (FR-50 weekly summary)", () => {
  it("emails the logged-in parent the dashboard link, at most once per ISO week", async () => {
    const d = deps();
    const res = await handleWeeklySummaryEmail(request("/api/emails/weekly", {}), d);

    expect(res.status).toBe(200);
    expect(d.email.send).toHaveBeenCalledWith({
      to: PARENT.email,
      message: weeklySummaryEmail(DASHBOARD),
      idempotencyKey: `weekly-summary/${PARENT.id}/2026-W43`,
    });
  });

  it("answers 401 without a logged-in parent", async () => {
    const d = deps({ parent: null });
    expect((await handleWeeklySummaryEmail(request("/api/emails/weekly", {}), d)).status).toBe(401);
    expect(d.email.send).not.toHaveBeenCalled();
  });
});

describe("isoWeek", () => {
  it.each([
    ["2026-10-20T12:00:00Z", "2026-W43"],
    ["2026-01-01T12:00:00Z", "2026-W01"],
    ["2027-01-01T12:00:00Z", "2026-W53"],
  ])("%s is %s", (iso, week) => {
    expect(isoWeek(new Date(iso))).toBe(week);
  });
});
