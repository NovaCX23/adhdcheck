import { afterEach, describe, expect, it, vi } from "vitest";
import { handleDemoReset, handleDemoStatus } from "./handlers";

const DEMO = { id: "00000000-0000-4000-8000-00000000000a", email: "demo.parent@example.test" };
const OTHER = { id: "00000000-0000-4000-8000-00000000000b", email: "other.parent@example.test" };

function deps({ user = DEMO as typeof DEMO | null, demoEmail = DEMO.email as string | undefined } = {}) {
  const seed = vi.fn().mockResolvedValue(12);
  return { deps: { getUser: async () => user, demoEmail, seed }, seed };
}

function post(contentType = "application/json") {
  return new Request("http://localhost/api/demo/reset", { method: "POST", headers: { "content-type": contentType }, body: "{}" });
}

afterEach(() => vi.restoreAllMocks());

describe("GET /api/demo (FR-56: only the demo account sees Reset demo)", () => {
  it("says is_demo true for the demo account, ignoring email case", async () => {
    const { deps: d } = deps({ user: { ...DEMO, email: DEMO.email.toUpperCase() } });
    expect(await (await handleDemoStatus(d)).json()).toEqual({ is_demo: true });
  });

  it.each([
    ["another parent", { user: OTHER }],
    ["no one logged in", { user: null }],
    ["no demo account configured", { demoEmail: "" }],
  ])("says is_demo false for %s", async (_name, options) => {
    const { deps: d } = deps(options);
    expect(await (await handleDemoStatus(d)).json()).toEqual({ is_demo: false });
  });
});

describe("POST /api/demo/reset (FR-55, FR-56)", () => {
  it("re-seeds the demo account and answers the number of sessions", async () => {
    const { deps: d, seed } = deps();
    const res = await handleDemoReset(post(), d);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessions: 12 });
    expect(seed).toHaveBeenCalledWith(DEMO.id);
  });

  it("answers 401 when no one is logged in", async () => {
    const { deps: d, seed } = deps({ user: null });
    expect((await handleDemoReset(post(), d)).status).toBe(401);
    expect(seed).not.toHaveBeenCalled();
  });

  it("answers 403 for any account other than the demo account", async () => {
    const { deps: d, seed } = deps({ user: OTHER });
    const res = await handleDemoReset(post(), d);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "not_demo_account" });
    expect(seed).not.toHaveBeenCalled();
  });

  it("answers 403 when no demo account is configured", async () => {
    const { deps: d, seed } = deps({ demoEmail: "" });
    expect((await handleDemoReset(post(), d)).status).toBe(403);
    expect(seed).not.toHaveBeenCalled();
  });

  it("refuses a request not sent as JSON (blocks cross-site form posts)", async () => {
    const { deps: d, seed } = deps();
    expect((await handleDemoReset(post("text/plain"), d)).status).toBe(415);
    expect(seed).not.toHaveBeenCalled();
  });

  it("answers 503 when seeding fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps: d, seed } = deps();
    seed.mockRejectedValue(new Error("connection refused"));
    expect((await handleDemoReset(post(), d)).status).toBe(503);
  });
});
