import { afterEach, describe, expect, it, vi } from "vitest";

// Missing Supabase settings must answer 503 (as /api/sessions does), not an unhandled 500.
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    throw new Error("Supabase: settings are not set");
  },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getClaims: async () => ({ data: null }) } }) }));

afterEach(() => vi.restoreAllMocks());

describe("play-link routes without Supabase settings", () => {
  it("POST /api/play-links answers 503 storage_unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/play-links", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "storage_unavailable" });
  });

  it("GET /api/play-links/[code] answers 503 storage_unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { GET } = await import("./[code]/route");
    const res = await GET(new Request("http://localhost/api/play-links/x") as never, { params: Promise.resolve({ code: "x" }) } as never);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "storage_unavailable" });
  });
});
