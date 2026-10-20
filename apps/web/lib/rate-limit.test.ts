import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientKey, createSupabaseRateLimiter } from "./rate-limit";

function requestFrom(forwardedFor?: string) {
  const headers: Record<string, string> = forwardedFor ? { "x-forwarded-for": forwardedFor } : {};
  return new Request("http://localhost/api/sessions", { method: "POST", headers });
}

describe("clientKey (NFR-13)", () => {
  it("keys on a hash of the first forwarded address, never the address itself", () => {
    const key = clientKey(requestFrom("203.0.113.7, 10.0.0.1"), "sessions");

    expect(key).toMatch(/^sessions:[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(key).toBe(clientKey(requestFrom("203.0.113.7"), "sessions"));
    expect(key).not.toBe(clientKey(requestFrom("203.0.113.8"), "sessions"));
  });

  it("gives every request without an address the same key", () => {
    expect(clientKey(requestFrom(), "sessions")).toBe(clientKey(requestFrom(), "sessions"));
  });
});

describe("SupabaseRateLimiter", () => {
  function fakeClient(result: { data: unknown; error: { message: string } | null }) {
    const rpc = vi.fn().mockResolvedValue(result);
    return { client: { rpc } as unknown as SupabaseClient, rpc };
  }

  it("calls take_rate_limit with the key, the limit and the window", async () => {
    const { client, rpc } = fakeClient({ data: true, error: null });
    const allowed = await createSupabaseRateLimiter(client, { limit: 5, windowSeconds: 60 }).take("sessions:abc");

    expect(allowed).toBe(true);
    expect(rpc).toHaveBeenCalledWith("take_rate_limit", { p_bucket: "sessions:abc", p_limit: 5, p_window_seconds: 60 });
  });

  it("answers false when the limit is reached", async () => {
    const { client } = fakeClient({ data: false, error: null });
    expect(await createSupabaseRateLimiter(client, { limit: 5, windowSeconds: 60 }).take("k")).toBe(false);
  });

  it("throws on a database error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "connection refused" } });
    await expect(createSupabaseRateLimiter(client, { limit: 5, windowSeconds: 60 }).take("k")).rejects.toThrow();
  });
});
