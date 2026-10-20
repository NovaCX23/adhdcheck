import { afterEach, describe, expect, it, vi } from "vitest";
import { createLazyClient } from "./client";

afterEach(() => vi.unstubAllEnvs());

describe("createLazyClient", () => {
  it("does not need the Supabase variables until the client is used (build without env)", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => createLazyClient()).not.toThrow();
  });

  it("creates the real client on first use and keeps it", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "placeholder-publishable");
    const client = createLazyClient();
    expect(client.auth).toBe(client.auth);
    expect(typeof client.from).toBe("function");
  });
});
